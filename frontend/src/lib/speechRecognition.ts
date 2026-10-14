/**
 * Speech Recognition (Voice-to-Text) Engine for SAARTHI SafePay.
 *
 * Provides real-time native speech recognition in Kannada (kn-IN), Hindi (hi-IN),
 * and Indian English (en-IN) via the Web Speech API (webkitSpeechRecognition),
 * with automatic fallback to AudioRecorder and backend `/api/v1/speech-to-text`.
 */

import { AudioRecorder, RecorderError } from "./recorder";
import { api } from "../api";

export type SttLanguage = "en" | "hi" | "kn";

export interface SpeechRecognitionHandlers {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

// Extended Window interface for Web Speech API
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

function langToLocale(lang: SttLanguage): string {
  switch (lang) {
    case "kn":
      return "kn-IN";
    case "hi":
      return "hi-IN";
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
  private timeoutId: number | null = null;

  get listening(): boolean {
    return this.isListening;
  }

  start(lang: SttLanguage, handlers: SpeechRecognitionHandlers): void {
    if (this.isListening) {
      this.stop();
    }

    const SpeechRec = getSpeechRecognitionClass();

    if (SpeechRec) {
      this.startNativeRecognition(SpeechRec, lang, handlers);
    } else {
      // Fallback: use MediaRecorder and backend /api/v1/speech-to-text
      void this.startAudioRecorderFallback(lang, handlers);
    }
  }

  private startNativeRecognition(
    SpeechRec: any,
    lang: SttLanguage,
    handlers: SpeechRecognitionHandlers
  ): void {
    try {
      const recognition = new SpeechRec();
      this.recognition = recognition;
      recognition.lang = langToLocale(lang);
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalAccumulated = "";

      recognition.onstart = () => {
        this.isListening = true;
        playMicTone("start");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0].transcript;
          if (item.isFinal) {
            finalAccumulated += (finalAccumulated ? " " : "") + transcript;
          } else {
            interim += transcript;
          }
        }
        if (interim && handlers.onInterim) {
          handlers.onInterim(interim);
        }
        if (finalAccumulated) {
          handlers.onFinal(finalAccumulated);
        }
      };

      recognition.onerror = (event: any) => {
        // "no-speech" is not a fatal error; ignore if we got some text
        if (event.error === "no-speech") {
          if (!finalAccumulated && handlers.onError) {
            handlers.onError("no_speech");
          }
          return;
        }
        if (handlers.onError) {
          handlers.onError(event.error || "generic");
        }
      };

      recognition.onend = () => {
        this.isListening = false;
        playMicTone("stop");
        if (handlers.onEnd) {
          handlers.onEnd();
        }
      };

      recognition.start();

      // Safety timeout after 25s
      this.timeoutId = window.setTimeout(() => {
        if (this.isListening) {
          this.stop();
        }
      }, 25000);
    } catch (err: any) {
      this.isListening = false;
      if (handlers.onError) {
        handlers.onError(err.message || "permission");
      }
    }
  }

  private async startAudioRecorderFallback(
    lang: SttLanguage,
    handlers: SpeechRecognitionHandlers
  ): Promise<void> {
    const recorder = new AudioRecorder();
    this.recorder = recorder;
    try {
      await recorder.start();
      this.isListening = true;
      playMicTone("start");

      // Auto stop after 15 seconds of fallback recording
      this.timeoutId = window.setTimeout(() => {
        void this.stopFallback(lang, handlers);
      }, 15000);
    } catch (err) {
      this.isListening = false;
      const kind = err instanceof RecorderError ? err.kind : "generic";
      if (handlers.onError) {
        handlers.onError(kind);
      }
    }
  }

  private async stopFallback(
    lang: SttLanguage,
    handlers: SpeechRecognitionHandlers
  ): Promise<void> {
    if (!this.recorder) return;
    this.isListening = false;
    playMicTone("stop");
    try {
      const recording = await this.recorder.stop();
      this.recorder = null;
      if (!recording || recording.blob.size === 0) {
        if (handlers.onError) handlers.onError("empty_audio");
        return;
      }
      const file = new File([recording.blob], `voice.${recording.mimeType.includes("ogg") ? "ogg" : "webm"}`, {
        type: recording.mimeType,
      });
      const result = await api.speechToText(file, lang, file.name);
      if (result.status === "ok" && result.transcript) {
        handlers.onFinal(result.transcript);
      } else {
        if (handlers.onError) handlers.onError(result.error_code || "empty_transcript");
      }
    } catch {
      if (handlers.onError) handlers.onError("generic");
    } finally {
      if (handlers.onEnd) handlers.onEnd();
    }
  }

  stop(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
      this.recognition = null;
    }
    if (this.recorder) {
      this.recorder.cancel();
      this.recorder = null;
    }
    this.isListening = false;
  }
}
