import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronRight,
  Headphones,
  Mic,
  MicOff,
  Radio,
  RotateCcw,
  ShieldAlert,
  Square,
  Volume2,
} from "lucide-react";
import { Banner } from "../components/bits";
import { SceneArt } from "../components/illustrations";
import { useApp, useNav } from "../state";
import type { Route } from "../state";

const CARD_ART: Record<string, "qr" | "thinking" | "check"> = {
  scan: "qr",
  ask: "thinking",
  learn: "check",
};

export function HomeScreen() {
  const {
    t,
    activeLangInfo,
    assistantState,
    interimTranscript,
    lastTranscript,
    lastAssistantResponse,
    isContinuousVoice,
    setIsContinuousVoice,
    startVoiceSession,
    stopVoiceSession,
    cancelVoiceSession,
    voiceErrorMessage,
    repeatLast,
  } = useApp();
  const { go } = useNav();

  const isListening = assistantState === "listening";
  const isProcessing = assistantState === "processing" || assistantState === "transcribing";
  const isSpeaking = assistantState === "speaking";

  const voicePromptExamples = [
    { label: "📷 Scan QR code", command: "Scan QR code" },
    { label: "🛡️ Check suspicious message", command: "Is this message a scam?" },
    { label: "❓ What is a UPI PIN?", command: "What is a UPI PIN?" },
    { label: "🚨 Emergency SOS", command: "Someone is pressuring me to pay" },
  ];

  const cards: { key: "scan" | "ask" | "learn"; route: Route; title: string; sub: string }[] = [
    {
      key: "scan",
      route: { screen: "scan" },
      title: t.home.scanCard.title,
      sub: t.home.scanCard.sub,
    },
    { key: "ask", route: { screen: "ask" }, title: t.home.askCard.title, sub: t.home.askCard.sub },
    {
      key: "learn",
      route: { screen: "learn" },
      title: t.home.learnCard.title,
      sub: t.home.learnCard.sub,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ Primary Voice-First Interface */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-teal/25 bg-gradient-to-b from-paper to-cream/80 p-5 shadow-soft sm:p-7">
        <div className="flex flex-col items-center text-center">
          {/* Header mascot & status */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1 text-xs font-extrabold text-teal-dark">
              <Radio className={`h-3.5 w-3.5 ${isListening ? "animate-pulse text-coral" : "text-teal"}`} />
              Voice-First Assistant ({activeLangInfo.native})
            </span>
          </div>

          <h1 className="text-2xl font-extrabold leading-tight text-navy sm:text-3xl">
            {isListening
              ? "Listening... Speak naturally"
              : isProcessing
                ? "Understanding your request..."
                : isSpeaking
                  ? "Speaking with Sarvam Bulbul..."
                  : activeLangInfo.assistantPrompt}
          </h1>

          <p className="mt-1 text-sm text-navy/70 sm:text-base max-w-md">
            Say <span className="font-bold text-teal-dark">"Scan QR"</span>, ask any safety question, or paste an SMS message to verify.
          </p>

          {/* Glowing Microphone Orb Button */}
          <div className="relative my-6 flex items-center justify-center">
            {/* Concentric pulse rings when listening */}
            {isListening && (
              <>
                <motion.div
                  className="absolute h-36 w-36 rounded-full bg-coral/20"
                  animate={{ scale: [1, 1.4, 1.6], opacity: [0.7, 0.3, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute h-32 w-32 rounded-full bg-coral/30"
                  animate={{ scale: [1, 1.25, 1.45], opacity: [0.8, 0.4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                />
              </>
            )}

            {isSpeaking && (
              <motion.div
                className="absolute h-32 w-32 rounded-full bg-teal/25"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stopVoiceSession();
                } else if (isSpeaking) {
                  cancelVoiceSession();
                } else {
                  startVoiceSession();
                }
              }}
              aria-label={isListening ? "Stop listening" : "Start speaking"}
              className={`relative z-10 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full shadow-lift transition-all transform active:scale-95 ${
                isListening
                  ? "bg-coral text-white ring-4 ring-coral/40"
                  : isSpeaking
                    ? "bg-teal text-white ring-4 ring-teal/40"
                    : isProcessing
                      ? "bg-navy/80 text-white animate-pulse"
                      : "bg-gradient-to-tr from-teal-dark to-teal text-white hover:opacity-95"
              }`}
            >
              {isListening ? (
                <Mic className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
              ) : isSpeaking ? (
                <Square className="h-9 w-9 sm:h-10 sm:w-10" />
              ) : (
                <Mic className="h-10 w-10 sm:h-12 sm:w-12" />
              )}
            </button>
          </div>

          {/* Action indicator labels */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isListening ? (
              <button
                type="button"
                onClick={stopVoiceSession}
                className="flex items-center gap-1.5 rounded-2xl bg-coral/15 px-4 py-2 text-sm font-bold text-coral-dark hover:bg-coral/25"
              >
                <MicOff className="h-4 w-4" /> Tap to finish speaking
              </button>
            ) : isSpeaking ? (
              <button
                type="button"
                onClick={cancelVoiceSession}
                className="flex items-center gap-1.5 rounded-2xl bg-coral/15 px-4 py-2 text-sm font-bold text-coral-dark hover:bg-coral/25"
              >
                <Square className="h-4 w-4" /> Tap to Interrupt
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceSession}
                className="flex items-center gap-2 rounded-2xl bg-teal px-5 py-2.5 text-base font-extrabold text-white shadow-soft transition-all hover:bg-teal-dark"
              >
                <Mic className="h-5 w-5" /> Tap to Speak
              </button>
            )}

            {/* Continuous Mode Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy/70 select-none">
              <input
                type="checkbox"
                checked={isContinuousVoice}
                onChange={(e) => setIsContinuousVoice(e.target.checked)}
                className="h-4 w-4 rounded accent-teal cursor-pointer"
              />
              Continuous Conversation Mode
            </label>
          </div>

          {/* Live speech transcription bubble */}
          <AnimatePresence>
            {(interimTranscript || lastTranscript || lastAssistantResponse) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-5 w-full max-w-xl text-left"
              >
                {/* User transcript */}
                {(interimTranscript || lastTranscript) && (
                  <div className="mb-2.5 flex items-start gap-2.5 rounded-2xl bg-white/90 p-3.5 border border-navy/10 shadow-sm">
                    <span className="shrink-0 rounded-full bg-navy/10 p-1.5 text-navy">
                      <Mic className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-navy/60">You said:</div>
                      <p className="text-sm sm:text-base font-medium text-navy break-words">
                        {interimTranscript || lastTranscript}
                        {interimTranscript && <span className="animate-pulse text-teal"> ...</span>}
                      </p>
                    </div>
                  </div>
                )}

                {/* Assistant response */}
                {lastAssistantResponse && (
                  <div className="flex items-start gap-2.5 rounded-2xl bg-teal-soft/80 p-3.5 border border-teal/20 shadow-sm">
                    <span className="shrink-0 rounded-full bg-teal p-1.5 text-white">
                      <Headphones className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-teal-dark">SAARTHI Assistant:</span>
                        <button
                          type="button"
                          onClick={repeatLast}
                          title="Repeat this response"
                          className="flex items-center gap-1 text-[11px] font-bold text-teal-dark hover:underline"
                        >
                          <RotateCcw className="h-3 w-3" /> Repeat
                        </button>
                      </div>
                      <p className="mt-0.5 text-sm sm:text-base text-navy leading-relaxed break-words">
                        {lastAssistantResponse}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Error banner */}
          {voiceErrorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-coral-soft px-4 py-2.5 text-left text-xs font-bold text-coral-dark border border-coral/30">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{voiceErrorMessage}</span>
              <button
                type="button"
                onClick={startVoiceSession}
                className="ml-auto underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Suggested Quick Voice Commands */}
          <div className="mt-5 w-full">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-navy/60">
              Try saying or tapping:
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {voicePromptExamples.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (item.command.includes("Scan")) {
                      go({ screen: "scan", autoStartCamera: true });
                    } else if (item.command.includes("SOS") || item.command.includes("pressuring")) {
                      go({ screen: "sos" });
                    } else {
                      go({ screen: "ask", initialQuery: item.command });
                    }
                  }}
                  className="rounded-xl border border-navy/15 bg-paper px-3 py-1.5 text-xs font-bold text-navy hover:border-teal hover:bg-teal-soft/40 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Touch / Screen Fallbacks */}
      <div>
        <div className="mb-2 px-1 text-sm font-extrabold text-navy/70">
          Or tap to choose an action:
        </div>
        <section aria-label={t.app.name} className="grid gap-4 sm:grid-cols-3">
          {cards.map((card, index) => (
            <motion.button
              key={card.key}
              type="button"
              onClick={() => go(card.route)}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 * index, duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-navy/10 bg-paper text-left shadow-soft transition-shadow hover:shadow-lift"
            >
              <SceneArt kind={CARD_ART[card.key]} className="w-full" />
              <span className="flex items-center justify-between gap-2 px-5 pb-5 pt-3">
                <span>
                  <span className="block text-xl font-extrabold">{card.title}</span>
                  <span className="mt-0.5 block text-base text-navy/75">{card.sub}</span>
                </span>
                <ChevronRight
                  className="h-7 w-7 shrink-0 text-teal transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </motion.button>
          ))}
        </section>
      </div>

      {/* Crucial Safety Reminder */}
      <Banner tone="tip" icon={<ShieldAlert className="h-7 w-7" aria-hidden="true" />} title={t.app.reminder}>
        <p className="text-navy/85">{t.app.reminderSub}</p>
      </Banner>

      {/* SOS shortcut */}
      <button
        type="button"
        onClick={() => go({ screen: "sos" })}
        className="flex w-full items-center justify-between gap-3 rounded-3xl border-2 border-coral bg-coral-soft px-5 py-4 text-left transition-colors hover:bg-coral hover:text-white"
      >
        <span>
          <span className="block text-xl font-extrabold">{t.home.sosPrompt}</span>
          <span className="mt-0.5 block text-base opacity-90">{t.home.sosPromptSub}</span>
        </span>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral text-white">
          <Volume2 className="h-6 w-6" aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
