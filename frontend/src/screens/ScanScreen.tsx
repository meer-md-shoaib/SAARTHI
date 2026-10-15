import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Keyboard,
  Mic,
  ScanLine,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { ApiError, api } from "../api";
import { BigButton } from "../components/Button";
import { Banner, Card, Spinner } from "../components/bits";
import { ScanResultModal } from "../components/ScanResultModal";
import type { Dict } from "../i18n";
import type { Scanner } from "../lib/scanner";
import { LiveSpeechRecognizer } from "../lib/speechRecognition";
import { useApp } from "../state";
import type { AnalyzeResult } from "../types";
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

function errorText(error: unknown, t: Dict): string {
  if (error instanceof ApiError) {
    if (error.kind === "timeout") return t.common.timeoutError;
    if (error.kind === "network") return t.common.serverError;
    return error.message;
  }
  return t.scan.analyzeFailed;
}

export function ScanScreen() {
  const { t, lang, uiLang } = useApp();

  const [method, setMethod] = useState<Method>("camera");
  const [rawText, setRawText] = useState("");
  const [cameraState, setCameraState] = useState<"off" | "starting" | "on">("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [dictationInterim, setDictationInterim] = useState("");

  // Modal State
  const [modalResult, setModalResult] = useState<AnalyzeResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<Scanner | null>(null);
  const recognizerRef = useRef<LiveSpeechRecognizer | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  /* Release the camera whenever we leave the camera panel or open modal */
  useEffect(() => {
    if (method !== "camera" || isModalOpen) stopCamera();
  }, [method, isModalOpen, stopCamera]);

  useEffect(
    () => () => {
      scannerRef.current?.stop();
    },
    [],
  );

  /**
   * Directly analyze the scanned/entered text and display the senior-friendly popup.
   * Completely bypasses the old "pay vs receive" selection question.
   */
  const runAnalyzeWithText = useCallback(
    async (textToAnalyze: string, customSource: "camera" | "manual" | "demo" = "camera") => {
      const clean = textToAnalyze.trim();
      if (!clean) return;

      setBusy(true);
      setActionError(null);
      stopCamera();

      try {
        const result = await api.scanQr({
          raw_text: clean,
          intention: "pay",
          expected_amount: null,
          language: lang,
          source: customSource,
        });
        setModalResult(result);
        setIsModalOpen(true);
      } catch (error) {
        setActionError(errorText(error, t));
      } finally {
        setBusy(false);
      }
    },
    [lang, stopCamera, t],
  );

  const startCamera = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    setCameraError(null);
    setCameraState("starting");
    try {
      /* zxing is heavy - load it only when the camera is actually used. */
      const scannerLib = await import("../lib/scanner");
      const scanner = await scannerLib.startQrScanner(video, async (text) => {
        const detected = text.trim();
        if (!detected) return;
        scannerRef.current?.stop();
        scannerRef.current = null;
        setRawText(detected);
        setCameraState("off");
        await runAnalyzeWithText(detected, "camera");
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
  }, [runAnalyzeWithText, t]);

  // Auto-start camera when entering method === "camera" and not in modal
  useEffect(() => {
    if (method === "camera" && cameraState === "off" && !isModalOpen) {
      const timer = window.setTimeout(() => {
        void startCamera();
      }, 300);
      return () => window.clearTimeout(timer);
    }
  }, [method, cameraState, isModalOpen, startCamera]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setActionError(null);
      setBusy(true);
      try {
        const scannerLib = await import("../lib/scanner");
        const detected = await scannerLib.decodeQrFromImageFile(file);
        const trimmed = detected.trim();
        if (!trimmed) {
          throw new Error("No readable QR data found in the image.");
        }
        setRawText(trimmed);
        await runAnalyzeWithText(trimmed, "camera");
      } catch (err: unknown) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Could not detect a valid QR code in this image. Please ensure the QR code is clear and well-lit.",
        );
      } finally {
        setBusy(false);
        if (event.target) event.target.value = "";
      }
    },
    [runAnalyzeWithText],
  );

  const handleScanAgain = useCallback(() => {
    setIsModalOpen(false);
    setModalResult(null);
    setRawText("");
    setActionError(null);
    if (method === "camera") {
      void startCamera();
    }
  }, [method, startCamera]);

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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {actionError ? (
        <Banner tone="danger" title={t.common.errorTitle}>
          {actionError}
        </Banner>
      ) : null}

      {/* method chooser */}
      <div className="grid gap-3 sm:grid-cols-3">
        {methods.map((entry) => {
          const Icon = entry.icon;
          const selected = method === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                setMethod(entry.id);
                setActionError(null);
              }}
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

      {/* 1. Camera Panel */}
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
              <div className="grid gap-3 sm:grid-cols-2">
                <BigButton
                  full
                  onClick={() => void startCamera()}
                  icon={<Camera className="h-6 w-6" />}
                >
                  {t.scan.startCamera}
                </BigButton>
                <BigButton
                  full
                  variant="teal"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Upload className="h-6 w-6" />}
                >
                  {uiLang === "hi"
                    ? "फोटो से QR स्कैन करें"
                    : uiLang === "kn"
                      ? "ಚಿತ್ರದಿಂದ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ"
                      : "Upload QR Photo"}
                </BigButton>
              </div>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <BigButton
                  variant="coral"
                  full
                  onClick={stopCamera}
                  icon={<X className="h-6 w-6" />}
                >
                  {t.scan.stopCamera}
                </BigButton>
                <BigButton
                  variant="outline"
                  full
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Upload className="h-6 w-6" />}
                >
                  {uiLang === "hi" ? "फोटो चुनें" : "Upload QR Photo"}
                </BigButton>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {/* 2. Manual Panel */}
      {method === "manual" ? (
        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">{t.scan.manualTitle}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-2xl border-2 border-teal bg-teal/10 px-3 py-1.5 text-sm font-extrabold text-teal-dark hover:bg-teal hover:text-white transition-colors"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span>{uiLang === "hi" ? "QR फोटो चुनें" : "Upload QR"}</span>
              </button>
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
              rows={4}
              placeholder={t.scan.manualPlaceholder}
              className="w-full rounded-2xl border-2 border-navy/20 bg-paper p-4 text-lg break-all focus:border-navy"
            />
          </label>
          <p className="mt-2 text-sm text-navy/70">{t.scan.manualHint}</p>
          <div className="mt-4">
            <BigButton
              full
              disabled={!rawText.trim() || busy}
              onClick={() => {
                void runAnalyzeWithText(rawText, "manual");
              }}
              icon={<ScanLine className="h-6 w-6" />}
            >
              {t.scan.checkBtn}
            </BigButton>
          </div>
        </Card>
      ) : null}

      {/* 3. Demo Panel */}
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
                    void runAnalyzeWithText(scenario.raw_text, "demo");
                  }}
                  className="w-full rounded-2xl border-2 border-navy/15 bg-paper px-4 py-3.5 text-left transition-colors hover:border-teal"
                >
                  <span className="block text-lg font-extrabold">{scenario.title[uiLang]}</span>
                  <span className="mt-0.5 block text-navy/75">{scenario.description[uiLang]}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* Large Senior-Friendly Modal */}
      <ScanResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScanAgain={handleScanAgain}
        result={modalResult}
        rawText={rawText}
      />

      {/* Loading overlay */}
      {busy ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream/85 px-4 backdrop-blur-xs">
          <Card className="w-full max-w-md">
            <Spinner label={t.scan.checking} />
            <p className="mt-3 text-center text-navy/75">{t.scan.checkingSub}</p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
