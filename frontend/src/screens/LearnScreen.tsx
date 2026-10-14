import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { SceneArt, type SceneKind } from "../components/illustrations";
import { useApp, useNav, type Route } from "../state";

export function LearnScreen() {
  const { t } = useApp();
  const { go } = useNav();

  const cards: { route: Route; art: SceneKind; title: string; sub: string }[] = [
    {
      route: { screen: "practice" },
      art: "pin",
      title: t.learn.practice.title,
      sub: t.learn.practice.sub,
    },
    {
      route: { screen: "roleplay" },
      art: "threat",
      title: t.learn.roleplay.title,
      sub: t.learn.roleplay.sub,
    },
    {
      route: { screen: "jargon" },
      art: "qr",
      title: t.learn.jargon.title,
      sub: t.learn.jargon.sub,
    },
    {
      route: { screen: "quiz" },
      art: "otp",
      title: t.learn.quiz.title,
      sub: t.learn.quiz.sub,
    },
    { route: { screen: "sos" }, art: "pin", title: t.learn.sos.title, sub: t.learn.sos.sub },
    {
      route: { screen: "story" },
      art: "thinking",
      title: t.learn.story.title,
      sub: t.learn.story.sub,
    },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">{t.learn.title}</h1>
        <p className="mt-1 text-lg text-navy/80">{t.learn.subtitle}</p>
      </header>

      <ul className="space-y-4">
        {cards.map((card, index) => (
          <li key={card.route.screen}>
            <motion.button
              type="button"
              onClick={() => go(card.route)}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 * index, duration: 0.3 }}
              whileTap={{ scale: 0.99 }}
              className="group flex w-full flex-col overflow-hidden rounded-3xl border border-navy/10 bg-paper text-left shadow-soft transition-shadow hover:shadow-lift sm:flex-row sm:items-center"
            >
              <SceneArt kind={card.art} className="w-full sm:w-64 sm:shrink-0" />
              <span className="flex flex-1 items-center justify-between gap-3 px-5 py-4">
                <span>
                  <span className="block text-xl font-extrabold">{card.title}</span>
                  <span className="mt-0.5 block text-navy/75">{card.sub}</span>
                </span>
                <ChevronRight
                  className="h-7 w-7 shrink-0 text-teal transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </motion.button>
          </li>
        ))}
      </ul>
    </div>
  );
}
