import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Keyboard, Mic, ScanLine, Sparkles, X } from "lucide-react";
import { ApiError, api } from "../api";
import { BigButton } from "../components/Button";
import { Banner, Card, Spinner } from "../components/bits";
import type { Dict } from "../i18n";
import type { Scanner } from "../lib/scanner";
import { LiveSpeechRecognizer } from "../lib/speechRecognition";
import { useApp, useNav } from "../state";
import type { Intention } from "../types";
import { DEMO_SCENARIOS } from "../data/demo";

type Method = "camera" | "manual" | "demo";

function cameraErrorText(kind: "permission" | "notfound" | "busy" | "unsupported" | "generic", t: Dict): string {
  switch (kind) {
    case "permission":
      return t.scan.cameraPermission;
    case "notfound":
    case "unsupported":
      return t.scan.cameraNotFound;
    case "busy":
      return t.scan.cameraInUse;
    default:
      return t.scan.cameraGeneric;
  }
}

function parseAmount(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function errorText(error: unknown, t: Dict): string {
  if (error instanceof ApiError) {
    if (error.kind === "timeout") return t.common.timeoutError;
    if (error.kind === "network") return t.common.serverError;
    return error.message;
  }
  return t.scan.analyzeFailed;
}

export function ScanScreen() {
  const { t, lang } = useApp();
  const { go } = useNav();

  const [step, setStep] = useState<"method" | "details">("method");
  const [method, setMethod] = useState<Method>("camera");
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState<"camera" | "manual" | "demo">("manual");
  const [intention, setIntention] = useState<Intention | null>(null);
  const [amountText, setAmountText] = useState("");
  const [cameraState, setCameraState] = useState<"off" | "starting" | "on">("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [dictationInterim, setDictationInterim] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<Scanner | null>(null);
  const recognizerRef = useRef<LiveSpeechRecognizer | null>(null);

  const stopDictation = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setIsDictating(false);
    setDictationInterim("");
  }, []);

  const startDictation = useCallback(() => {
    const recognizer = new LiveSpeechRecognizer();
    recognizerRef.current = recognizer;
    setIsDictating(true);
    setDictationInterim("");
    recognizer.start(lang, {
      onInterim: (interim) => {
        setDictationInterim(interim);
      },
      onFinal: (finalText) => {
        setRawText((prev) => (prev.trim() ? `${prev.trim()} ${finalText}` : finalText));
        setIsDictating(false);
        setDictationInterim("");
      },
      onError: () => {
        setIsDictating(false);
        setDictationInterim("");
      },
      onEnd: () => {
        setIsDictating(false);
        setDictationInterim("");
      },
    });
  }, [lang]);

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop();
      recognizerRef.current = null;
    };
  }, []);

  const stopCamera = useCallback(() => {
    scannerRef.current?.stop();
    scannerRef.current = null;
    setCameraState("off");
  }, []);

  /* Release the camera whenever we leave the camera panel. */
  useEffect(() => {
    if (method !== "camera" || step !== "method") stopCamera();
  }, [method, step, stopCamera]);

  useEffect(
    () => () => {
      scannerRef.current?.stop();
    },
    [],
  );

  const startCamera = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    setCameraError(null);
    setCameraState("starting");
    try {
      /* zxing is heavy - load it only when the camera is actually used. */
      const scannerLib = await import("../lib/scanner");
      const scanner = await scannerLib.startQrScanner(video, (text) => {
        const detected = text.trim();
        if (!detected) return;
        scannerRef.current?.stop();
        scannerRef.current = null;
        setRawText(detected);
        setSource("camera");
        setCameraState("off");
        setStep("details");
      });
      scannerRef.current = scanner;
      setCameraState("on");
    } catch (error) {
      scannerRef.current = null;
      setCameraState("off");
      const kind =
        error instanceof Error && "kind" in error && typeof error.kind === "string"
          ? (error.kind as "permission" | "notfound" | "busy" | "unsupported" | "generic")
          : "generic";
      setCameraError(cameraErrorText(kind, t));
    }
  }, [t]);

  const runAnalyze = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    const expectedAmount = parseAmount(amountText);
    try {
      const result = await api.analyze({
        raw_text: rawText.trim(),
        intention: intention ?? "unknown",
        expected_amount: expectedAmount,
        language: lang,
        source,
      });
      go({
        screen: "result",
        result,
        expectation: { intention: intention ?? "unknown", expectedAmount },
      });
    } catch (error) {
      setActionError(errorText(error, t));
    } finally {
      setBusy(false);
    }
  }, [amountText, go, intention, lang, rawText, source, t]);

  const methods: { id: Method; icon: typeof Camera; label: string; sub: string }[] = [
    { id: "camera", icon: Camera, label: t.scan.methodCamera, sub: t.scan.methodCameraSub },
    { id: "manual", icon: Keyboard, label: t.scan.methodManual, sub: t.scan.methodManualSub },
    { id: "demo", icon: Sparkles, label: t.scan.methodDemo, sub: t.scan.methodDemoSub },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">{t.scan.title}</h1>
        <p className="mt-1 text-lg text-navy/80">{t.scan.subtitle}</p>
      </header>

      {step === "method" ? (
        <>
          {/* method chooser */}
          <div className="grid gap-3 sm:grid-cols-3">
            {methods.map((entry) => {
              const Icon = entry.icon;
              const selected = method === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setMethod(entry.id)}
                  aria-pressed={selected}
                  className={`flex min-h-[92px] flex-col items-start gap-1.5 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                    selected
                      ? "border-navy bg-navy text-white"
                      : "border-navy/15 bg-paper text-navy hover:border-navy/45"
                  }`}
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                  <span className="text-lg font-extrabold leading-tight">{entry.label}</span>
                  <span
                    className={`text-sm leading-tight ${selected ? "text-white/85" : "text-navy/70"}`}
                  >
                    {entry.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* camera panel */}
          {method === "camera" ? (
            <Card>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={
                  cameraState === "off"
                    ? "hidden"
                    : "aspect-[4/3] w-full rounded-2xl bg-navy object-cover"
                }
              />
              {cameraState === "off" ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-extrabold">{t.scan.cameraTitle}</h2>
                    <p className="mt-1 text-navy/80">{t.scan.cameraHint}</p>
                  </div>
                  {cameraError ? (
                    <Banner tone="danger" title={t.common.errorTitle}>
                      {cameraError}
                    </Banner>
                  ) : null}
                  <BigButton onClick={() => void startCamera()} icon={<Camera className="h-6 w-6" />}>
                    {t.scan.startCamera}
                  </BigButton>
                  <BigButton
                    variant="outline"
                    full
                    onClick={() => setMethod("manual")}
                    icon={<Keyboard className="h-6 w-6" />}
                  >
                    {t.scan.switchToManual}
                  </BigButton>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-center text-lg font-bold text-navy">
                    {cameraState === "starting" ? t.scan.cameraStarting : t.scan.cameraHint}
                  </p>
                  <BigButton
                    variant="coral"
                    full
                    onClick={stopCamera}
                    icon={<X className="h-6 w-6" />}
                  >
                    {t.scan.stopCamera}
                  </BigButton>
                </div>
              )}
            </Card>
          ) : null}

          {/* manual panel */}
          {method === "manual" ? (
            <Card>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-extrabold">{t.scan.manualTitle}</h2>
                <button
                  type="button"
                  onClick={() => {
                    if (isDictating) {
                      stopDictation();
                    } else {
                      startDictation();
                    }
                  }}
                  className={`flex items-center gap-2 rounded-2xl border-2 px-3.5 py-1.5 text-sm font-extrabold shadow-xs transition-all ${
                    isDictating
                      ? "animate-pulse border-coral bg-coral text-white"
                      : "border-teal bg-teal/10 text-teal-dark hover:bg-teal hover:text-white"
                  }`}
                  aria-label={isDictating ? t.scan.stopDictation : t.scan.voiceDictate}
                >
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  <span>{isDictating ? t.scan.stopDictation : t.scan.voiceDictate}</span>
                </button>
              </div>

              {isDictating ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-coral/30 bg-coral/5 px-3 py-2 text-sm font-bold text-coral-dark">
                  <span className="h-2.5 w-2.5 animate-ping rounded-full bg-coral" />
                  <span>{dictationInterim ? `"${dictationInterim}..."` : t.scan.listeningDictation}</span>
                </div>
              ) : null}

              <label className="mt-3 block">
                <span className="sr-only">{t.scan.manualTitle}</span>
                <textarea
                  value={rawText}
                  onChange={(event) => setRawText(event.target.value)}
                  rows={5}
                  placeholder={t.scan.manualPlaceholder}
                  className="w-full rounded-2xl border-2 border-navy/20 bg-paper p-4 text-lg break-all focus:border-navy"
                />
              </label>
              <p className="mt-2 text-sm text-navy/70">{t.scan.manualHint}</p>
              <div className="mt-4">
                <BigButton
                  full
                  disabled={!rawText.trim()}
                  onClick={() => {
                    setSource("manual");
                    setStep("details");
                  }}
                  icon={<ScanLine className="h-6 w-6" />}
                >
                  {t.common.continueBtn}
                </BigButton>
              </div>
            </Card>
          ) : null}

          {/* demo panel */}
          {method === "demo" ? (
            <Card>
              <h2 className="text-xl font-extrabold">{t.scan.demoTitle}</h2>
              <ul className="mt-3 space-y-3">
                {DEMO_SCENARIOS.map((scenario) => (
                  <li key={scenario.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setRawText(scenario.raw_text);
                        setIntention(scenario.intention);
                        setAmountText(
                          scenario.expected_amount === null ? "" : String(scenario.expected_amount),
                        );
                        setSource("demo");
                        setStep("details");
                      }}
                      className="w-full rounded-2xl border-2 border-navy/15 bg-paper px-4 py-3.5 text-left transition-colors hover:border-teal"
                    >
                      <span className="block text-lg font-extrabold">{scenario.title[lang]}</span>
                      <span className="mt-0.5 block text-navy/75">{scenario.description[lang]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          {/* what we will check */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-extrabold">{t.scan.enteredLabel}</h2>
              <BigButton
                variant="outline"
                onClick={() => setStep("method")}
                icon={<ArrowLeft className="h-5 w-5" />}
              >
                {t.nav.back}
              </BigButton>
            </div>
            <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded-2xl bg-navy/6 p-4 text-base">
              {rawText}
            </p>
          </Card>

          {/* intent + amount */}
          <Card>
            <h2 className="text-xl font-extrabold">{t.scan.detailsTitle}</h2>
            <p className="mt-1 text-lg text-navy/85">{t.scan.intentQuestion}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <BigButton
                full
                variant={intention === "pay" ? "teal" : "outline"}
                onClick={() => setIntention("pay")}
                icon={<ArrowLeft className="h-6 w-6 rotate-180" />}
              >
                <span>
                  <span className="block text-lg font-extrabold">{t.scan.intentPay}</span>
                  <span className="block text-sm font-medium opacity-85">
                    {t.scan.intentPaySub}
                  </span>
                </span>
              </BigButton>
              <BigButton
                full
                variant={intention === "receive" ? "coral" : "outline"}
                onClick={() => setIntention("receive")}
                icon={<ArrowLeft className="h-6 w-6" />}
              >
                <span>
                  <span className="block text-lg font-extrabold">{t.scan.intentReceive}</span>
                  <span className="block text-sm font-medium opacity-85">
                    {t.scan.intentReceiveSub}
                  </span>
                </span>
              </BigButton>
            </div>

            {intention === "receive" ? (
              <Banner
                className="mt-4"
                tone="tip"
                title={t.scan.intentReceive}
              >
                {t.scan.receiveWarning}
              </Banner>
            ) : null}

            {intention === "pay" ? (
              <label className="mt-5 block">
                <span className="block text-lg font-extrabold">{t.scan.amountLabel}</span>
                <input
                  value={amountText}
                  onChange={(event) => setAmountText(event.target.value)}
                  inputMode="decimal"
                  placeholder={t.scan.amountPlaceholder}
                  className="mt-2 w-full rounded-2xl border-2 border-navy/20 bg-paper p-4 text-2xl font-bold focus:border-navy"
                />
                <span className="mt-1 block text-sm text-navy/70">{t.scan.amountHint}</span>
              </label>
            ) : null}

            {actionError ? (
              <Banner className="mt-4" tone="danger" title={t.common.errorTitle}>
                {actionError}
              </Banner>
            ) : null}

            <div className="mt-5">
              <BigButton
                full
                disabled={!intention || !rawText.trim() || busy}
                onClick={() => void runAnalyze()}
                icon={<ScanLine className="h-6 w-6" />}
              >
                {t.scan.checkBtn}
              </BigButton>
            </div>
          </Card>
        </>
      )}

      {/* loading overlay */}
      {busy ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream/85 px-4">
          <Card className="w-full max-w-md">
            <Spinner label={t.scan.checking} />
            <p className="mt-3 text-center text-navy/75">{t.scan.checkingSub}</p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
