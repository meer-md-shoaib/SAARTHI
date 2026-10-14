import { useEffect, useState } from "react";
import { ScanLine, ShieldAlert, Volume2 } from "lucide-react";
import { BigButton } from "../components/Button";
import { Banner, Card, NumberedList } from "../components/bits";
import { SceneArt, type SceneKind } from "../components/illustrations";
import {
  CHECK_ICON,
  CHECK_STYLE,
  OUTCOME_ICON,
  OUTCOME_STYLE,
  SEVERITY_ICON,
  SEVERITY_STYLE,
} from "../components/icons";
import { useApp, useNav } from "../state";
import type { Outcome } from "../types";

const OUTCOME_ART: Record<Outcome, SceneKind> = {
  low_concern: "safe",
  be_careful: "check",
  high_concern: "threat",
  unable_to_verify: "question",
};

function rupees(value: number | null): string {
  if (value === null) return "—";
  return `\u20B9${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function ResultScreen() {
  const { t, speakIfOn } = useApp();
  const { route, go } = useNav();
  const [showChecks, setShowChecks] = useState(false);

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

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">{t.result.title}</h1>

      {/* verdict */}
      <section className="overflow-hidden rounded-3xl border border-navy/10 bg-paper shadow-soft">
        <SceneArt kind={OUTCOME_ART[result.outcome]} className="w-full" />
        <div className="space-y-4 p-5">
          <span
            className={`inline-flex items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-xl font-extrabold ${OUTCOME_STYLE[result.outcome]}`}
          >
            <OutcomeIcon className="h-7 w-7" aria-hidden="true" />
            {result.outcome_label}
          </span>
          <p className="text-2xl font-extrabold leading-snug">{result.summary}</p>
          <p className="text-lg leading-relaxed text-navy/90">{result.explanation}</p>

          <BigButton
            full
            variant="navy"
            onClick={() => speakIfOn(speakText)}
            icon={<Volume2 className="h-6 w-6" />}
          >
            {t.result.listenExplanation}
          </BigButton>
          <p className="text-center text-sm text-navy/70">{t.result.readAloudHint}</p>
        </div>
      </section>

      {/* warning signs */}
      <section aria-labelledby="warning-signs">
        <h2 id="warning-signs" className="mb-3 text-xl font-extrabold sm:text-2xl">
          {t.result.warningSigns}
        </h2>
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
                      <SignIcon className="mt-1 h-7 w-7 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold">{sign.title}</p>
                        <p className="mt-1 text-navy/90">{sign.detail}</p>
                        {sign.evidence ? (
                          <p className="mt-2 break-all rounded-xl bg-paper/80 px-3 py-2 text-sm">
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
      </section>

      {/* next steps */}
      <section aria-labelledby="next-steps">
        <h2 id="next-steps" className="mb-3 text-xl font-extrabold sm:text-2xl">
          {t.result.nextSteps}
        </h2>
        <Card>
          <NumberedList items={result.recommended_actions} />
        </Card>
      </section>

      {result.outcome === "high_concern" ? (
        <BigButton full variant="coral" onClick={() => go({ screen: "sos" })} icon={<ShieldAlert className="h-6 w-6" />}>
          {t.result.openSos}
        </BigButton>
      ) : null}

      {/* disclaimer */}
      <Banner tone="tip" icon={<ShieldAlert className="h-7 w-7" aria-hidden="true" />} title={t.result.important}>
        <p>{result.disclaimer}</p>
        <p className="mt-1 text-sm text-navy/75">{t.result.engineNote(result.engine_version)}</p>
      </Banner>

      {/* what we read */}
      <section aria-labelledby="what-we-read">
        <h2 id="what-we-read" className="mb-3 text-xl font-extrabold sm:text-2xl">
          {t.result.whatWeRead}
        </h2>
        <Card>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-bold text-navy/70">{t.result.kind}</dt>
              <dd className="text-lg font-bold">
                {t.result.kinds[extracted.kind] ?? extracted.kind}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-navy/70">{t.result.payee}</dt>
              <dd className="break-all text-lg font-bold">
                {extracted.payee_vpa ?? t.common.notShown}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-navy/70">{t.result.payeeName}</dt>
              <dd className="text-lg font-bold">{extracted.payee_name ?? t.common.notShown}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-navy/70">{t.result.amountInCode}</dt>
              <dd className="text-lg font-bold">{rupees(extracted.amount)}</dd>
            </div>
            {expectation.expectedAmount !== null ? (
              <div>
                <dt className="text-sm font-bold text-navy/70">{t.result.amountExpected}</dt>
                <dd className="text-lg font-bold">{rupees(expectation.expectedAmount)}</dd>
              </div>
            ) : null}
            {extracted.note ? (
              <div className="sm:col-span-2">
                <dt className="text-sm font-bold text-navy/70">{t.result.note}</dt>
                <dd className="break-words text-lg">{extracted.note}</dd>
              </div>
            ) : null}
            {extracted.link ? (
              <div className="sm:col-span-2">
                <dt className="text-sm font-bold text-navy/70">{t.result.link}</dt>
                <dd className="break-all text-lg">{extracted.link}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
      </section>

      {/* all checks */}
      <Card>
        <BigButton
          full
          variant="outline"
          onClick={() => setShowChecks((open) => !open)}
          ariaLabel={showChecks ? t.result.hideChecks : t.result.allChecks}
        >
          {showChecks ? t.result.hideChecks : t.result.allChecks}
        </BigButton>
        {showChecks ? (
          <ul className="mt-4 space-y-2">
            {result.checks.map((check) => {
              const CheckIcon = CHECK_ICON[check.status];
              return (
                <li
                  key={check.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border-2 px-3 py-2.5 ${CHECK_STYLE[check.status]}`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <CheckIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="truncate font-bold">{check.title}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold">
                    {result.status_labels[check.status]}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Card>

      {/* check another */}
      <BigButton
        full
        variant="teal"
        onClick={() => go({ screen: "scan" })}
        icon={<ScanLine className="h-6 w-6" />}
      >
        {t.result.checkAnother}
      </BigButton>
    </div>
  );
}
