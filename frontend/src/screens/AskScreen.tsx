import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Send, Volume2, Sparkles, Phone } from "lucide-react";
import { ApiError, api } from "../api";
import { BigButton } from "../components/Button";
import { Banner, Card, Spinner } from "../components/bits";
import type { Dict } from "../i18n";
import { LiveSpeechRecognizer } from "../lib/speechRecognition";
import { useApp } from "../state";
import type { AskResult, Lang } from "../types";

type Phase = "idle" | "recording" | "transcribing" | "asking";

function requestErrorText(error: unknown, t: Dict): string {
  if (error instanceof ApiError) {
    if (error.kind === "timeout") return t.common.timeoutError;
    if (error.kind === "network") return t.common.serverError;
    return error.message;
  }
  return t.ask.answerFailed;
}

const PRESET_QUESTIONS: Record<Lang, Array<{ label: string; query: string; topicId?: string }>> = {
  en: [
    { label: "Should I share OTP?", query: "Someone is calling and asking for my OTP to verify account", topicId: "pin_otp" },
    { label: "Electricity bill cutoff SMS", query: "Received SMS that electricity will be cut off tonight", topicId: "urgency" },
    { label: "Lottery QR Code", query: "They sent a QR code saying scan to receive lottery prize money", topicId: "scan_to_receive" },
    { label: "Police Digital Arrest", query: "Someone called claiming to be police officer on video call putting me under arrest", topicId: "pressure" },
  ],
  hi: [
    { label: "क्या मैं OTP बताऊँ?", query: "कोई कॉल करके खाता वेरिफाई करने के लिए OTP माँग रहा है", topicId: "pin_otp" },
    { label: "बिजली कटने का मैसेज", query: "मैसेज आया है कि आज रात बिजली कट जाएगी", topicId: "urgency" },
    { label: "लॉटरी क्यूआर कोड", query: "इनाम पाने के लिए क्यूआर कोड स्कैन करने को कहा है", topicId: "scan_to_receive" },
    { label: "पुलिस डिजिटल अरेस्ट", query: "वीडियो कॉल पर कोई पुलिस बनकर धमकी दे रहा है", topicId: "pressure" },
  ],
  kn: [
    { label: "ನಾನು ಒಟಿಪಿ ಹಂಚಿಕೊಳ್ಳಬೇಕೇ?", query: "ಖಾತೆ ಪರಿಶೀಲನೆಗೆ ಯಾರೋ ಕರೆ ಮಾಡಿ ಒಟಿಪಿ ಕೇಳ್ತಿದ್ದಾರೆ", topicId: "pin_otp" },
    { label: "ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಕಡಿತ ಮೆಸೇಜ್", query: "ಇಂದು ರಾತ್ರಿ ವಿದ್ಯುತ್ ಕಡಿತವಾಗುತ್ತದೆ ಎಂಬ ಎಸ್ಎಂಎಸ್ ಬಂದಿದೆ", topicId: "urgency" },
    { label: "ಲಾಟರಿ QR ಕೋಡ್", query: "ಬಹುಮಾನದ ಹಣ ಪಡೆಯಲು QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಎನ್ನಲಾಗಿದೆ", topicId: "scan_to_receive" },
    { label: "ಪೊಲೀಸ್ ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್", query: "ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿ ಪೊಲೀಸ್ ಅಧಿಕಾರಿ ಎಂದು ಹೆದರಿಸುತ್ತಿದ್ದಾರೆ", topicId: "pressure" },
  ],
};

export function AskScreen() {
  const { t, lang, speakIfOn } = useApp();

  const [phase, setPhase] = useState<Phase>("idle");
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognizerRef = useRef<LiveSpeechRecognizer | null>(null);

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop();
      recognizerRef.current = null;
    };
  }, []);

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

  const stopListening = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setPhase("idle");
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setHeard(null);
    setInterim("");
    const recognizer = new LiveSpeechRecognizer();
    recognizerRef.current = recognizer;
    setPhase("recording");

    recognizer.start(lang, {
      onInterim: (liveText) => {
        setInterim(liveText);
      },
      onFinal: (finalText) => {
        setHeard(finalText);
        setInput(finalText);
        setInterim("");
        setPhase("idle");
        void askQuestion(finalText);
      },
      onError: (errCode) => {
        setPhase("idle");
        if (errCode === "no_speech") {
          // User stayed silent; do not show error if text was typed
          return;
        }
        setError(t.voiceErrors.generic);
      },
      onEnd: () => {
        setPhase("idle");
      },
    });
  }, [askQuestion, lang, t]);

  const busy = phase === "transcribing" || phase === "asking";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">{t.ask.title}</h1>
        <p className="mt-1 text-lg text-navy/80">{t.ask.subtitle}</p>
      </header>

      {/* Voice microphone card with audio wave feedback */}
      <Card className="flex flex-col items-center border-2 border-teal/20 py-6 text-center">
        <button
          type="button"
          onClick={() => {
            if (phase === "recording") {
              stopListening();
            } else if (!busy) {
              startListening();
            }
          }}
          disabled={busy}
          aria-label={phase === "recording" ? t.ask.tapToStop : t.ask.micStart}
          className={`relative flex h-32 w-32 items-center justify-center rounded-full border-4 text-white transition-all shadow-md disabled:opacity-50 ${
            phase === "recording"
              ? "animate-pulse border-coral-dark bg-coral scale-105"
              : "border-teal-dark bg-teal hover:bg-teal-dark hover:scale-102"
          }`}
        >
          <Mic className="h-16 w-16" aria-hidden="true" />
          {phase === "recording" ? (
            <span className="absolute -bottom-2 rounded-full bg-coral-dark px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
              {t.ask.listening}
            </span>
          ) : null}
        </button>

        <p className="mt-4 text-xl font-extrabold text-navy">
          {phase === "recording" ? t.ask.listening : t.ask.micLabel}
        </p>

        {phase === "recording" ? (
          <div className="mt-2 flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-coral-dark">{t.ask.tapToStop}</p>
            {interim ? (
              <p className="mt-2 rounded-xl border border-coral/30 bg-coral/5 px-4 py-2 font-bold text-coral-dark text-base">
                "{interim}..."
              </p>
            ) : null}
          </div>
        ) : null}

        {phase === "transcribing" ? (
          <div className="mt-4">
            <Spinner label={t.common.loading} />
          </div>
        ) : null}
      </Card>

      {heard ? (
        <Banner tone="neutral" title={`${t.ask.heard}:`}>
          <span className="font-mono text-base font-bold">"{heard}"</span>
        </Banner>
      ) : null}

      {/* Preset common scam questions for older citizens */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-navy/80">
          <Sparkles className="h-4 w-4 text-amber-600" aria-hidden="true" />
          <h2 className="text-base font-extrabold">{t.ask.suggestions}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS[lang].map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => void askQuestion(item.query, item.topicId)}
              className="rounded-full border-2 border-navy/20 bg-paper px-4 py-2 text-sm font-bold text-navy shadow-xs transition-colors hover:border-teal hover:bg-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Typed question */}
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

      {/* Answer with audio playback */}
      {answer ? (
        <Card className="border-2 border-teal bg-teal/5">
          <h2 className="text-xl font-extrabold text-teal-dark">{t.ask.saarthiSays}</h2>
          <p className="mt-1 text-xl font-black text-navy">{answer.title}</p>
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

      {/* National Cyber Crime Helpline Quick Reminder */}
      <div className="flex items-center justify-between rounded-2xl border border-navy/15 bg-paper p-3">
        <div className="flex items-center gap-2 text-navy/80">
          <Phone className="h-4 w-4 text-red-600" aria-hidden="true" />
          <span className="text-sm font-bold">National Cyber Crime Helpline (24/7): 1930</span>
        </div>
        <a
          href="tel:1930"
          className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white hover:bg-red-700"
        >
          Call 1930
        </a>
      </div>
    </div>
  );
}
