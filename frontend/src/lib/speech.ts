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

const BROWSER_LANG: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
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

export async function speakText(
  text: string,
  language: Lang,
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
  utterance.rate = 0.95;
  utterance.onend = done;
  utterance.onerror = done;
  window.speechSynthesis.speak(utterance);
  await finished;
  return "browser";
}
