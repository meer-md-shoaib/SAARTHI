import {
  ArrowLeft,
  CircleHelp,
  House,
  Repeat,
  ShieldAlert,
  Sparkles,
  Type,
  Volume2,
} from "lucide-react";
import { Banner, Card, SectionTitle } from "../components/bits";
import { useApp } from "../state";

function Bullet({ icon: Icon, text }: { icon: typeof House; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-1 h-6 w-6 shrink-0 text-teal-dark" aria-hidden="true" />
      <span className="text-lg leading-snug">{text}</span>
    </li>
  );
}

export function HelpScreen() {
  const { t } = useApp();

  return (
    <div className="space-y-2">
      <header>
        <h1 className="text-3xl font-extrabold">{t.help.title}</h1>
        <p className="mt-1 text-lg text-navy/80">{t.help.subtitle}</p>
      </header>

      <Card>
        <h2 className="text-xl font-extrabold">{t.help.controlsTitle}</h2>
        <ul className="mt-3 space-y-3">
          <Bullet icon={House} text={t.help.controlHome} />
          <Bullet icon={ArrowLeft} text={t.help.controlBack} />
          <Bullet icon={CircleHelp} text={t.help.controlHelp} />
          <Bullet icon={Repeat} text={t.help.controlRepeat} />
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-extrabold">{t.help.featuresTitle}</h2>
        <ul className="mt-3 space-y-3">
          <Bullet icon={Sparkles} text={t.help.featureScan} />
          <Bullet icon={Volume2} text={t.help.featureAsk} />
          <Bullet icon={ShieldAlert} text={t.help.featureLearn} />
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-extrabold">{t.help.settingsTitle}</h2>
        <p className="mt-2 text-lg leading-relaxed text-navy/90">{t.help.settingsText}</p>
        <div className="mt-3 flex items-center gap-4 text-navy/70">
          <span className="flex items-center gap-1.5 text-sm font-bold">
            <Volume2 className="h-5 w-5" aria-hidden="true" /> {t.nav.voiceAssist}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-bold">
            <Type className="h-5 w-5" aria-hidden="true" /> {t.nav.textSize}
          </span>
        </div>
      </Card>

      <section aria-labelledby="safety-rules">
        <SectionTitle>
          <span id="safety-rules">{t.help.safetyTitle}</span>
        </SectionTitle>
        <Banner tone="tip" icon={<ShieldAlert className="h-7 w-7" aria-hidden="true" />}>
          <ul className="space-y-2 text-lg font-bold">
            <li>{t.help.safety1}</li>
            <li>{t.help.safety2}</li>
            <li>{t.help.safety3}</li>
            <li>{t.help.safety4}</li>
          </ul>
        </Banner>
      </section>

      <Card>
        <h2 className="text-xl font-extrabold">{t.help.aboutTitle}</h2>
        <p className="mt-2 text-lg leading-relaxed text-navy/90">{t.help.aboutText}</p>
      </Card>
    </div>
  );
}
