import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Phone,
  PhoneCall,
  ShieldAlert,
  Volume2,
} from "lucide-react";
import { BigButton } from "../components/Button";
import { Banner, Card, NumberedList } from "../components/bits";
import { SceneArt } from "../components/illustrations";
import { FamilyAvatar } from "../components/FamilyAvatar";
import { SOS_CHOICES, type SosChoice } from "../data/sos";
import {
  EMERGENCY_CONTACTS,
  EMERGENCY_MESSAGES,
  CYBER_CRIME_PORTAL,
  type EmergencyContact,
} from "../data/emergencyContacts";
import { useApp } from "../state";

export function SosScreen() {
  const { t, lang, speakIfOn } = useApp();
  const [selected, setSelected] = useState<SosChoice | null>(null);
  const [dispatchedContact, setDispatchedContact] = useState<EmergencyContact | null>(null);

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

  const handleSendAlert = (contact: EmergencyContact) => {
    const message = EMERGENCY_MESSAGES[lang];
    setDispatchedContact(contact);

    // Speak confirmation
    speakIfOn(t.sos.alertSent(contact.name[lang]));

    // Trigger SMS application intent with pre-filled urgent message
    const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  // Section 1: Immediate Family Emergency Contacts
  const renderEmergencyContacts = () => (
    <Card className="border-2 border-coral/30 bg-white">
      <div className="flex items-center gap-2 text-coral-dark">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        <h2 className="text-xl font-extrabold">{t.sos.emergencyContactsTitle}</h2>
      </div>
      <p className="mt-1 text-base text-navy/80">{t.sos.emergencyContactsSub}</p>

      {dispatchedContact ? (
        <div className="mt-3 flex items-center justify-between rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4 text-emerald-900">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
            <p className="font-bold text-base">
              {t.sos.alertSent(dispatchedContact.name[lang])}
            </p>
          </div>
          <a
            href={`tel:${dispatchedContact.phone}`}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
          >
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            {t.sos.callContact}
          </a>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {EMERGENCY_CONTACTS.map((contact) => (
          <div
            key={contact.id}
            className="flex flex-col items-center rounded-2xl border-2 border-navy/10 bg-paper p-3 text-center shadow-soft transition-transform hover:-translate-y-1 hover:border-coral"
          >
            <FamilyAvatar role={contact.avatarRole} className="h-18 w-18" />
            <span className="mt-2 text-lg font-extrabold text-navy">
              {contact.name[lang]}
            </span>
            <span
              className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${contact.badgeBg}`}
            >
              {contact.relation[lang]}
            </span>

            {/* Quick alert and call actions */}
            <div className="mt-3 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSendAlert(contact)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-coral bg-coral px-2.5 py-2 text-xs font-extrabold text-white shadow-soft transition-colors hover:bg-coral-dark"
                aria-label={`Send SOS alert to ${contact.name[lang]}`}
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                <span>{t.sos.sendAlert}</span>
              </button>

              <div className="flex w-full gap-1.5">
                <a
                  href={`sms:${contact.phone}?body=${encodeURIComponent(EMERGENCY_MESSAGES[lang])}`}
                  className="flex flex-1 items-center justify-center rounded-xl border border-navy/20 bg-white py-1.5 text-xs font-bold text-navy hover:bg-navy/5"
                  title="SMS"
                >
                  SMS
                </a>
                <a
                  href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(EMERGENCY_MESSAGES[lang])}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  title="WhatsApp"
                >
                  WhatsApp
                </a>
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center justify-center rounded-xl border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100"
                  title="Call"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  // Section 2: Official National Cyber Crime Reporting Portal (cybercrime.gov.in)
  const renderCyberCrimePortal = () => (
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
  );

  if (!selected) {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-3xl font-extrabold">{t.sos.title}</h1>
          <p className="mt-1 text-lg font-bold text-coral-dark">{t.sos.subtitle}</p>
          <p className="mt-2 text-lg text-navy/85">{t.sos.intro}</p>
        </header>

        {/* 1. Immediate Family Contacts */}
        {renderEmergencyContacts()}

        {/* 2. National Cyber Crime Reporting Portal */}
        {renderCyberCrimePortal()}

        {/* 3. Scenario choices */}
        <div className="space-y-3">
          <h2 className="text-xl font-extrabold">{t.sos.stepsTitle}</h2>
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
        </div>

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

      {/* Immediate Family Contacts accessible even inside specific guidance */}
      {renderEmergencyContacts()}

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

      {/* National Cyber Crime Reporting Portal */}
      {renderCyberCrimePortal()}

      <Banner tone="danger" icon={<Phone className="h-6 w-6" aria-hidden="true" />} title={t.sos.bankNote}>
        {t.sos.disclaimer}
      </Banner>
    </div>
  );
}
