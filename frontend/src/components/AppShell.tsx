import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CircleHelp,
  House,
  Languages,
  Repeat,
  Square,
  Type,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useApp, useNav } from "../state";
import type { Lang } from "../types";
import { SaarthiMascot } from "./illustrations";

const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
];

const SCALE_CLASSES = ["text-sm", "text-base", "text-xl"];

export function AppShell({ children }: { children: ReactNode }) {
  const {
    lang,
    setLang,
    t,
    scale,
    setScale,
    voiceOn,
    setVoiceOn,
    isSpeaking,
    hasLastSpoken,
    stopSpeaking,
    repeatLast,
  } = useApp();
  const { route, go, back, home, canGoBack } = useNav();
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = LANGUAGES.find((entry) => entry.code === lang) ?? LANGUAGES[0];

  const navItems = [
    {
      key: "home",
      icon: House,
      label: t.nav.home,
      onClick: home,
      disabled: false,
      title: t.nav.home,
    },
    {
      key: "back",
      icon: ArrowLeft,
      label: t.nav.back,
      onClick: back,
      disabled: !canGoBack,
      title: t.nav.back,
    },
    {
      key: "help",
      icon: CircleHelp,
      label: t.nav.help,
      onClick: () => go({ screen: "help" }),
      disabled: route.screen === "help",
      title: t.nav.help,
    },
    {
      key: "repeat",
      icon: Repeat,
      label: t.nav.repeat,
      onClick: repeatLast,
      disabled: !hasLastSpoken,
      title: hasLastSpoken ? t.nav.repeat : t.nav.repeatEmpty,
    },
  ];

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* ------------------------------------------------ top bar */}
      <header className="sticky top-0 z-30 border-b border-navy/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={home}
            aria-label={t.nav.home}
            className="flex items-center gap-2.5 rounded-2xl px-1.5 py-1 transition-colors hover:bg-navy/5"
          >
            <SaarthiMascot className="h-11 w-11 shrink-0" />
            <span className="hidden text-left sm:block">
              <span className="block text-lg font-extrabold leading-tight">{t.app.name}</span>
              <span className="block text-xs leading-tight text-navy/70">{t.app.tagline}</span>
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* language picker */}
            <div className="relative">
              <button
                type="button"
                data-testid="language-button"
                onClick={() => setLangOpen((open) => !open)}
                aria-expanded={langOpen}
                aria-label={`${t.nav.language}: ${currentLang.label}`}
                className="flex min-h-[48px] items-center gap-1.5 rounded-2xl border-2 border-navy/15 bg-paper px-3 font-bold transition-colors hover:border-navy/40"
              >
                <Languages className="h-5 w-5" aria-hidden="true" />
                <span className="hidden sm:inline">{currentLang.native}</span>
              </button>
              {langOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-navy/15 bg-paper p-2 shadow-lift">
                    {LANGUAGES.map((entry) => (
                      <button
                        key={entry.code}
                        type="button"
                        data-testid={`lang-option-${entry.code}`}
                        onClick={() => {
                          setLang(entry.code);
                          setLangOpen(false);
                        }}
                        aria-pressed={entry.code === lang}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-left text-lg font-bold transition-colors hover:bg-navy/5 ${
                          entry.code === lang ? "bg-teal-soft" : ""
                        }`}
                      >
                        <span>{entry.native}</span>
                        {entry.code === lang ? (
                          <Check className="h-5 w-5 text-teal-dark" aria-hidden="true" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* text size */}
            <button
              type="button"
              data-testid="text-size-button"
              onClick={() => setScale((scale + 1) % 3)}
              aria-label={`${t.nav.textSize}: ${t.nav.textSizes[scale] ?? ""}`}
              className="flex min-h-[48px] items-center gap-1 rounded-2xl border-2 border-navy/15 bg-paper px-3 font-bold transition-colors hover:border-navy/40"
            >
              <Type className="h-5 w-5" aria-hidden="true" />
              <span className={`${SCALE_CLASSES[scale] ?? "text-base"} leading-none`}>A</span>
            </button>

            {/* voice assistance on/off */}
            <button
              type="button"
              data-testid="voice-toggle"
              onClick={() => setVoiceOn(!voiceOn)}
              aria-pressed={voiceOn}
              aria-label={voiceOn ? t.nav.voiceOn : t.nav.voiceOff}
              title={voiceOn ? t.nav.voiceOn : t.nav.voiceOff}
              className={`flex min-h-[48px] items-center rounded-2xl border-2 px-3 transition-colors ${
                voiceOn
                  ? "border-teal bg-teal text-white hover:bg-teal-dark"
                  : "border-navy/25 bg-paper text-navy/70 hover:border-navy/50"
              }`}
            >
              {voiceOn ? (
                <Volume2 className="h-6 w-6" aria-hidden="true" />
              ) : (
                <VolumeX className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ main */}
      <main className="app-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-32">{children}</div>
      </main>

      {/* ------------------------------------------------ speaking indicator */}
      <AnimatePresence>
        {isSpeaking ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-none fixed inset-x-0 bottom-[110px] z-40 flex justify-center px-4"
          >
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-navy px-4 py-3 text-white shadow-lift">
              <Volume2 className="h-6 w-6 animate-pulse" aria-hidden="true" />
              <span className="font-bold">{t.nav.speaking}</span>
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-coral px-4 py-2 font-bold transition-colors hover:bg-coral-dark"
              >
                <Square className="h-4 w-4" aria-hidden="true" />
                {t.nav.stopSpeaking}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ------------------------------------------------ bottom navigation */}
      <nav
        aria-label="Main"
        className="sticky bottom-0 z-30 border-t border-navy/10 bg-cream/95 backdrop-blur"
      >
        <div className="mx-auto grid w-full max-w-5xl grid-cols-4 gap-1.5 px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                disabled={item.disabled}
                title={item.title}
                aria-label={item.label}
                className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-xs font-bold transition-colors hover:bg-navy/8 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
