/**
 * QR Code scanning and image decoding engine.
 *
 * Supports:
 * 1. Live camera scanning via native hardware-accelerated `BarcodeDetector`
 *    with robust ZXing `QRCodeReader` fallback.
 * 2. Static QR image / screenshot decoding from uploaded files or URLs.
 * 3. Audio / haptic feedback upon successful code detection.
 */

import {
  BinaryBitmap,
  DecodeHintType,
  GlobalHistogramBinarizer,
  HybridBinarizer,
  InvertedLuminanceSource,
  QRCodeReader,
  RGBLuminanceSource,
} from "@zxing/library";

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
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
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
      navigator.vibrate([60, 40, 60]);
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
 * Decode QR code using ZXing from an ImageData / Canvas.
 * Note: Int32Array view is critical because RGBLuminanceSource requires BYTES_PER_ELEMENT === 4
 * to properly convert 4-byte RGBA into 1-byte grayscale luminance.
 */
function decodeFromCanvasWithZxing(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  reader?: QRCodeReader,
): string | null {
  const width = canvas.width;
  const height = canvas.height;
  if (width <= 0 || height <= 0) return null;

  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const len = width * height;
    const gray = new Uint8ClampedArray(len);
    for (let i = 0, j = 0; j < len; i += 4, j++) {
      // Standard ITU-R luma conversion
      gray[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
    }

    const luminanceSource = new RGBLuminanceSource(gray, width, height);
    const qrReader = reader ?? new QRCodeReader();
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.TRY_HARDER, true);

    // 1. Standard HybridBinarizer (adaptive local thresholding)
    try {
      const bitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      const result = qrReader.decode(bitmap, hints);
      if (result && result.getText()) return result.getText();
    } catch {
      /* continue */
    }

    // 2. GlobalHistogramBinarizer (superior for screens with high contrast / uniform background glare)
    try {
      const bitmap = new BinaryBitmap(new GlobalHistogramBinarizer(luminanceSource));
      const result = qrReader.decode(bitmap, hints);
      if (result && result.getText()) return result.getText();
    } catch {
      /* continue */
    }

    // 3. Inverted luminance HybridBinarizer (dark mode phone screen / inverted QR)
    try {
      const invertedSource = new InvertedLuminanceSource(luminanceSource);
      const bitmap = new BinaryBitmap(new HybridBinarizer(invertedSource));
      const result = qrReader.decode(bitmap, hints);
      if (result && result.getText()) return result.getText();
    } catch {
      /* continue */
    }

    // 4. Inverted GlobalHistogramBinarizer
    try {
      const invertedSource = new InvertedLuminanceSource(luminanceSource);
      const bitmap = new BinaryBitmap(new GlobalHistogramBinarizer(invertedSource));
      const result = qrReader.decode(bitmap, hints);
      if (result && result.getText()) return result.getText();
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
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  } catch (error) {
    throw mapCameraError(error);
  }

  video.srcObject = stream;
  video.setAttribute("autoplay", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  try {
    await video.play();
  } catch {
    /* autoplay might need user interaction */
  }

  let stopped = false;
  let timerId: number | null = null;
  let animId: number | null = null;

  const sharedReader = new QRCodeReader();

  // Full-frame offscreen canvas
  const offscreenCanvas = document.createElement("canvas");
  const offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });

  // Center-crop offscreen canvas (tight reticle focus for laptop cameras)
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

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;

      // 1. Try native BarcodeDetector first if supported on the platform
      if (nativeDetector) {
        try {
          const barcodes = await nativeDetector.detect(video);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            const result = barcodes[0].rawValue.trim();
            if (result) {
              playScanChime();
              stop();
              onDetected(result);
              return;
            }
          }
        } catch {
          /* continue to zxing fallback */
        }
      }

      // 2. Dual-pass ZXing scan:
      // Pass A: Center crop (user holds phone/QR in the reticle of the laptop webcam)
      if (cropCtx) {
        const cropSize = Math.floor(Math.min(vWidth, vHeight) * 0.72);
        const cropX = Math.floor((vWidth - cropSize) / 2);
        const cropY = Math.floor((vHeight - cropSize) / 2);
        const targetDim = Math.min(cropSize, 480);

        if (cropCanvas.width !== targetDim || cropCanvas.height !== targetDim) {
          cropCanvas.width = targetDim;
          cropCanvas.height = targetDim;
        }
        cropCtx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, targetDim, targetDim);
        const cropText = decodeFromCanvasWithZxing(cropCanvas, cropCtx, sharedReader);
        if (cropText && cropText.trim()) {
          playScanChime();
          stop();
          onDetected(cropText.trim());
          return;
        }
      }

      // Pass B: Full frame scan
      if (offscreenCtx) {
        // Limit resolution to 640px max width for rapid ~30fps frame processing
        const scale = Math.min(1, 640 / vWidth);
        const targetW = Math.round(vWidth * scale);
        const targetH = Math.round(vHeight * scale);

        if (offscreenCanvas.width !== targetW || offscreenCanvas.height !== targetH) {
          offscreenCanvas.width = targetW;
          offscreenCanvas.height = targetH;
        }
        offscreenCtx.drawImage(video, 0, 0, targetW, targetH);
        const fullText = decodeFromCanvasWithZxing(offscreenCanvas, offscreenCtx, sharedReader);
        if (fullText && fullText.trim()) {
          playScanChime();
          stop();
          onDetected(fullText.trim());
          return;
        }
      }
    }

    if (!stopped) {
      // 40ms delay gives responsive scanning (~25 fps) without taxing the CPU
      timerId = window.setTimeout(() => {
        animId = window.requestAnimationFrame(scanFrame);
      }, 40);
    }
  };

  // Start polling frames once video is ready
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
      /* continue to ZXing */
    }
  }

  // 2. ZXing canvas decoder
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.drawImage(img, 0, 0, width, height);
  const text = decodeFromCanvasWithZxing(canvas, ctx);
  if (text && text.trim()) {
    return text.trim();
  }

  // 3. Try with inverted / contrast-boosted canvas if first attempt didn't find it
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    // Simple contrast enhancement
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const v = avg > 128 ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    ctx.putImageData(imgData, 0, 0);
    const enhancedText = decodeFromCanvasWithZxing(canvas, ctx);
    if (enhancedText && enhancedText.trim()) {
      return enhancedText.trim();
    }
  } catch {
    /* ignore fallback enhancement errors */
  }

  throw new Error("No QR code detected in this image");
}
