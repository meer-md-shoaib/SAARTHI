import { motion } from "framer-motion";
import { ChevronRight, ShieldAlert, Volume2 } from "lucide-react";
import { Banner } from "../components/bits";
import { SaarthiMascot, SceneArt } from "../components/illustrations";
import { useApp, useNav } from "../state";
import type { Route } from "../state";

const CARD_ART: Record<string, "qr" | "thinking" | "check"> = {
  scan: "qr",
  ask: "thinking",
  learn: "check",
};

export function HomeScreen() {
  const { t } = useApp();
  const { go } = useNav();

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
      {/* greeting */}
      <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="shrink-0"
        >
          <SaarthiMascot className="h-28 w-28" />
        </motion.div>
        <div>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{t.app.greeting}</h1>
          <p className="mt-1 text-lg text-navy/80">{t.app.tagline}</p>
        </div>
      </section>

      {/* three main actions */}
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

      {/* reminder */}
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
