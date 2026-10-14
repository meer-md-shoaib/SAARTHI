import { useState, useEffect } from "react";
import { ArrowLeft, Phone, ShieldAlert, Volume2 } from "lucide-react";
import { BigButton } from "../components/Button";
import { Banner, Card, NumberedList } from "../components/bits";
import { SceneArt } from "../components/illustrations";
import { SOS_CHOICES, type SosChoice } from "../data/sos";
import { useApp } from "../state";

export function SosScreen() {
  const { t, lang, speakIfOn } = useApp();
  const [selected, setSelected] = useState<SosChoice | null>(null);

  const titleFor = (choice: SosChoice): string => {
    switch (choice.id) {
      case "pin_otp":
        return t.sos.choicePin;
      case "rushing":
        return t.sos.choiceRush;
      case "unsure":
        return t.sos.choiceQr;
    }
  };

  const guidance = selected ? `${titleFor(selected)}. ${selected.spoken[lang]}` : "";

  /* Read the guidance aloud as soon as it opens. */
  useEffect(() => {
    if (guidance) speakIfOn(guidance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  if (!selected) {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-3xl font-extrabold">{t.sos.title}</h1>
          <p className="mt-1 text-lg font-bold text-coral-dark">{t.sos.subtitle}</p>
          <p className="mt-2 text-lg text-navy/85">{t.sos.intro}</p>
        </header>

        <ul className="space-y-4">
          {SOS_CHOICES.map((choice) => (
            <li key={choice.id}>
              <button
                type="button"
                onClick={() => setSelected(choice)}
                className="flex w-full flex-col overflow-hidden rounded-3xl border-2 border-navy/10 bg-paper text-left shadow-soft transition-colors hover:border-coral sm:flex-row sm:items-center"
              >
                <SceneArt kind={choice.art} className="w-full sm:w-60 sm:shrink-0" />
                <span className="flex-1 px-5 py-4">
                  <span className="block text-xl font-extrabold">{titleFor(choice)}</span>
                  <span className="mt-1 block text-navy/75">{choice.sub[lang]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <Banner tone="info" icon={<ShieldAlert className="h-6 w-6" aria-hidden="true" />} title={t.sos.disclaimerTitle}>
          {t.sos.disclaimer}
        </Banner>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{titleFor(selected)}</h1>
          <p className="mt-1 text-base font-bold text-navy/70">{t.sos.title}</p>
        </div>
        <BigButton
          variant="outline"
          onClick={() => setSelected(null)}
          icon={<ArrowLeft className="h-5 w-5" />}
        >
          {t.sos.chooseAnother}
        </BigButton>
      </div>

      <Card className="overflow-hidden">
        <SceneArt kind={selected.art} className="w-full" />
        <div className="mt-4">
          <h2 className="text-xl font-extrabold">{t.sos.stepsTitle}</h2>
          <div className="mt-3">
            <NumberedList items={selected.steps.map((step) => step[lang])} />
          </div>
        </div>
      </Card>

      <BigButton
        full
        variant="navy"
        onClick={() => speakIfOn(guidance)}
        icon={<Volume2 className="h-6 w-6" />}
      >
        {t.sos.listenGuidance}
      </BigButton>

      <Banner tone="danger" icon={<Phone className="h-6 w-6" aria-hidden="true" />} title={t.sos.bankNote}>
        {t.sos.disclaimer}
      </Banner>
    </div>
  );
}
