/**
 * Voice output.
 *
 * Preferred path: the backend's Sarvam `bulbul:v3` text-to-speech.
 * Fallback path: the browser's own speech synthesis.
 * `speakText` resolves only when playback finishes (or is stopped), and the
 * `onState` callback drives the "Speaking..." indicator.
 */

import { api } from "../api";
import type { Lang } from "../types";

export type SpeakMode = "backend" | "browser" | "none";

const BROWSER_LANG: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  od: "or-IN",
  or: "or-IN",
  pa: "pa-IN",
  ta: "ta-IN",
  te: "te-IN",
};

let currentAudio: HTMLAudioElement | null = null;
let endHandler: (() => void) | null = null;

function stopAudio() {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio = null;
  }
}

/** Stop any current playback and notify the waiting speaker. */
export function stopSpeech(): void {
  stopAudio();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  const handler = endHandler;
  endHandler = null;
  handler?.();
}

/** Play audio from a base64 encoded string with clean cleanup. */
export async function playTtsBase64(base64: string, contentType = "audio/wav"): Promise<void> {
  stopSpeech();
  return new Promise((resolve) => {
    try {
      const audio = new Audio(`data:${contentType};base64,${base64}`);
      currentAudio = audio;
      audio.onended = () => {
        stopAudio();
        resolve();
      };
      audio.onerror = () => {
        stopAudio();
        resolve();
      };
      audio.play().catch(() => resolve());
    } catch {
      resolve();
    }
  });
}

export async function speakText(
  text: string,
  language: Lang | string,
  onState?: (speaking: boolean) => void,
): Promise<SpeakMode> {
  stopSpeech();

  const body = text.trim();
  if (!body) return "none";

  let settle!: () => void;
  const finished = new Promise<void>((resolve) => {
    settle = resolve;
  });
  let ended = false;
  const done = () => {
    if (ended) return;
    ended = true;
    endHandler = null;
    stopAudio();
    onState?.(false);
    settle();
  };
  endHandler = done;
  onState?.(true);

  /* 1) Backend Sarvam TTS ------------------------------------------------ */
  try {
    const result = await api.textToSpeech(body, language);
    if (ended) return "none";
    if (result.status === "ok" && result.audio_base64 && result.content_type) {
      const audio = new Audio(`data:${result.content_type};base64,${result.audio_base64}`);
      currentAudio = audio;
      audio.onended = done;
      audio.onerror = done;
      try {
        await audio.play();
      } catch {
        /* autoplay blocked or decode error - fall back to the browser voice */
        stopAudio();
      }
      if (currentAudio) {
        await finished;
        return "backend";
      }
    }
  } catch {
    /* backend unreachable - fall through to the browser voice */
  }

  if (ended) return "none";

  /* 2) Browser speech synthesis fallback --------------------------------- */
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    done();
    return "none";
  }

  const utterance = new SpeechSynthesisUtterance(body);
  utterance.lang = BROWSER_LANG[language];
  utterance.rate = 0.92; // Slightly gentler pace for elderly listeners

  // Try to find a matching native language voice
  try {
    const voices = window.speechSynthesis.getVoices();
    const langKey = language.toLowerCase();
    const matchedVoice = voices.find((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      if (langKey === "kn") return l.startsWith("kn") || n.includes("kannada");
      if (langKey === "hi") return l.startsWith("hi") || n.includes("hindi");
      return l.startsWith("en-in") || n.includes("india") || l.startsWith("en");
    });
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  } catch {
    /* fallback to default */
  }

  utterance.onend = done;
  utterance.onerror = done;
  window.speechSynthesis.speak(utterance);
  await finished;
  return "browser";
}
