import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  FileImage,
  Keyboard,
  ScanLine,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { ApiError, api } from "../api";
import { BigButton } from "../components/Button";
import { Banner, Card, Spinner } from "../components/bits";
import { VisualPaymentCard } from "../components/VisualPaymentCard";
import { DEMO_SCENARIOS } from "../data/demo";
import type { Dict } from "../i18n";
import { findFamilyMatch } from "../lib/family";
import { type Scanner, decodeQrFromImage, playScanChime, startQrScanner } from "../lib/scanner";
import { parseUpiPayment } from "../lib/upi";
import { useApp, useNav } from "../state";
import type { Intention } from "../types";

type Method = "camera" | "manual" | "upload" | "demo";

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
  const [source, setSource] = useState<"camera" | "manual" | "upload" | "demo">("manual");
  const [intention, setIntention] = useState<Intention | null>(null);
  const [amountText, setAmountText] = useState("");
  const [cameraState, setCameraState] = useState<"off" | "starting" | "on">("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<Scanner | null>(null);

  // Real-time parsing of current rawText
  const parsed = useMemo(() => parseUpiPayment(rawText), [rawText]);
  const familyMatch = useMemo(() => findFamilyMatch(parsed.payeeVpa), [parsed.payeeVpa]);

  const stopCamera = useCallback(() => {
    scannerRef.current?.stop();
    scannerRef.current = null;
    setCameraState("off");
  }, []);

  /* Release camera when navigating away from camera tab */
  useEffect(() => {
    if (method !== "camera" || step !== "method") stopCamera();
  }, [method, step, stopCamera]);

  useEffect(
    () => () => {
      scannerRef.current?.stop();
    },
    [],
  );

  const handleDetectedText = useCallback(
    async (detected: string, scanSource: "camera" | "manual" | "upload" | "demo") => {
      const clean = detected.trim();
      if (!clean) return;

      stopCamera();
      setRawText(clean);
      setSource(scanSource);

      const parsedInfo = parseUpiPayment(clean);
      const chosenIntent: Intention = "pay";
      if (parsedInfo.isPayment || clean.toLowerCase().startsWith("upi://pay")) {
        setIntention(chosenIntent);
      }
      if (parsedInfo.amount !== null) {
        setAmountText(String(parsedInfo.amount));
      }

      // If scanned directly through camera: automatically analyze and display the output result!
      if (scanSource === "camera") {
        setBusy(true);
        setActionError(null);
        try {
          const result = await api.analyze({
            raw_text: clean,
            intention: chosenIntent,
            expected_amount: parsedInfo.amount,
            language: lang,
            source: "camera",
          });
          go({
            screen: "result",
            result,
            expectation: { intention: chosenIntent, expectedAmount: parsedInfo.amount },
          });
        } catch (error) {
          setStep("details");
          setActionError(errorText(error, t));
        } finally {
          setBusy(false);
        }
      } else {
        setStep("details");
      }
    },
    [go, lang, stopCamera, t],
  );

  const startCamera = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    setCameraError(null);
    setCameraState("starting");
    try {
      const scanner = await startQrScanner(video, (text) => {
        void handleDetectedText(text, "camera");
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
  }, [handleDetectedText, t]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) return;
      setUploadError(null);
      setUploadLoading(true);

      const previewUrl = URL.createObjectURL(file);
      setUploadedImagePreview(previewUrl);

      try {
        const decodedText = await decodeQrFromImage(file);
        playScanChime();
        handleDetectedText(decodedText, "upload");
      } catch {
        setUploadError(t.scan.uploadNoQr);
      } finally {
        setUploadLoading(false);
      }
    },
    [handleDetectedText, t.scan.uploadNoQr],
  );

  const runAnalyze = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    const expectedAmount = parseAmount(amountText);
    try {
      const result = await api.analyze({
        raw_text: rawText.trim(),
        intention: intention ?? "pay",
        expected_amount: expectedAmount,
        language: lang,
        source,
      });
      go({
        screen: "result",
        result,
        expectation: { intention: intention ?? "pay", expectedAmount },
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
    {
      id: "upload",
      icon: FileImage,
      label: `${t.scan.methodUpload} / ${t.scan.methodDemo}`,
      sub: t.scan.methodUploadSub,
    },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">{t.scan.title}</h1>
        <p className="mt-1 text-lg text-navy/80">{t.scan.subtitle}</p>
      </header>

      {step === "method" ? (
        <>
          {/* Method selector tabs */}
          <div className="grid gap-3 sm:grid-cols-3">
            {methods.map((entry) => {
              const Icon = entry.icon;
              const selected = method === entry.id || (entry.id === "upload" && method === "demo");
              return (
                <button
                  key={entry.id}
                  data-testid={`method-tab-${entry.id}`}
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

          {/* Option 1: Camera QR Scanner */}
          {method === "camera" ? (
            <Card className="relative overflow-hidden">
              <div className="relative">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={
                    cameraState === "off"
                      ? "hidden"
                      : "aspect-video w-full rounded-2xl bg-black object-cover"
                  }
                />

                {/* Animated viewfinder reticle when camera is ON */}
                {cameraState === "on" ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                    <div className="relative h-56 w-56 sm:h-64 sm:w-64 rounded-3xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                      {/* Laser scanning line */}
                      <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-teal-light via-teal to-teal-light shadow-glow animate-bounce" />
                      {/* Corner marks */}
                      <span className="absolute -left-1 -top-1 h-6 w-6 border-l-4 border-t-4 border-teal" />
                      <span className="absolute -right-1 -top-1 h-6 w-6 border-r-4 border-t-4 border-teal" />
                      <span className="absolute -bottom-1 -left-1 h-6 w-6 border-b-4 border-l-4 border-teal" />
                      <span className="absolute -bottom-1 -right-1 h-6 w-6 border-b-4 border-r-4 border-teal" />
                    </div>
                  </div>
                ) : null}
              </div>

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
                  <p className="text-center text-sm font-semibold text-navy/70">
                    {lang === "hi"
                      ? "कैमरे के सामने QR कोड को 15-25 सेमी की दूरी पर सीधा रखें — स्कैन होते ही सुरक्षा परिणाम दिखेगा"
                      : lang === "kn"
                        ? "ಕ್ಯಾಮರಾದ ಮುಂದೆ QR ಕೋಡ್ ಅನ್ನು 15-25 ಸೆಂ.ಮೀ ದೂರದಲ್ಲಿ ನೇರವಾಗಿ ಹಿಡಿಯಿರಿ — ಸ್ಕ್ಯಾನ್ ಆದ ತಕ್ಷಣ ಸುರಕ್ಷತಾ ಫಲಿತಾಂಶ ಕಾಣಿಸುತ್ತದೆ"
                        : "Hold the QR code steadily 15-25 cm in front of the camera — safety check will run automatically"}
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

          {/* Option 2: Manual UPI Link / UPI ID / Text Input */}
          {method === "manual" ? (
            <Card className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold">{t.scan.manualTitle}</h2>
                <p className="mt-1 text-sm text-navy/70">{t.scan.manualHint}</p>
              </div>

              {/* Sample quick-fill chips for convenience */}
              <div>
                <span className="text-xs font-bold uppercase text-navy/60">
                  {lang === "hi" ? "त्वरित उदाहरण (टैप करें):" : lang === "kn" ? "ಮಾದರಿ ಉದಾಹರಣೆಗಳು:" : "Quick samples (tap to test):"}
                </span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRawText("rahul.sharma@okhdfcbank")}
                    className="rounded-full border border-navy/20 bg-cream/70 px-3 py-1 text-xs font-semibold hover:border-teal"
                  >
                    rahul.sharma@okhdfcbank ({lang === "hi" ? "बेटा" : "Son"})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRawText("priya.s@icici")}
                    className="rounded-full border border-navy/20 bg-cream/70 px-3 py-1 text-xs font-semibold hover:border-teal"
                  >
                    priya.s@icici ({lang === "hi" ? "बेटी" : "Daughter"})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRawText(
                        "upi://pay?pa=green.kiran@okhdfcbank&pn=Green%20Kiran%20Stores&am=250&cu=INR&tn=Kirana%20groceries",
                      )
                    }
                    className="rounded-full border border-navy/20 bg-cream/70 px-3 py-1 text-xs font-semibold hover:border-teal"
                  >
                    Green Kiran Stores (₹250)
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="sr-only">{t.scan.manualTitle}</span>
                <textarea
                  value={rawText}
                  onChange={(event) => setRawText(event.target.value)}
                  rows={4}
                  placeholder={t.scan.manualPlaceholder}
                  className="w-full rounded-2xl border-2 border-navy/20 bg-paper p-4 text-lg break-all focus:border-navy"
                />
              </label>

              {/* Real-time live decoded card as user types */}
              {rawText.trim() ? (
                <div className="rounded-2xl border-2 border-teal/40 bg-teal-soft/30 p-4">
                  <div className="flex items-center gap-2 text-teal-dark font-extrabold text-sm uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t.scan.decodedPreview}</span>
                  </div>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2 text-navy">
                    <div>
                      <span className="text-xs text-navy/60 font-bold uppercase block">
                        {lang === "hi" ? "प्राप्तकर्ता" : "Recipient"}
                      </span>
                      <span className="font-bold text-base">
                        {parsed.displayName || parsed.payeeVpa || "Unknown"}
                      </span>
                      {parsed.payeeVpa ? (
                        <span className="block font-mono text-xs text-navy/70">{parsed.payeeVpa}</span>
                      ) : null}
                    </div>

                    <div>
                      <span className="text-xs text-navy/60 font-bold uppercase block">
                        {lang === "hi" ? "राशि" : "Amount"}
                      </span>
                      <span className="font-bold text-base">
                        {parsed.amount !== null
                          ? `₹${parsed.amount}`
                          : lang === "hi"
                            ? "निर्धारित नहीं"
                            : "Not specified"}
                      </span>
                    </div>

                    {parsed.bankName ? (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-navy/60 font-bold uppercase block">
                          {lang === "hi" ? "बैंक / प्रदाता" : "Bank / Provider"}
                        </span>
                        <span className="font-extrabold text-sm text-teal-dark">
                          ✅ {parsed.bankName}
                        </span>
                      </div>
                    ) : null}

                    {parsed.payeeVpa && parsed.payeeVpa.includes("@") && !parsed.isLegitBank ? (
                      <div className="sm:col-span-2 rounded-xl border border-amber-500/50 bg-amber-50 p-2.5 text-xs text-amber-900">
                        <span className="font-extrabold block">
                          ⚠️ {lang === "hi" ? "अपुष्ट बैंक हैंडल" : "Unverified Bank Handle"}
                        </span>
                        <span>
                          {lang === "hi"
                            ? `हैंडल "@${parsed.handle || parsed.payeeVpa.split("@")[1]}" किसी मान्यता प्राप्त भारतीय बैंक का नहीं है।`
                            : `Handle "@${parsed.handle || parsed.payeeVpa.split("@")[1]}" is not recognized as an authorized Indian bank or NPCI provider.`}
                        </span>
                      </div>
                    ) : null}

                    {parsed.isSuspicious ? (
                      <div className="sm:col-span-2 rounded-xl border-2 border-coral/60 bg-coral/15 p-2.5 text-xs text-coral-dark">
                        <span className="font-black block text-sm">
                          🚨 {lang === "hi" ? "संदिग्ध पता चेतावनी" : "Suspicious Address Alert"}
                        </span>
                        <span>
                          {parsed.suspicionReason ||
                            (lang === "hi"
                              ? "इस UPI आईडी में धोखाधड़ी में प्रयुक्त शब्द पाए गए हैं।"
                              : "This UPI address contains scam or impersonation keywords.")}
                        </span>
                      </div>
                    ) : null}

                    {familyMatch ? (
                      <div className="sm:col-span-2 rounded-lg bg-teal/15 px-2.5 py-1 text-xs font-bold text-teal-dark">
                        🛡️ {lang === "hi" ? "पारिवारिक संपर्क:" : "Verified Family Member:"} {familyMatch.name} ({familyMatch.relationship})
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="pt-2">
                <BigButton
                  full
                  disabled={!rawText.trim()}
                  onClick={() => {
                    handleDetectedText(rawText, "manual");
                  }}
                  icon={<ScanLine className="h-6 w-6" />}
                >
                  {t.common.continueBtn}
                </BigButton>
              </div>
            </Card>
          ) : null}

          {/* Option 3: Upload QR Screenshot / Photo + Demos */}
          {method === "upload" || method === "demo" ? (
            <Card className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold">{t.scan.uploadTitle}</h2>
                <p className="mt-1 text-navy/80">{t.scan.uploadHint}</p>
              </div>

              {/* File upload drag & drop box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-navy/30 bg-cream/40 p-6 text-center transition-colors hover:border-teal hover:bg-teal-soft/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileUpload(file);
                  }}
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal text-white shadow-soft">
                  <Upload className="h-8 w-8" />
                </div>
                <p className="mt-3 text-lg font-extrabold text-navy">{t.scan.uploadDrop}</p>
                <p className="mt-1 text-xs text-navy/60">{t.scan.uploadFormats}</p>
                <div className="mt-4">
                  <button
                    type="button"
                    className="rounded-xl border border-navy/20 bg-paper px-4 py-2 font-bold text-navy shadow-sm"
                  >
                    {t.scan.uploadSelectBtn}
                  </button>
                </div>
              </div>

              {uploadLoading ? (
                <div className="py-2">
                  <Spinner label={t.scan.uploading} />
                </div>
              ) : null}

              {uploadError ? (
                <Banner tone="danger" title={t.common.errorTitle}>
                  {uploadError}
                </Banner>
              ) : null}

              {uploadedImagePreview ? (
                <div className="flex items-center gap-3 rounded-2xl border border-navy/10 bg-cream/30 p-2">
                  <img
                    src={uploadedImagePreview}
                    alt="Uploaded QR Preview"
                    className="h-16 w-16 rounded-xl object-cover border"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-navy/70">
                      {lang === "hi" ? "चयनित इमेज" : "Selected Image"}
                    </span>
                    <span className="block truncate text-sm font-semibold">{t.scan.uploadSuccess}</span>
                  </div>
                </div>
              ) : null}

              {/* Demo Scenarios Section */}
              <div className="border-t border-navy/10 pt-4">
                <div className="flex items-center gap-2 text-navy mb-3">
                  <Sparkles className="h-5 w-5 text-teal" />
                  <h3 className="text-lg font-extrabold">{t.scan.demoTitle}</h3>
                </div>

                <ul className="grid gap-2.5 sm:grid-cols-2">
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
                        className="w-full rounded-2xl border border-navy/15 bg-paper p-3 text-left transition-colors hover:border-teal"
                      >
                        <span className="block text-base font-extrabold text-navy">
                          {scenario.title[lang]}
                        </span>
                        <span className="mt-0.5 block text-xs text-navy/70 line-clamp-2">
                          {scenario.description[lang]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          {/* Step 2: Multilingual Visual Explanation & Confirmation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-navy">{t.scan.detailsTitle}</h2>
              <BigButton
                variant="outline"
                onClick={() => setStep("method")}
                icon={<ArrowLeft className="h-5 w-5" />}
              >
                {t.nav.back}
              </BigButton>
            </div>

            {/* Prominent Visual Payment Flow Card */}
            <VisualPaymentCard
              payment={parsed}
              intention={intention ?? "pay"}
              expectedAmount={parseAmount(amountText)}
              familyMatch={familyMatch}
            />

            {/* Intention selection (Pay vs Receive) */}
            <Card className="space-y-4">
              <p className="text-lg font-extrabold text-navy">{t.scan.intentQuestion}</p>
              <div className="grid gap-3 sm:grid-cols-2">
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
                <Banner tone="danger" title={t.scan.intentReceive}>
                  {t.scan.receiveWarning}
                </Banner>
              ) : null}

              {intention === "pay" ? (
                <label className="block pt-2">
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
                <Banner tone="danger" title={t.common.errorTitle}>
                  {actionError}
                </Banner>
              ) : null}

              <div className="pt-3">
                <BigButton
                  full
                  disabled={!rawText.trim() || busy}
                  onClick={() => void runAnalyze()}
                  icon={<ScanLine className="h-6 w-6" />}
                >
                  {t.scan.checkBtn}
                </BigButton>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Loading overlay */}
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
