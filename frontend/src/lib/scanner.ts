/**
 * Camera QR scanning built on `@zxing/browser`.
 *
 * Prefers the rear camera (`facingMode: environment`) and stops the stream as
 * soon as a code is read or the caller calls `stop()`.
 */

import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

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

export async function startQrScanner(
  video: HTMLVideoElement,
  onDetected: (text: string) => void,
): Promise<Scanner> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new ScanError("unsupported", "Camera is not supported");
  }

  const reader = new BrowserQRCodeReader();
  let controls: IScannerControls | null = null;

  try {
    controls = await reader.decodeFromConstraints(
      { video: { facingMode: { ideal: "environment" } } },
      video,
      (result, _error, controller) => {
        if (result) {
          controller.stop();
          onDetected(result.getText());
        }
      },
    );
  } catch (error) {
    throw mapCameraError(error);
  }

  return {
    stop: () => {
      try {
        controls?.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}

export async function decodeQrFromImageFile(file: File | Blob): Promise<string> {
  const reader = new BrowserQRCodeReader();
  const url = URL.createObjectURL(file);
  try {
    const result = await reader.decodeFromImageUrl(url);
    return result.getText();
  } catch {
    throw new ScanError(
      "generic",
      "Could not find a valid QR code in this image. Please try a clearer picture or screenshot.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
