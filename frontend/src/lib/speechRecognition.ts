/**
 * Speech Recognition (Voice-to-Text) Engine for SAARTHI SafePay.
 *
 * Primary STT Engine: Sarvam AI Saaras v4 via backend `/api/v1/speech-to-text`.
 * Provides high-accuracy transcription for 22 Indic languages, code-mixing,
 * and Indian English.
 *
 * Parallel live preview: Uses the browser Web Speech API (when available)
 * solely for real-time visual interim feedback while speaking.
 */

import { AudioRecorder, extensionFor, RecorderError } from "./recorder";
import { api } from "../api";

export type SttLanguage =
  | "en"
  | "hi"
  | "kn"
  | "bn"
  | "gu"
  | "ml"
  | "mr"
  | "od"
  | "pa"
  | "ta"
  | "te"
  | "auto"
  | "codemix"
  | string;

export interface SpeechRecognitionHandlers {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isWebSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

function getSpeechRecognitionClass(): any {
  if (typeof window === "undefined") return null;
  const win = window as IWindow;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

function langToLocale(lang: string): string {
  switch (lang.toLowerCase()) {
    case "kn":
      return "kn-IN";
    case "hi":
      return "hi-IN";
    case "bn":
      return "bn-IN";
    case "gu":
      return "gu-IN";
    case "ml":
      return "ml-IN";
    case "mr":
      return "mr-IN";
    case "od":
    case "or":
      return "or-IN";
    case "pa":
      return "pa-IN";
    case "ta":
      return "ta-IN";
    case "te":
      return "te-IN";
    case "en":
    default:
      return "en-IN";
  }
}

/** Play a gentle tone when mic activates or deactivates */
export function playMicTone(type: "start" | "stop") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "start") {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch {
    // Ignore audio context errors if blocked by browser policy
  }
}

export class LiveSpeechRecognizer {
  private recognition: any = null;
  private recorder: AudioRecorder | null = null;
  private isListening = false;
  private isFinalizing = false;
  private timeoutId: number | null = null;
  private liveInterim = "";
  private nativeFinalAccumulated = "";
  private currentHandlers: SpeechRecognitionHandlers | null = null;
  private currentLang = "en";

  get listening(): boolean {
    return this.isListening;
  }

  async start(lang: string, handlers: SpeechRecognitionHandlers): Promise<void> {
    if (this.isListening || this.isFinalizing) {
      await this.stop();
    }

    this.currentHandlers = handlers;
    this.currentLang = lang;
    this.liveInterim = "";
    this.nativeFinalAccumulated = "";

    // 1. Initialize microphone audio recorder for backend Sarvam Saaras v4
    const recorder = new AudioRecorder();
    this.recorder = recorder;

    try {
      await recorder.start();
      this.isListening = true;
      playMicTone("start");
    } catch (err) {
      this.isListening = false;
      this.recorder = null;
      const kind = err instanceof RecorderError ? err.kind : "generic";
      handlers.onError?.(kind);
      handlers.onEnd?.();
      return;
    }

    // 2. Start parallel native Web Speech (if available) strictly for live interim typing preview
    const SpeechRec = getSpeechRecognitionClass();
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        this.recognition = recognition;
        recognition.lang = langToLocale(lang);
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            const transcript = item[0].transcript;
            if (item.isFinal) {
              this.nativeFinalAccumulated += (this.nativeFinalAccumulated ? " " : "") + transcript;
            } else {
              interim += transcript;
            }
          }
          this.liveInterim = interim;
          if (interim && handlers.onInterim) {
            handlers.onInterim(interim);
          }
        };

        recognition.onerror = () => {
          // Native speech errors are non-fatal since Sarvam Saaras v4 is the primary STT
        };

        recognition.start();
      } catch {
        this.recognition = null;
      }
    }

    // 3. Auto-stop after 25s (Saaras v4 supports up to 30s audio clips)
    this.timeoutId = window.setTimeout(() => {
      if (this.isListening) {
        void this.stop();
      }
    }, 25000);
  }

  async stop(): Promise<void> {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (!this.isListening && !this.recorder) {
      return;
    }

    this.isListening = false;
    this.isFinalizing = true;
    playMicTone("stop");

    const handlers = this.currentHandlers;
    const lang = this.currentLang;
    const recorder = this.recorder;
    this.recorder = null;

    // Stop native recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        /* already stopped */
      }
      this.recognition = null;
    }

    // Inform UI that transcription is in progress
    if (this.liveInterim) {
      handlers?.onInterim?.(this.liveInterim);
    }

    // 4. Send recorded audio to backend Sarvam STT
    try {
      if (recorder) {
        const recording = await recorder.stop();
        if (recording && recording.blob.size > 0) {
          const ext = extensionFor(recording.mimeType);
          const file = new File([recording.blob], `voice.${ext}`, {
            type: recording.mimeType,
          });

          // Primary: Sarvam AI Saaras v4
          const result = await api.speechToText(file, lang, file.name);

          if (result.status === "ok" && result.transcript.trim()) {
            handlers?.onFinal(result.transcript.trim());
            return;
          }

          const localFallback = (this.nativeFinalAccumulated.trim() || this.liveInterim.trim());
          // If backend couldn't hear clearly or failed, check native fallback
          if (localFallback) {
            handlers?.onFinal(localFallback);
            return;
          }

          if (result.error_code) {
            handlers?.onError?.(result.error_code);
            return;
          }
        }
      }

      // If audio was empty but native had captured words
      const localFallback = (this.nativeFinalAccumulated.trim() || this.liveInterim.trim());
      if (localFallback) {
        handlers?.onFinal(localFallback);
        return;
      }

      handlers?.onError?.("empty_audio");
    } catch {
      const localFallback = (this.nativeFinalAccumulated.trim() || this.liveInterim.trim());
      if (localFallback) {
        handlers?.onFinal(localFallback);
      } else {
        handlers?.onError?.("generic");
      }
    } finally {
      this.isFinalizing = false;
      handlers?.onEnd?.();
    }
  }

  cancel(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        /* already stopped */
      }
      this.recognition = null;
    }
    if (this.recorder) {
      this.recorder.cancel();
      this.recorder = null;
    }
    this.isListening = false;
    this.isFinalizing = false;
  }
}
