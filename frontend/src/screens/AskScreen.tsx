import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Send, Volume2 } from "lucide-react";
import { ApiError, api } from "../api";
import { BigButton } from "../components/Button";
import { Banner, Card, Spinner } from "../components/bits";
import type { Dict } from "../i18n";
import {
  AudioRecorder,
  RecorderError,
  extensionFor,
} from "../lib/recorder";
import { useApp } from "../state";
import type { AskResult } from "../types";

type Phase = "idle" | "recording" | "transcribing" | "asking";

function voiceErrorText(code: string | null, fallbackMessage: string | null, t: Dict): string {
  if (fallbackMessage) return fallbackMessage;
  const table = t.voiceErrors as Record<string, string>;
  return (code && table[code]) || t.voiceErrors.generic;
}

function requestErrorText(error: unknown, t: Dict): string {
  if (error instanceof ApiError) {
    if (error.kind === "timeout") return t.common.timeoutError;
    if (error.kind === "network") return t.common.serverError;
    return error.message;
  }
  return t.ask.answerFailed;
}

export function AskScreen() {
  const { t, lang, health, speakIfOn } = useApp();

  const [phase, setPhase] = useState<Phase>("idle");
  const [input, setInput] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      recorderRef.current?.cancel();
      recorderRef.current = null;
    },
    [],
  );

  const askQuestion = useCallback(
    async (text: string, topicId?: string) => {
      const question = text.trim();
      if (!question) {
        setError(t.ask.emptyQuestion);
        return;
      }
      setInput(question);
      setError(null);
      setPhase("asking");
      try {
        const result = await api.ask(question, lang, topicId);
        setAnswer(result);
        speakIfOn(result.answer);
      } catch (requestError) {
        setAnswer(null);
        setError(requestErrorText(requestError, t));
      } finally {
        setPhase("idle");
      }
    },
    [lang, speakIfOn, t],
  );

  const stopRecording = useCallback(async () => {
    clearTimer();
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) {
      setPhase("idle");
      return;
    }
    const recording = await recorder.stop();
    if (!recording) {
      setPhase("idle");
      return;
    }
    setPhase("transcribing");
    try {
      const result = await api.speechToText(
        recording.blob,
        lang,
        `saarthi-${Date.now()}.${extensionFor(recording.mimeType)}`,
      );
      if (result.status === "ok" && result.transcript) {
        setHeard(result.transcript);
        await askQuestion(result.transcript);
      } else {
        setError(voiceErrorText(result.error_code, result.message, t));
        setPhase("idle");
      }
    } catch (requestError) {
      setError(requestErrorText(requestError, t));
      setPhase("idle");
    }
  }, [askQuestion, clearTimer, lang, t]);

  const startRecording = useCallback(async () => {
    setError(null);
    setHeard(null);
    const recorder = new AudioRecorder();
    recorderRef.current = recorder;
    try {
      await recorder.start();
      setPhase("recording");
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        void stopRecording();
      }, 20000);
    } catch (recorderError) {
      recorder.cancel();
      recorderRef.current = null;
      const kind = recorderError instanceof RecorderError ? recorderError.kind : "generic";
      setError(
        kind === "permission"
          ? t.ask.micBlocked
          : kind === "unsupported"
            ? t.ask.micUnsupported
            : t.voiceErrors.generic,
      );
      setPhase("idle");
    }
  }, [clearTimer, stopRecording, t]);

  const busy = phase === "transcribing" || phase === "asking";
  const sttUnavailable = health !== null && !health.voice.stt_configured;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">{t.ask.title}</h1>
        <p className="mt-1 text-lg text-navy/80">{t.ask.subtitle}</p>
      </header>

      {sttUnavailable ? (
        <Banner tone="tip" title={t.ask.voiceUnavailable}>
          {t.ask.voiceUnavailableSub}
        </Banner>
      ) : null}

      {/* microphone */}
      <Card className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => {
            if (phase === "recording") {
              void stopRecording();
            } else if (!busy) {
              void startRecording();
            }
          }}
          disabled={busy}
          aria-label={phase === "recording" ? t.ask.tapToStop : t.ask.micStart}
          className={`flex h-32 w-32 items-center justify-center rounded-full border-4 text-white transition-colors disabled:opacity-50 ${
            phase === "recording"
              ? "animate-pulse border-coral-dark bg-coral"
              : "border-teal-dark bg-teal hover:bg-teal-dark"
          }`}
        >
          <Mic className="h-16 w-16" aria-hidden="true" />
        </button>
        <p className="mt-4 text-center text-lg font-bold">
          {phase === "recording" ? t.ask.listening : t.ask.micLabel}
        </p>
        {phase === "recording" ? (
          <p className="text-center text-base text-navy/70">{t.ask.tapToStop}</p>
        ) : null}

        {phase === "transcribing" ? (
          <div className="mt-4">
            <Spinner label={t.common.loading} />
          </div>
        ) : null}
      </Card>

      {heard ? (
        <Banner tone="neutral" title={`${t.ask.heard}:`}>
          <span className="font-mono">{heard}</span>
        </Banner>
      ) : null}

      {/* typed question */}
      <Card>
        <label className="block">
          <span className="text-lg font-extrabold">{t.ask.askBtn}</span>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={2}
            placeholder={t.ask.askPlaceholder}
            className="mt-2 w-full rounded-2xl border-2 border-navy/20 bg-paper p-4 text-lg focus:border-navy"
          />
        </label>
        {error ? (
          <Banner className="mt-3" tone="danger" title={t.common.errorTitle}>
            {error}
          </Banner>
        ) : null}
        <div className="mt-4">
          <BigButton
            full
            disabled={busy || !input.trim()}
            onClick={() => void askQuestion(input)}
            icon={<Send className="h-6 w-6" />}
          >
            {t.ask.askBtn}
          </BigButton>
        </div>
      </Card>

      {phase === "asking" ? <Spinner label={t.ask.thinking} /> : null}

      {/* answer */}
      {answer ? (
        <Card className="border-teal">
          <h2 className="text-xl font-extrabold text-teal-dark">{t.ask.saarthiSays}</h2>
          <p className="mt-1 text-lg font-bold">{answer.title}</p>
          <p className="mt-2 text-lg leading-relaxed text-navy/90">{answer.answer}</p>
          <div className="mt-4">
            <BigButton
              full
              variant="navy"
              onClick={() => speakIfOn(answer.answer)}
              icon={<Volume2 className="h-6 w-6" />}
            >
              {t.nav.listen}
            </BigButton>
          </div>

          {answer.suggested.length > 0 ? (
            <>
              <h3 className="mt-5 text-base font-extrabold text-navy/80">{t.ask.suggestions}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {answer.suggested.map((item) => (
                  <button
                    key={item.topic_id}
                    type="button"
                    onClick={() => void askQuestion(item.title, item.topic_id)}
                    className="rounded-full border-2 border-navy/25 bg-paper px-4 py-2.5 text-base font-bold transition-colors hover:border-teal"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
