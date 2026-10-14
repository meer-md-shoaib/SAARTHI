/**
 * High-performance QR Code scanning and image decoding engine.
 *
 * Supports:
 * 1. Live camera scanning via multi-tier detection:
 *    - Tier 1: Hardware-accelerated native `BarcodeDetector` (if supported)
 *    - Tier 2: `jsQR` engine (blazing fast, detects tilted, rotated, and inverted QRs)
 *    - Tier 3: ZXing `QRCodeReader` with multiple binarizers (`HybridBinarizer`, `GlobalHistogramBinarizer`)
 * 2. Static QR image / screenshot decoding from uploaded files or URLs.
 * 3. Audio / haptic feedback upon successful code detection.
 */

import jsQR from "jsqr";
import {
  BinaryBitmap,
  DecodeHintType,
  GlobalHistogramBinarizer,
  HybridBinarizer,
  InvertedLuminanceSource,
  QRCodeReader,
} from "@zxing/library";
import { HTMLCanvasElementLuminanceSource } from "@zxing/browser";

export type ScanErrorKind = "permission" | "notfound" | "busy" | "unsupported" | "generic";

export class ScanError extends Error {
  readonly kind: ScanErrorKind;
  constructor(kind: ScanErrorKind, message: string) {
    super(message);
    this.name = "ScanError";
    this.kind = kind;
  }
}

function mapCameraError(error: unknown): ScanError {
  const name = error instanceof DOMException ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return new ScanError("permission", "Camera permission denied");
    case "NotFoundError":
    case "OverconstrainedError":
      return new ScanError("notfound", "No camera found");
    case "NotReadableError":
    case "AbortError":
      return new ScanError("busy", "Camera is busy");
    default:
      return new ScanError("generic", "Could not open the camera");
  }
}

export interface Scanner {
  stop: () => void;
}

/** Plays a gentle high-pitch confirmation tone on successful QR detection. */
export function playScanChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* audio unavailable or blocked by autoplay policy */
  }

  // Trigger brief haptic vibration if supported on mobile
  try {
    if (navigator.vibrate) {
      navigator.vibrate([70, 40, 70]);
    }
  } catch {
    /* vibration unsupported */
  }
}

/**
 * Native BarcodeDetector interface for TypeScript
 */
interface NativeBarcodeDetector {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): NativeBarcodeDetector;
      getSupportedFormats?(): Promise<string[]>;
    };
  }
}

/**
 * Decode QR code using ZXing from an HTMLCanvasElement with multiple binarizers.
 */
function decodeCanvasWithZxing(
  canvas: HTMLCanvasElement,
  reader?: QRCodeReader,
): string | null {
  const width = canvas.width;
  const height = canvas.height;
  if (width <= 0 || height <= 0) return null;

  const qrReader = reader ?? new QRCodeReader();
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.TRY_HARDER, true);

  try {
    const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);

    // 1. HybridBinarizer
    try {
      const bitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      const res = qrReader.decode(bitmap, hints);
      if (res && res.getText()) return res.getText().trim();
    } catch {
      /* continue */
    }

    // 2. GlobalHistogramBinarizer (glare / uniform background)
    try {
      const bitmap = new BinaryBitmap(new GlobalHistogramBinarizer(luminanceSource));
      const res = qrReader.decode(bitmap, hints);
      if (res && res.getText()) return res.getText().trim();
    } catch {
      /* continue */
    }

    // 3. Inverted luminance
    try {
      const invertedSource = new InvertedLuminanceSource(luminanceSource);
      const bitmap = new BinaryBitmap(new HybridBinarizer(invertedSource));
      const res = qrReader.decode(bitmap, hints);
      if (res && res.getText()) return res.getText().trim();
    } catch {
      /* continue */
    }

    return null;
  } catch {
    return null;
  }
}


/**
 * Starts continuous live camera scanning on the provided HTMLVideoElement.
 */
export async function startQrScanner(
  video: HTMLVideoElement,
  onDetected: (text: string) => void,
): Promise<Scanner> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new ScanError("unsupported", "Camera is not supported on this device");
  }

  let stream: MediaStream | null = null;
  try {
    // Attempt standard webcam resolution (720p / 16:9 ideal)
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
      },
      audio: false,
    });
  } catch {
    try {
      // Fallback with minimal constraints
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    } catch (error) {
      throw mapCameraError(error);
    }
  }

  // Request continuous autofocus if supported on this hardware
  try {
    const track = stream.getVideoTracks()[0];
    const caps = (track.getCapabilities ? track.getCapabilities() : {}) as { focusMode?: string[] };
    if (caps && caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes("continuous")) {
      await (track.applyConstraints as (c: unknown) => Promise<void>)({
        advanced: [{ focusMode: "continuous" }],
      });
    }
  } catch {
    /* ignore autofocus request failure */
  }

  video.srcObject = stream;
  video.setAttribute("autoplay", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  video.muted = true;
  try {
    await video.play();
  } catch {
    /* autoplay might need user interaction */
  }

  let stopped = false;
  let timerId: number | null = null;
  let animId: number | null = null;
  let isProcessing = false;

  const sharedReader = new QRCodeReader();

  // Full frame offscreen canvas (1:1 native resolution)
  const fullCanvas = document.createElement("canvas");
  const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true });

  // Center reticle crop canvas
  const cropCanvas = document.createElement("canvas");
  const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });

  let nativeDetector: NativeBarcodeDetector | null = null;
  if (typeof window !== "undefined" && window.BarcodeDetector) {
    try {
      nativeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
    } catch {
      nativeDetector = null;
    }
  }

  const stop = () => {
    stopped = true;
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
    if (animId !== null) {
      window.cancelAnimationFrame(animId);
      animId = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    try {
      video.srcObject = null;
    } catch {
      /* ignore */
    }
  };

  const scanFrame = async () => {
    if (stopped) return;

    if (
      !isProcessing &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      isProcessing = true;
      try {
        const vWidth = video.videoWidth;
        const vHeight = video.videoHeight;

        // 1. Native BarcodeDetector (hardware accelerated)
        if (nativeDetector) {
          try {
            const barcodes = await nativeDetector.detect(video);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              const res = barcodes[0].rawValue.trim();
              if (res) {
                playScanChime();
                stop();
                onDetected(res);
                return;
              }
            }
          } catch {
            /* continue */
          }
        }

        // 2. Full-frame jsQR scan (no downscaling blur - crisp finder patterns)
        if (fullCtx) {
          // Cap maximum width at 1280 to keep frame processing under ~40ms on all devices
          const scale = vWidth > 1280 ? 1280 / vWidth : 1;
          const targetW = Math.round(vWidth * scale);
          const targetH = Math.round(vHeight * scale);

          if (fullCanvas.width !== targetW || fullCanvas.height !== targetH) {
            fullCanvas.width = targetW;
            fullCanvas.height = targetH;
          }
          fullCtx.drawImage(video, 0, 0, targetW, targetH);
          const fullData = fullCtx.getImageData(0, 0, targetW, targetH);

          // Fast jsQR pass across full frame
          const fullCode = jsQR(fullData.data, targetW, targetH, {
            inversionAttempts: "attemptBoth",
          });
          if (fullCode && fullCode.data && fullCode.data.trim()) {
            playScanChime();
            stop();
            onDetected(fullCode.data.trim());
            return;
          }
        }

        // 3. Center Reticle Crop (user holds phone/QR directly in the reticle)
        if (cropCtx) {
          const cropSize = Math.floor(Math.min(vWidth, vHeight) * 0.70);
          const startX = Math.floor((vWidth - cropSize) / 2);
          const startY = Math.floor((vHeight - cropSize) / 2);

          if (cropCanvas.width !== cropSize || cropCanvas.height !== cropSize) {
            cropCanvas.width = cropSize;
            cropCanvas.height = cropSize;
          }
          cropCtx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, cropSize, cropSize);
          const cropData = cropCtx.getImageData(0, 0, cropSize, cropSize);

          const cropCode = jsQR(cropData.data, cropSize, cropSize, {
            inversionAttempts: "attemptBoth",
          });
          if (cropCode && cropCode.data && cropCode.data.trim()) {
            playScanChime();
            stop();
            onDetected(cropCode.data.trim());
            return;
          }

          // ZXing fallback on center crop
          const zxingCrop = decodeCanvasWithZxing(cropCanvas, sharedReader);
          if (zxingCrop && zxingCrop.trim()) {
            playScanChime();
            stop();
            onDetected(zxingCrop.trim());
            return;
          }
        }

        // 4. ZXing full frame fallback
        if (fullCanvas.width > 0 && fullCanvas.height > 0) {
          const zxingFull = decodeCanvasWithZxing(fullCanvas, sharedReader);
          if (zxingFull && zxingFull.trim()) {
            playScanChime();
            stop();
            onDetected(zxingFull.trim());
            return;
          }
        }
      } catch {
        /* continue polling */
      } finally {
        isProcessing = false;
      }
    }

    if (!stopped) {
      // 35ms delay gives ~28 FPS scanning without taxing CPU
      timerId = window.setTimeout(() => {
        animId = window.requestAnimationFrame(scanFrame);
      }, 35);
    }
  };

  // Start polling frames once video starts
  timerId = window.setTimeout(() => {
    animId = window.requestAnimationFrame(scanFrame);
  }, 100);

  return { stop };
}

/**
 * Decodes a QR code from an image File, Blob, Image element or Data URL.
 */
export async function decodeQrFromImage(
  imageSource: File | Blob | HTMLImageElement | string,
): Promise<string> {
  let img: HTMLImageElement;

  if (imageSource instanceof HTMLImageElement) {
    img = imageSource;
    if (!img.complete) {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });
    }
  } else {
    img = new Image();
    const url =
      typeof imageSource === "string"
        ? imageSource
        : URL.createObjectURL(imageSource);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });

    if (typeof imageSource !== "string") {
      URL.revokeObjectURL(url);
    }
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (width <= 0 || height <= 0) {
    throw new Error("Invalid image dimensions");
  }

  // 1. Try native BarcodeDetector
  if (typeof window !== "undefined" && window.BarcodeDetector) {
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const barcodes = await detector.detect(img);
      if (barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue.trim();
      }
    } catch {
      /* continue to jsQR */
    }
  }

  // 2. Render image onto canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);

  // 3. Try jsQR (standard & inverted)
  const code = jsQR(imgData.data, width, height, {
    inversionAttempts: "attemptBoth",
  });
  if (code && code.data && code.data.trim()) {
    return code.data.trim();
  }

  // 4. Try ZXing
  const zxingText = decodeCanvasWithZxing(canvas);
  if (zxingText && zxingText.trim()) {
    return zxingText.trim();
  }

  // 5. Contrast-enhanced pass for low-contrast screenshots or photos
  try {
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
      const v = avg > 128 ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    ctx.putImageData(imgData, 0, 0);

    const enhancedCode = jsQR(imgData.data, width, height, {
      inversionAttempts: "attemptBoth",
    });
    if (enhancedCode && enhancedCode.data && enhancedCode.data.trim()) {
      return enhancedCode.data.trim();
    }

    const enhancedZxing = decodeCanvasWithZxing(canvas);
    if (enhancedZxing && enhancedZxing.trim()) {
      return enhancedZxing.trim();
    }
  } catch {
    /* ignore fallback errors */
  }

  throw new Error("No QR code detected in this image");
}
