import { motion } from "framer-motion";
import { ChevronRight, Gamepad2, Sparkles } from "lucide-react";
import { SceneArt, type SceneKind } from "../components/illustrations";
import { ThreeSafetyShield } from "../components/ThreeSafetyShield";
import { useApp, useNav, type Route } from "../state";

export function LearnScreen() {
  const { t, uiLang } = useApp();
  const { go } = useNav();

  const cards: { route: Route; art: SceneKind; title: string; sub: string; badge?: string }[] = [
    {
      route: { screen: "defender" },
      art: "qr",
      title:
        uiLang === "hi"
          ? "🎮 3D साइबर रक्षक खेल (SafePay 3D Defender)"
          : uiLang === "kn"
            ? "🎮 3D ಸೈಬರ್ ರಕ್ಷಕ ಆಟ (SafePay 3D Defender)"
            : "🎮 SafePay 3D Defender Arcade Game",
      sub:
        uiLang === "hi"
          ? "इंटरैक्टिव Three.js 3D में धोखाधड़ी के हमलों को रोकें और शील्ड जीतें!"
          : uiLang === "kn"
            ? "Three.js 3D ಯಲ್ಲಿ ಲೈವ್ ಸೈಬರ್ ದಾಳಿಗಳನ್ನು ತಡೆಯಿರಿ ಮತ್ತು ಬಹುಮಾನ ಗೆಲ್ಲಿರಿ!"
            : "Interactive 3D Three.js cyber arena — steer your shield to deflect scam attacks!",
      badge: "NEW 3D GAME",
    },
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

      {/* Featured 3D Interactive Banner */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative overflow-hidden rounded-3xl border-2 border-teal/40 bg-gradient-to-br from-teal-dark via-navy to-navy p-6 text-white shadow-lift"
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="w-full sm:w-1/2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/20 px-3 py-1 text-xs font-black tracking-wider text-teal uppercase backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5" />
              {uiLang === "hi" ? "नया 3D अनुभव" : "Interactive 3D Experience"}
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black">
              {uiLang === "hi" ? "सुरक्षा ढाल को नियंत्रित करें!" : "SafePay 3D Defender"}
            </h2>
            <p className="mt-2 text-base text-white/80">
              {uiLang === "hi"
                ? "Three.js द्वारा संचालित जीवंत 3D खेल में फेक OTP, कैशबैक QR और तत्काल धमकियों को रोकें।"
                : "Real-time 3D cyber arena powered by Three.js. Steer your shield to block fraud traps and protect your bank vault."}
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => go({ screen: "defender" })}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal px-5 py-3 text-base font-extrabold text-navy shadow-soft transition-transform hover:scale-105 active:scale-95"
              >
                <Gamepad2 className="h-5 w-5" />
                <span>{uiLang === "hi" ? "3D खेल शुरू करें" : "Launch 3D Game"}</span>
              </button>
            </div>
          </div>
          <div className="w-full sm:w-1/2 flex justify-center">
            <ThreeSafetyShield className="h-52 w-full max-w-xs" celebrate={true} tone="safe" />
          </div>
        </div>
      </motion.div>

      {/* Activity list */}
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
                  {card.badge ? (
                    <span className="mb-1 inline-block rounded-md bg-teal/15 px-2 py-0.5 text-xs font-black text-teal-dark">
                      {card.badge}
                    </span>
                  ) : null}
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
