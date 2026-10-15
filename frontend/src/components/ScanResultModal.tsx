import { useState, useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  PhoneCall,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Volume2,
  X,
} from "lucide-react";
import { BigButton } from "./Button";
import { FamilyAvatar } from "./FamilyAvatar";
import {
  checkForFamilyMismatch,
  findFamilyProfileByUpi,
} from "../data/familyProfiles";
import { useApp } from "../state";
import type { AnalyzeResult, Outcome, Severity } from "../types";

interface ScanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanAgain: () => void;
  result: AnalyzeResult | null;
  rawText: string;
}

const OUTCOME_CONFIG: Record<
  Outcome,
  {
    icon: typeof ShieldCheck;
    badgeStyle: string;
    borderStyle: string;
    headerTone: string;
  }
> = {
  low_concern: {
    icon: ShieldCheck,
    badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-300",
    borderStyle: "border-emerald-500",
    headerTone: "bg-emerald-50",
  },
  be_careful: {
    icon: AlertTriangle,
    badgeStyle: "bg-amber-100 text-amber-900 border-amber-300",
    borderStyle: "border-amber-500",
    headerTone: "bg-amber-50",
  },
  high_concern: {
    icon: ShieldAlert,
    badgeStyle: "bg-rose-100 text-rose-900 border-rose-300",
    borderStyle: "border-rose-500",
    headerTone: "bg-rose-50",
  },
  unable_to_verify: {
    icon: HelpCircle,
    badgeStyle: "bg-slate-100 text-slate-800 border-slate-300",
    borderStyle: "border-slate-400",
    headerTone: "bg-slate-50",
  },
};

const SEVERITY_BADGE: Record<Severity, string> = {
  high: "bg-rose-100 text-rose-800 border-rose-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
};

function formatRupees(amount: number | null): string {
  if (amount === null || Number.isNaN(amount)) return "—";
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function ScanResultModal({
  isOpen,
  onClose,
  onScanAgain,
  result,
  rawText: _rawText,
}: ScanResultModalProps) {
  const { t, uiLang, speak } = useApp();
  const [showVerifyGuide, setShowVerifyGuide] = useState(false);

  const extracted = result?.extracted;
  const outcome = result?.outcome ?? "unable_to_verify";
  const outcomeCfg = OUTCOME_CONFIG[outcome];
  const OutcomeIcon = outcomeCfg.icon;

  // Family profile lookup by exact UPI match
  const familyMatch = useMemo(() => {
    return findFamilyProfileByUpi(extracted?.payee_vpa);
  }, [extracted?.payee_vpa]);

  // Family mismatch / impersonation check
  const familyMismatch = useMemo(() => {
    return checkForFamilyMismatch(
      `${extracted?.payee_name ?? ""} ${extracted?.note ?? ""}`,
      extracted?.payee_vpa,
    );
  }, [extracted?.payee_name, extracted?.note, extracted?.payee_vpa]);

  // Construct simple, senior-friendly explanation sentence
  const simpleExplanation = useMemo(() => {
    const payeeName =
      familyMatch?.name[uiLang] ??
      extracted?.payee_name ??
      extracted?.payee_vpa ??
      t.modal.unnamedRecipient;
    const hasAmount = extracted?.amount !== null && extracted?.amount !== undefined && extracted.amount > 0;
    const amountStr = hasAmount ? formatRupees(extracted.amount) : null;

    if (uiLang === "hi") {
      if (amountStr) {
        return `यह QR कोड आपसे ${payeeName} को ${amountStr} भेजने के लिए कह रहा है।`;
      }
      return `यह QR कोड आपसे ${payeeName} को पैसे भेजने के लिए कह रहा है (राशि QR में तय नहीं है)।`;
    }
    if (uiLang === "kn") {
      if (amountStr) {
        return `ಈ QR ಕೋಡ್ ನಿಮಗೆ ${payeeName} ಅವರಿಗೆ ${amountStr} ಕಳುಹಿಸಲು ಕೇಳುತ್ತಿದೆ.`;
      }
      return `ಈ QR ಕೋಡ್ ನಿಮಗೆ ${payeeName} ಅವರಿಗೆ ಹಣ ಕಳುಹಿಸಲು ಕೇಳುತ್ತಿದೆ (ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿಲ್ಲ).`;
    }
    // English default
    if (amountStr) {
      return `This QR is asking you to send ${amountStr} to ${payeeName}.`;
    }
    return `This QR is asking you to send an open amount to ${payeeName} (amount not specified in QR).`;
  }, [familyMatch, extracted, uiLang, t]);

  // Generate complete spoken guidance text for the speech synthesizer
  const voiceExplanationText = useMemo(() => {
    if (!result) return "";
    const riskLabel =
      outcome === "low_concern"
        ? t.modal.riskLow
        : outcome === "be_careful"
          ? t.modal.riskCaution
          : outcome === "high_concern"
            ? t.modal.riskHigh
            : t.modal.riskUnknown;

    const parts = [
      `${riskLabel}.`,
      simpleExplanation,
      t.modal.moneyFlowExplanation,
      result.explanation ? `${result.explanation}.` : "",
    ];

    if (familyMatch) {
      const famName = familyMatch.name[uiLang] || familyMatch.name.en;
      const famRel = familyMatch.relation[uiLang] || familyMatch.relation.en;
      parts.push(
        uiLang === "hi"
          ? `यह UPI पता आपके सहेजे गए परिवार के सदस्य ${famName} (${famRel}) से मेल खाता है।`
          : uiLang === "kn"
            ? `ಈ UPI ವಿಳಾಸವು ನಿಮ್ಮ ಉಳಿಸಿದ ಕುಟುಂಬದ ಸದಸ್ಯ ${famName} (${famRel}) ಅವರಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ.`
            : `This UPI address matches your saved family contact ${famName} (${famRel}).`,
      );
    }

    if (familyMismatch.hasMismatch) {
      parts.push(t.modal.familyMismatchAlert);
    }

    if (result.recommended_actions.length > 0) {
      parts.push(
        `${t.modal.recommendedActionsHeading}: ${result.recommended_actions.slice(0, 2).join(". ")}.`,
      );
    }

    parts.push(t.modal.disclaimer);

    return parts.filter(Boolean).join(" ");
  }, [result, outcome, t, simpleExplanation, familyMatch, familyMismatch, uiLang]);

  if (!isOpen || !result) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="saarthi-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/80 p-3 sm:p-5 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative my-auto flex w-full max-w-2xl flex-col rounded-3xl border-3 border-navy/20 bg-paper shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Modal Top Bar */}
        <div
          className={`flex items-center justify-between border-b-2 border-navy/10 px-5 py-3.5 sm:px-6 ${outcomeCfg.headerTone}`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1 text-sm font-extrabold ${outcomeCfg.badgeStyle}`}
            >
              <OutcomeIcon className="h-5 w-5" aria-hidden="true" />
              {outcome === "low_concern"
                ? t.modal.riskLow
                : outcome === "be_careful"
                  ? t.modal.riskCaution
                  : outcome === "high_concern"
                    ? t.modal.riskHigh
                    : t.modal.riskUnknown}
            </span>
            <h2 id="saarthi-modal-title" className="text-xl font-extrabold text-navy sm:text-2xl">
              {t.modal.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-navy/20 bg-paper text-navy hover:bg-navy/10 hover:border-navy transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 1. Simple Plain Explanation */}
          <section className="rounded-2xl border-2 border-teal/40 bg-teal/5 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-dark">
              {t.modal.simpleExplanationHeading}
            </p>
            <p className="mt-1.5 text-xl sm:text-2xl font-extrabold text-navy leading-snug">
              {simpleExplanation}
            </p>
            {result.explanation ? (
              <p className="mt-2 text-base text-navy/80 leading-relaxed">
                {result.explanation}
              </p>
            ) : null}
          </section>

          {/* 2. Visual Money Flow: YOUR ACCOUNT → ₹AMOUNT → RECIPIENT */}
          <section
            aria-labelledby="money-flow-heading"
            className="rounded-2xl border-2 border-sun/50 bg-sun-soft/50 p-4 sm:p-5"
          >
            <h3 id="money-flow-heading" className="text-sm font-extrabold uppercase tracking-wide text-navy/70">
              {t.modal.moneyFlowHeading}
            </h3>

            {/* Money Flow Diagram */}
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-2 border-navy/15 bg-paper p-3.5 sm:p-4">
              {/* Account Node */}
              <div className="flex flex-1 flex-col items-center text-center p-2 rounded-xl bg-navy/5 w-full">
                <span className="text-2xl sm:text-3xl" role="img" aria-label="Bank">
                  🏛️
                </span>
                <span className="mt-1 text-sm font-extrabold text-navy">
                  {t.modal.moneyFlowYourAccount}
                </span>
                <span className="text-xs font-semibold text-rose-700">
                  {t.modal.moneyFlowYourAccountSub}
                </span>
              </div>

              {/* Arrow + Amount Node */}
              <div className="flex flex-col items-center px-2 py-1 w-full sm:w-auto">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100 border border-rose-300 rounded-full px-2.5 py-0.5">
                  {t.modal.moneyFlowOutgoing}
                </span>
                <div className="my-1 flex items-center gap-1.5 text-lg font-black text-navy">
                  <ArrowRight className="h-5 w-5 text-rose-600 hidden sm:inline" />
                  <span className="text-xl font-extrabold text-navy sm:text-2xl">
                    {extracted?.amount !== null && extracted?.amount !== undefined && extracted.amount > 0
                      ? formatRupees(extracted.amount)
                      : "₹ ?"}
                  </span>
                  <ArrowRight className="h-5 w-5 text-rose-600 hidden sm:inline" />
                </div>
              </div>

              {/* Recipient Node */}
              <div className="flex flex-1 flex-col items-center text-center p-2 rounded-xl bg-navy/5 w-full min-w-0">
                <span className="text-2xl sm:text-3xl" role="img" aria-label="Recipient">
                  👤
                </span>
                <span className="mt-1 text-sm font-extrabold text-navy truncate max-w-full">
                  {familyMatch
                    ? familyMatch.name[uiLang]
                    : extracted?.payee_name || extracted?.payee_vpa || t.modal.moneyFlowRecipient}
                </span>
                <span className="text-xs font-mono text-navy/70 truncate max-w-full">
                  {extracted?.payee_vpa ?? "UPI Address"}
                </span>
              </div>
            </div>

            {/* Crucial Educational Safety Callout */}
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-navy/15 bg-paper/90 p-3 text-sm text-navy/90">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
              <p className="font-semibold leading-relaxed">
                {t.modal.moneyFlowExplanation}
              </p>
            </div>
          </section>

          {/* 3. Recipient Details & Family Profile Match */}
          <section className="rounded-2xl border-2 border-navy/15 bg-paper p-4 sm:p-5 space-y-3">
            <h3 className="text-base font-extrabold text-navy flex items-center justify-between">
              <span>{t.modal.recipientHeading}</span>
              {familyMatch ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-500 bg-emerald-100 px-3 py-0.5 text-xs font-black text-emerald-900 shadow-xs">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
                  {t.modal.familyMatchLabel}
                </span>
              ) : null}
            </h3>

            {/* Family Match Card */}
            {familyMatch ? (
              <div className="flex items-center gap-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-3.5">
                <FamilyAvatar role={familyMatch.avatarRole} size={64} className="h-16 w-16" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-extrabold text-emerald-950">
                      {familyMatch.name[uiLang]}
                    </p>
                    <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      {familyMatch.relation[uiLang]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-mono text-emerald-900 break-all font-semibold">
                    {extracted?.payee_vpa}
                  </p>
                  <p className="text-xs text-emerald-800 font-medium">
                    Phone: {familyMatch.phone}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Family Mismatch Alert (if note/name mentions family but UPI is different) */}
            {familyMismatch.hasMismatch && !familyMatch ? (
              <div className="flex items-start gap-3 rounded-2xl border-2 border-rose-400 bg-rose-50 p-3.5 text-rose-900">
                <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />
                <div>
                  <p className="text-sm font-extrabold">{t.modal.familyMismatchAlert}</p>
                  <p className="mt-1 text-xs text-rose-800">
                    Claimed name/relation: <span className="font-bold">{familyMismatch.claimedName}</span> ({familyMismatch.claimedRelation}).
                    Expected registered UPI: <span className="font-mono font-bold">{familyMismatch.expectedUpi}</span>.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Standard Recipient Info Grid */}
            <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-navy/4 p-3.5 text-sm">
              <div>
                <span className="block text-xs font-bold text-navy/60 uppercase">
                  {t.modal.upiIdLabel}
                </span>
                <span className="mt-0.5 block font-mono font-extrabold text-base text-navy break-all">
                  {extracted?.payee_vpa ?? t.common.notShown}
                </span>
              </div>

              <div>
                <span className="block text-xs font-bold text-navy/60 uppercase">
                  {t.modal.payeeNameLabel}
                </span>
                <span className="mt-0.5 block font-bold text-base text-navy">
                  {extracted?.payee_name ?? t.modal.unnamedRecipient}
                </span>
                {extracted?.payee_name && !familyMatch ? (
                  <span className="text-xs text-navy/60 italic block">
                    ({t.modal.unverifiedNameNote})
                  </span>
                ) : null}
              </div>

              {extracted?.note ? (
                <div className="sm:col-span-2 border-t border-navy/10 pt-2">
                  <span className="block text-xs font-bold text-navy/60 uppercase">
                    {t.modal.noteLabel}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-navy break-words">
                    &ldquo;{extracted.note}&rdquo;
                  </span>
                </div>
              ) : null}
            </div>
          </section>

          {/* 4. Payment Amount Section */}
          <section className="rounded-2xl border-2 border-navy/15 bg-paper p-4 sm:p-5">
            <h3 className="text-base font-extrabold text-navy">
              {t.modal.amountHeading}
            </h3>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-navy">
                {extracted?.amount !== null && extracted?.amount !== undefined && extracted.amount > 0
                  ? formatRupees(extracted.amount)
                  : t.modal.amountNotSpecified}
              </span>
            </div>

            {extracted?.amount === null || extracted?.amount === undefined ? (
              <div className="mt-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-bold">{t.modal.amountNotSpecifiedHint}</p>
              </div>
            ) : null}
          </section>

          {/* 5. Detected Signals & Rules */}
          {result.warning_signs.length > 0 ? (
            <section className="rounded-2xl border-2 border-rose-300 bg-rose-50/60 p-4 sm:p-5">
              <h3 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                {t.modal.warningSignsHeading}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {result.warning_signs.map((sign) => (
                  <li
                    key={sign.id}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 bg-paper shadow-2xs ${SEVERITY_BADGE[sign.severity]}`}
                  >
                    <span className="mt-0.5 font-bold">⚠️</span>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-navy">{sign.title}</p>
                      <p className="mt-0.5 text-xs text-navy/80">{sign.detail}</p>
                      {sign.evidence ? (
                        <p className="mt-1 text-xs font-mono bg-paper/90 px-2 py-0.5 rounded-md border border-navy/10 inline-block">
                          Evidence: &ldquo;{sign.evidence}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4 text-emerald-950">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <p className="text-base font-extrabold">
                  {t.modal.noWarningSigns}
                </p>
              </div>
            </section>
          )}

          {/* 6. Recommended Actions */}
          {result.recommended_actions.length > 0 ? (
            <section className="rounded-2xl border-2 border-navy/15 bg-paper p-4 sm:p-5">
              <h3 className="text-base font-extrabold text-navy">
                {t.modal.recommendedActionsHeading}
              </h3>
              <ul className="mt-2.5 space-y-2">
                {result.recommended_actions.map((act, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-navy/90 font-medium">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal text-white text-xs font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* 7. Verification Guide Dialog (when toggled) */}
          {showVerifyGuide ? (
            <section className="rounded-2xl border-2 border-blue-300 bg-blue-50/80 p-4 sm:p-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-extrabold text-blue-950 flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-blue-700" />
                  {t.modal.verifyDialogTitle}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowVerifyGuide(false)}
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  {t.modal.verifyCloseBtn}
                </button>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-blue-950">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>{t.modal.verifyTip1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>{t.modal.verifyTip2}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>{t.modal.verifyTip3}</span>
                </li>
              </ul>
            </section>
          ) : null}

          {/* 8. Voice Playback Control */}
          <button
            type="button"
            onClick={() => speak(voiceExplanationText)}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-navy/20 bg-navy/5 py-3 px-4 text-base font-extrabold text-navy hover:bg-navy hover:text-white transition-all shadow-xs"
          >
            <Volume2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{t.modal.listenBtn}</span>
          </button>

          {/* Disclaimer */}
          <p className="text-center text-xs text-navy/60 leading-relaxed px-2">
            {t.modal.disclaimer}
          </p>
        </div>

        {/* Modal Controls: 3 Large Buttons */}
        <div className="border-t-2 border-navy/10 bg-paper p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {/* 1. Understood */}
            <BigButton
              full
              variant="teal"
              onClick={onClose}
              icon={<CheckCircle2 className="h-6 w-6" />}
            >
              {t.modal.btnUnderstood}
            </BigButton>

            {/* 2. Verify Recipient */}
            <BigButton
              full
              variant="outline"
              onClick={() => setShowVerifyGuide((prev) => !prev)}
              icon={<UserCheck className="h-6 w-6" />}
            >
              {t.modal.btnVerifyRecipient}
            </BigButton>

            {/* 3. Scan Again */}
            <BigButton
              full
              variant="coral"
              onClick={() => {
                onScanAgain();
              }}
              icon={<RotateCcw className="h-6 w-6" />}
            >
              {t.modal.btnScanAgain}
            </BigButton>
          </div>
        </div>
      </div>
    </div>
  );
}
