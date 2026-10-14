import {
  ArrowLeft,
  CircleHelp,
  ExternalLink,
  House,
  Phone,
  PhoneCall,
  Repeat,
  ShieldAlert,
  Sparkles,
  Type,
  Volume2,
} from "lucide-react";
import { Banner, Card, SectionTitle } from "../components/bits";
import { CYBER_CRIME_PORTAL } from "../data/emergencyContacts";
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
  const { t, lang } = useApp();

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

      <Card className="border-2 border-navy/15 bg-gradient-to-br from-white to-amber-50/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block rounded-md bg-navy px-2 py-0.5 text-xs font-bold tracking-wider text-amber-300 uppercase">
              Government of India
            </span>
            <h2 className="mt-1 text-xl font-extrabold text-navy">
              {CYBER_CRIME_PORTAL.title[lang]}
            </h2>
            <p className="text-sm font-semibold text-navy/70">
              {CYBER_CRIME_PORTAL.subtitle[lang]}
            </p>
          </div>
          <a
            href={`tel:${CYBER_CRIME_PORTAL.helpline}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-red-500 bg-red-600 px-3.5 py-1.5 text-sm font-black text-white shadow-soft transition-transform hover:scale-105"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>1930</span>
          </a>
        </div>

        <p className="mt-2.5 text-sm leading-relaxed text-navy/85">
          {CYBER_CRIME_PORTAL.description[lang]}
        </p>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <a
            href={CYBER_CRIME_PORTAL.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-navy bg-navy px-4 py-3 text-base font-extrabold text-white shadow-soft transition-colors hover:bg-navy-dark"
          >
            <span>{CYBER_CRIME_PORTAL.actionText[lang]}</span>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href={`tel:${CYBER_CRIME_PORTAL.helpline}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-red-600 bg-red-50 px-4 py-3 text-base font-extrabold text-red-700 shadow-soft transition-colors hover:bg-red-100"
          >
            <PhoneCall className="h-4 w-4 text-red-600" aria-hidden="true" />
            <span>{CYBER_CRIME_PORTAL.callText[lang]}</span>
          </a>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-extrabold">{t.help.aboutTitle}</h2>
        <p className="mt-2 text-lg leading-relaxed text-navy/90">{t.help.aboutText}</p>
      </Card>
    </div>
  );
}
