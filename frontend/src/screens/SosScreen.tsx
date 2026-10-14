import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  Phone,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  Volume2,
} from "lucide-react";
import { api } from "../api";
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
import type { EmergencyRescueResponse } from "../types";

export function SosScreen() {
  const { t, uiLang, lang, speakIfOn } = useApp();
  const [selected, setSelected] = useState<SosChoice | null>(null);
  const [dispatchedContact, setDispatchedContact] = useState<EmergencyContact | null>(null);

  // AI Emergency Rescue Generator state
  const [showRescueForm, setShowRescueForm] = useState(false);
  const [incidentDesc, setIncidentDesc] = useState("");
  const [lostAmount, setLostAmount] = useState("");
  const [fraudUpi, setFraudUpi] = useState("");
  const [rescueLoading, setRescueLoading] = useState(false);
  const [rescueResult, setRescueResult] = useState<EmergencyRescueResponse | null>(null);
  const [rescueError, setRescueError] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState(false);

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

  const guidance = selected ? `${titleFor(selected)}. ${selected.spoken[uiLang]}` : "";

  /* Read the guidance aloud as soon as it opens. */
  useEffect(() => {
    if (guidance) speakIfOn(guidance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handleSendAlert = (contact: EmergencyContact) => {
    const message = EMERGENCY_MESSAGES[uiLang];
    setDispatchedContact(contact);

    // Speak confirmation
    speakIfOn(t.sos.alertSent(contact.name[uiLang]));

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
              {t.sos.alertSent(dispatchedContact.name[uiLang])}
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

      <div className="mt-4 grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 sm:grid-cols-4">
        {EMERGENCY_CONTACTS.map((contact) => (
          <div
            key={contact.id}
            className="flex flex-col items-center rounded-2xl border-2 border-navy/10 bg-paper p-3 text-center shadow-soft transition-transform hover:-translate-y-1 hover:border-coral"
          >
            <FamilyAvatar role={contact.avatarRole} className="h-16 w-16 sm:h-18 sm:w-18" />
            <span className="mt-2 text-base font-extrabold text-navy sm:text-lg">
              {contact.name[uiLang]}
            </span>
            <span
              className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${contact.badgeBg}`}
            >
              {contact.relation[uiLang]}
            </span>

            {/* Quick alert and call actions */}
            <div className="mt-3 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSendAlert(contact)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-coral bg-coral px-2 py-2 text-xs font-extrabold text-white shadow-soft transition-colors hover:bg-coral-dark"
                aria-label={`Send SOS alert to ${contact.name[uiLang]}`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{t.sos.sendAlert}</span>
              </button>

              <div className="flex w-full gap-1">
                <a
                  href={`sms:${contact.phone}?body=${encodeURIComponent(EMERGENCY_MESSAGES[uiLang])}`}
                  className="flex flex-1 items-center justify-center rounded-xl border border-navy/20 bg-white py-1.5 text-xs font-bold text-navy hover:bg-navy/5"
                  title="SMS"
                >
                  SMS
                </a>
                <a
                  href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(EMERGENCY_MESSAGES[uiLang])}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  title="WhatsApp"
                >
                  <span className="hidden min-[400px]:inline">WhatsApp</span>
                  <span className="min-[400px]:hidden">WA</span>
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
            {CYBER_CRIME_PORTAL.title[uiLang]}
          </h2>
          <p className="text-sm font-semibold text-navy/70">
            {CYBER_CRIME_PORTAL.subtitle[uiLang]}
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
        {CYBER_CRIME_PORTAL.description[uiLang]}
      </p>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <a
          href={CYBER_CRIME_PORTAL.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-navy bg-navy px-4 py-3 text-base font-extrabold text-white shadow-soft transition-colors hover:bg-navy-dark"
        >
          <span>{CYBER_CRIME_PORTAL.actionText[uiLang]}</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
        <a
          href={`tel:${CYBER_CRIME_PORTAL.helpline}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-red-600 bg-red-50 px-4 py-3 text-base font-extrabold text-red-700 shadow-soft transition-colors hover:bg-red-100"
        >
          <PhoneCall className="h-4 w-4 text-red-600" aria-hidden="true" />
          <span>{CYBER_CRIME_PORTAL.callText[uiLang]}</span>
        </a>
      </div>
    </Card>
  );

  const handleGenerateRescue = async () => {
    if (!incidentDesc.trim() || rescueLoading) return;
    setRescueLoading(true);
    setRescueError("");
    try {
      const amt = lostAmount ? parseFloat(lostAmount) : null;
      const resp = await api.emergencyRescue(incidentDesc.trim(), isNaN(amt || 0) ? null : amt, fraudUpi.trim() || null, lang);
      setRescueResult(resp);
      speakIfOn(uiLang === "hi" ? "आपकी आपातकालीन शिकायत तैयार है। तुरंत 1930 पर कॉल करें।" : uiLang === "kn" ? "ದೂರು ಸಿದ್ಧವಾಗಿದೆ. ತಕ್ಷಣ 1930ಗೆ ಕರೆ ಮಾಡಿ." : "Your recovery plan and cyber complaint are ready.");
    } catch {
      setRescueError(uiLang === "hi" ? "शिकायत तैयार नहीं हो सकी। कृपया सीधे 1930 पर कॉल करें।" : "Could not generate report. Please dial 1930 immediately.");
    } finally {
      setRescueLoading(false);
    }
  };

  const handleCopyComplaint = () => {
    if (!rescueResult?.complaint_template) return;
    navigator.clipboard.writeText(rescueResult.complaint_template);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Section: Instant AI Fraud Rescue & Cybercrime Complaint Generator
  const renderRescueGenerator = () => (
    <Card className="border-2 border-red-500/40 bg-gradient-to-br from-red-50/70 via-white to-amber-50/50 p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-navy">
              {uiLang === "hi" ? "🚨 मैं ठगी का शिकार हुआ — तुरंत शिकायत जनरेटर" : uiLang === "kn" ? "🚨 ವಂಚನೆಗೊಳಗಾಗಿದ್ದೇನೆ — ತುರ್ತು ದೂರು" : "🚨 Fraud Rescue & Instant Complaint Generator"}
            </h2>
            <p className="text-xs sm:text-sm text-navy/70">
              {uiLang === "hi" ? "2 घंटे के अंदर तुरंत बैंक खाता फ्रीज और पोर्टल शिकायत ड्राफ्ट" : uiLang === "kn" ? "ತಕ್ಷಣ ಬ್ಯಾಂಕ್ ಖಾತೆ ಫ್ರೀಜ್ ಮಾಡಲು ದೂರು ಸಿದ್ಧಪಡಿಸಿ" : "Generate official 1930 & cybercrime.gov.in complaint draft in seconds"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRescueForm((prev) => !prev)}
          className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 transition-all"
        >
          {showRescueForm ? (uiLang === "hi" ? "बंद करें" : "Hide") : (uiLang === "hi" ? "फॉर्म खोलें" : "Open Form")}
        </button>
      </div>

      {showRescueForm && (
        <div className="mt-4 space-y-3 pt-3 border-t border-navy/10 animate-fade-in">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
              {uiLang === "hi" ? "क्या हुआ? (संक्षेप में लिखें):" : uiLang === "kn" ? "ಏನಾಯಿತು? (ವಿವರಿಸಿ):" : "What happened? (Describe incident):"}
            </label>
            <textarea
              rows={2}
              value={incidentDesc}
              onChange={(e) => setIncidentDesc(e.target.value)}
              placeholder={uiLang === "hi" ? "जैसे: मुझे WhatsApp पर कैशबैक लिंक मिला और ₹4,500 कट गए..." : "e.g. Scammer asked me to scan QR for electricity bill, money debited..."}
              className="w-full rounded-2xl border-2 border-navy/20 bg-white p-3 text-sm text-navy focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                {uiLang === "hi" ? "कटी हुई राशि (₹ optional):" : "Amount Lost (₹ optional):"}
              </label>
              <input
                type="number"
                value={lostAmount}
                onChange={(e) => setLostAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-xl border-2 border-navy/20 bg-white px-3 py-2 text-sm text-navy focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                {uiLang === "hi" ? "धोखेबाज का UPI ID / नंबर (optional):" : "Fraudster UPI ID/No. (optional):"}
              </label>
              <input
                type="text"
                value={fraudUpi}
                onChange={(e) => setFraudUpi(e.target.value)}
                placeholder="e.g. fraudster@okaxis"
                className="w-full rounded-xl border-2 border-navy/20 bg-white px-3 py-2 text-sm text-navy focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={rescueLoading || !incidentDesc.trim()}
            onClick={handleGenerateRescue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-extrabold text-white shadow-soft hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>{rescueLoading ? (uiLang === "hi" ? "तैयार कर रहे हैं..." : "Generating Rescue Plan...") : (uiLang === "hi" ? "आपातकालीन शिकायत और कदम बनाएं" : "Generate Rescue Plan & Official Complaint")}</span>
          </button>

          {rescueError && (
            <p className="text-xs font-bold text-red-600">{rescueError}</p>
          )}

          {rescueResult && (
            <div className="mt-4 space-y-4 rounded-2xl border-2 border-red-300 bg-white p-4">
              <h3 className="text-base font-extrabold text-navy flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>{uiLang === "hi" ? "तत्काल उठाए जाने वाले 5 कदम:" : "Immediate Recovery Steps:"}</span>
              </h3>

              <div className="space-y-2">
                {rescueResult.immediate_actions.map((act) => (
                  <div key={act.step_number} className="flex items-start gap-2.5 rounded-xl bg-sand/30 p-2.5 text-xs sm:text-sm text-navy">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-extrabold text-white">
                      {act.step_number}
                    </span>
                    <div className="flex-1">
                      <span className="font-extrabold block">{act.title}</span>
                      <span>{act.action}</span>
                      {act.contact && (
                        <span className="ml-2 inline-block font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          {act.contact}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-navy/70">
                    {uiLang === "hi" ? "सरकारी पोर्टल हेतु तैयार शिकायत पत्र:" : "Official Cyber Crime Portal Complaint Draft:"}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyComplaint}
                    className="flex items-center gap-1 rounded-lg border border-navy/20 bg-paper px-2 py-1 text-xs font-extrabold text-navy hover:bg-navy/10"
                  >
                    {copiedTemplate ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedTemplate ? "Copied!" : "Copy Text"}</span>
                  </button>
                </div>
                <div className="rounded-xl border border-navy/15 bg-sand/20 p-3 font-mono text-xs text-navy/90 whitespace-pre-wrap select-all">
                  {rescueResult.complaint_template}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
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

        {/* 3. AI Instant Fraud Rescue & Complaint Generator */}
        {renderRescueGenerator()}

        {/* 4. Scenario choices */}
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
                    <span className="mt-1 block text-navy/75">{choice.sub[uiLang]}</span>
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

      {/* AI Instant Fraud Rescue & Complaint Generator */}
      {renderRescueGenerator()}

      <Card className="overflow-hidden">
        <SceneArt kind={selected.art} className="w-full" />
        <div className="mt-4">
          <h2 className="text-xl font-extrabold">{t.sos.stepsTitle}</h2>
          <div className="mt-3">
            <NumberedList items={selected.steps.map((step) => step[uiLang])} />
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
