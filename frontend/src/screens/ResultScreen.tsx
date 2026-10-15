import { useEffect, useState } from "react";
import {
  AlertOctagon,
  ArrowRight,
  ChevronDown,
  Info,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  User,
  Volume2,
} from "lucide-react";
import { BigButton } from "../components/Button";
import { Banner, Card, NumberedList } from "../components/bits";
import {
  CHECK_ICON,
  CHECK_STYLE,
  OUTCOME_ICON,
  SEVERITY_ICON,
  SEVERITY_STYLE,
} from "../components/icons";
import { useApp, useNav } from "../state";

function rupees(value: number | null): string {
  if (value === null) return "—";
  return `\u20B9${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function getInitials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "₹";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ResultScreen() {
  const { t, speakIfOn, uiLang } = useApp();
  const { route, go } = useNav();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const result = route.screen === "result" ? route.result : null;
  const expectation = route.screen === "result" ? route.expectation : null;

  const actionsSpoken =
    result && result.recommended_actions.length > 0
      ? ` Recommended next steps: ${result.recommended_actions.slice(0, 2).join(". ")}`
      : "";
  const safetyReminder =
    " Remember: Never share your UPI PIN or OTP. SAARTHI never enters PINs or authorizes payments for you.";

  const speakText = result
    ? `${result.outcome_label}. ${result.summary}. ${result.explanation}.${actionsSpoken}.${safetyReminder}`
    : "";

  /* Voice guidance: read the verdict aloud when the screen opens. */
  useEffect(() => {
    if (speakText) speakIfOn(speakText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result || !expectation) return null;

  const OutcomeIcon = OUTCOME_ICON[result.outcome];
  const extracted = result.extracted;

  const recipientName = extracted.payee_name || extracted.payee_vpa || t.common.notShown;
  const isHighRisk = result.outcome === "high_concern";
  const isSafe = result.outcome === "low_concern";

  const amountDisplay = extracted.amount
    ? rupees(extracted.amount)
    : expectation.expectedAmount
      ? rupees(expectation.expectedAmount)
      : null;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ Elder-Friendly Whom-to-Whom Visual Card */}
      <section className="overflow-hidden rounded-3xl border-2 border-navy/15 bg-paper shadow-lift">
        {/* Top Safety Status Bar */}
        <div
          className={`px-5 py-3.5 flex items-center justify-between gap-3 text-white ${
            isHighRisk
              ? "bg-coral-dark"
              : isSafe
                ? "bg-teal-dark"
                : "bg-amber-600"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isHighRisk ? (
              <AlertOctagon className="h-7 w-7 shrink-0 text-amber-200 animate-pulse" />
            ) : isSafe ? (
              <ShieldCheck className="h-7 w-7 shrink-0 text-emerald-200" />
            ) : (
              <ShieldAlert className="h-7 w-7 shrink-0 text-amber-100" />
            )}
            <span className="text-lg sm:text-xl font-extrabold tracking-wide">
              {result.outcome_label}
            </span>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wider uppercase">
            {isHighRisk ? "Action Needed" : isSafe ? "Verified" : "Caution"}
          </span>
        </div>

        {/* Big Visual Transfer Direction: Sender -> Amount -> Recipient */}
        <div className="p-6 sm:p-8 space-y-6 bg-gradient-to-b from-paper via-sand/20 to-paper">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
            {/* FROM: You / Your Bank Account */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-4 border-blue-500 bg-blue-100 text-blue-700 shadow-md">
                  <User className="h-12 w-12 sm:h-14 sm:w-14" />
                </div>
                <span className="absolute -bottom-2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-extrabold text-white shadow-xs">
                  {uiLang === "hi" ? "प्रेषक" : uiLang === "kn" ? "ಕಳುಹಿಸುವವರು" : "SENDER"}
                </span>
              </div>
              <h2 className="mt-4 text-xl sm:text-2xl font-black text-navy">
                {uiLang === "hi" ? "आप (आपका बैंक खाता)" : uiLang === "kn" ? "ನೀವು (ನಿಮ್ಮ ಬ್ಯಾಂಕ್)" : "You (Your Account)"}
              </h2>
              <span className="text-sm font-bold text-coral-dark">
                {uiLang === "hi" ? "पैसा बाहर जाएगा" : uiLang === "kn" ? "ಹಣ ಕಡಿತಗೊಳ್ಳುತ್ತದೆ" : "Money will leave your bank"}
              </span>
            </div>

            {/* AMOUNT & TRANSFER DIRECTION */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-navy/25 bg-white/80 shadow-xs">
              <span className="text-xs font-black uppercase tracking-wider text-navy/60">
                {uiLang === "hi" ? "भुगतान की जाने वाली राशि" : uiLang === "kn" ? "ವರ್ಗಾವಣೆ ಮೊತ್ತ" : "Transfer Amount"}
              </span>

              <div className="my-2 text-4xl sm:text-5xl font-black tracking-tight text-navy">
                {amountDisplay ?? (
                  <span className="text-2xl font-bold text-navy/60 italic">
                    {uiLang === "hi" ? "ऐप में डालें" : "Enter in App"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm font-extrabold text-teal-dark bg-teal-soft/80 px-3 py-1 rounded-full">
                <span>{uiLang === "hi" ? "भुगतान हो रहा है" : "Paying to"}</span>
                <ArrowRight className="h-4 w-4 animate-pulse" />
              </div>
            </div>

            {/* TO: Recipient */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div
                  className={`flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-4 shadow-md text-2xl sm:text-3xl font-black ${
                    isHighRisk
                      ? "border-coral bg-coral/20 text-coral-dark"
                      : "border-emerald-500 bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {getInitials(recipientName)}
                </div>
                <span
                  className={`absolute -bottom-2 rounded-full px-3 py-0.5 text-xs font-extrabold text-white shadow-xs ${
                    isHighRisk ? "bg-coral-dark" : "bg-emerald-600"
                  }`}
                >
                  {uiLang === "hi" ? "प्राप्तकर्ता" : uiLang === "kn" ? "ಸ್ವೀಕರಿಸುವವರು" : "RECIPIENT"}
                </span>
              </div>
              <h2 className="mt-4 text-xl sm:text-2xl font-black text-navy max-w-xs break-words">
                {recipientName}
              </h2>
              {extracted.payee_vpa && (
                <span className="mt-1 rounded-full bg-navy/10 px-3 py-0.5 font-mono text-xs font-bold text-navy/80 max-w-xs truncate">
                  {extracted.payee_vpa}
                </span>
              )}
            </div>
          </div>

          {/* Simple plain-English summary for elders */}
          <div
            className={`rounded-2xl border-2 p-4 text-center sm:text-left flex flex-col sm:flex-row items-center gap-4 ${
              isHighRisk
                ? "border-coral/40 bg-coral/10 text-coral-dark"
                : isSafe
                  ? "border-teal/30 bg-teal/10 text-navy"
                  : "border-amber-400 bg-amber-50 text-navy"
            }`}
          >
            <div className="shrink-0 p-3 rounded-full bg-white/80 shadow-xs">
              <OutcomeIcon className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-xl sm:text-2xl font-black leading-snug">
                {result.summary}
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-navy/85">
                {result.explanation}
              </p>
            </div>
          </div>

          {/* Primary Quick Voice & SOS Actions for Elders */}
          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <BigButton
              full
              variant="navy"
              onClick={() => speakIfOn(speakText)}
              icon={<Volume2 className="h-6 w-6" />}
            >
              {t.result.listenExplanation}
            </BigButton>

            {isHighRisk ? (
              <BigButton
                full
                variant="coral"
                onClick={() => go({ screen: "sos" })}
                icon={<ShieldAlert className="h-6 w-6" />}
              >
                {t.result.openSos}
              </BigButton>
            ) : (
              <BigButton
                full
                variant="teal"
                onClick={() => go({ screen: "scan" })}
                icon={<ScanLine className="h-6 w-6" />}
              >
                {t.result.checkAnother}
              </BigButton>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Next Steps (Concise Elder Guidance) */}
      <section aria-labelledby="next-steps">
        <h2 id="next-steps" className="mb-3 text-xl font-extrabold sm:text-2xl text-navy">
          {t.result.nextSteps}
        </h2>
        <Card className="border-2 border-navy/10">
          <NumberedList items={result.recommended_actions} />
        </Card>
      </section>

      {/* ------------------------------------------------ Collapsible Technical Breakdown */}
      <section>
        <details
          open={showTechnicalDetails}
          onToggle={(e) => setShowTechnicalDetails(e.currentTarget.open)}
          className="group rounded-3xl border-2 border-navy/15 bg-white p-5 shadow-soft transition-all"
        >
          <summary className="flex cursor-pointer items-center justify-between text-base sm:text-lg font-extrabold text-navy">
            <span className="flex items-center gap-2">
              <Info className="h-5 w-5 text-teal" />
              <span>
                {uiLang === "hi"
                  ? "तकनीकी विवरण और 9 सुरक्षा जांचें देखें"
                  : uiLang === "kn"
                    ? "ತಾಂತ್ರಿಕ ವಿವರ ಮತ್ತು 9 ಸುರಕ್ಷತಾ ಪರೀಕ್ಷೆಗಳು"
                    : "Show Technical Details & 9 Safety Checks"}
              </span>
            </span>
            <ChevronDown className="h-5 w-5 text-navy/60 transition-transform group-open:rotate-180" />
          </summary>

          <div className="mt-5 space-y-5 pt-4 border-t border-navy/10">
            {/* Warning signs details */}
            <div>
              <h3 className="mb-3 text-lg font-extrabold text-navy">
                {t.result.warningSigns}
              </h3>
              {result.warning_signs.length === 0 ? (
                <Banner tone="success" title={t.result.noWarningSigns}>
                  {result.summary}
                </Banner>
              ) : (
                <ul className="space-y-3">
                  {result.warning_signs.map((sign) => {
                    const SignIcon = SEVERITY_ICON[sign.severity];
                    return (
                      <li key={sign.id}>
                        <Card className={SEVERITY_STYLE[sign.severity]}>
                          <div className="flex items-start gap-3">
                            <SignIcon className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
                            <div className="min-w-0">
                              <p className="text-base font-extrabold">{sign.title}</p>
                              <p className="mt-1 text-sm text-navy/90">{sign.detail}</p>
                              {sign.evidence ? (
                                <p className="mt-2 break-all rounded-xl bg-paper/80 px-3 py-1.5 text-xs">
                                  <span className="font-bold">{t.result.evidence}</span>{" "}
                                  <span className="font-mono">&ldquo;{sign.evidence}&rdquo;</span>
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* What we read from code */}
            <div>
              <h3 className="mb-3 text-lg font-extrabold text-navy">
                {t.result.whatWeRead}
              </h3>
              <Card>
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="font-bold text-navy/70">{t.result.kind}</dt>
                    <dd className="font-bold">{t.result.kinds[extracted.kind] ?? extracted.kind}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-navy/70">{t.result.payee}</dt>
                    <dd className="break-all font-bold">{extracted.payee_vpa ?? t.common.notShown}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-navy/70">{t.result.payeeName}</dt>
                    <dd className="font-bold">{extracted.payee_name ?? t.common.notShown}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-navy/70">{t.result.amountInCode}</dt>
                    <dd className="font-bold">{rupees(extracted.amount)}</dd>
                  </div>
                  {extracted.note && (
                    <div className="sm:col-span-2">
                      <dt className="font-bold text-navy/70">{t.result.note}</dt>
                      <dd className="break-words">{extracted.note}</dd>
                    </div>
                  )}
                  {extracted.link && (
                    <div className="sm:col-span-2">
                      <dt className="font-bold text-navy/70">{t.result.link}</dt>
                      <dd className="break-all">{extracted.link}</dd>
                    </div>
                  )}
                </dl>
              </Card>
            </div>

            {/* 9 Safety checks */}
            <div>
              <h3 className="mb-3 text-lg font-extrabold text-navy">
                {t.result.allChecks}
              </h3>
              <ul className="space-y-2">
                {result.checks.map((check) => {
                  const CheckIcon = CHECK_ICON[check.status];
                  return (
                    <li
                      key={check.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border-2 px-3 py-2 text-sm ${CHECK_STYLE[check.status]}`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <CheckIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate font-bold">{check.title}</span>
                      </span>
                      <span className="shrink-0 text-xs font-bold">
                        {result.status_labels[check.status]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Engine disclaimer */}
            <Banner tone="tip" icon={<ShieldAlert className="h-6 w-6" aria-hidden="true" />} title={t.result.important}>
              <p className="text-sm">{result.disclaimer}</p>
              <p className="mt-1 text-xs text-navy/75">{t.result.engineNote(result.engine_version)}</p>
            </Banner>
          </div>
        </details>
      </section>

      {/* Bottom Button if not high concern */}
      {!isHighRisk && (
        <BigButton
          full
          variant="outline"
          onClick={() => go({ screen: "scan" })}
          icon={<ScanLine className="h-6 w-6" />}
        >
          {t.result.checkAnother}
        </BigButton>
      )}
    </div>
  );
}
