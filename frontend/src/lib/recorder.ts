/**
 * Microphone recording for speech-to-text.
 *
 * The backend accepts webm/ogg/mp4/wav; MediaRecorder picks whatever the
 * browser supports. All microphone tracks are released on stop/cancel so the
 * "recording" indicator always turns off.
 */

export type RecorderErrorKind = "unsupported" | "permission" | "busy" | "generic";

export class RecorderError extends Error {
  readonly kind: RecorderErrorKind;
  constructor(kind: RecorderErrorKind, message: string) {
    super(message);
    this.name = "RecorderError";
    this.kind = kind;
  }
}

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function extensionFor(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

function mapGetUserMediaError(error: unknown): RecorderError {
  const name = error instanceof DOMException ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return new RecorderError("permission", "Microphone permission denied");
    case "NotFoundError":
    case "OverconstrainedError":
      return new RecorderError("unsupported", "No microphone found");
    case "NotReadableError":
    case "AbortError":
      return new RecorderError("busy", "Microphone is busy");
    default:
      return new RecorderError("generic", "Could not record audio");
  }
}

export interface Recording {
  blob: Blob;
  mimeType: string;
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  get isRecording(): boolean {
    return this.recorder !== null && this.recorder.state === "recording";
  }

  async start(): Promise<void> {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      throw new RecorderError("unsupported", "Audio recording is not supported");
    }
    if (this.recorder) this.cancel();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      throw mapGetUserMediaError(error);
    }

    const mimeType = pickMimeType();
    this.recorder = mimeType
      ? new MediaRecorder(this.stream, { mimeType })
      : new MediaRecorder(this.stream);
    this.chunks = [];
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.start();
  }

  async stop(): Promise<Recording | null> {
    const recorder = this.recorder;
    if (!recorder) return null;

    const blob = await new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => resolve(new Blob(this.chunks, { type: recorder.mimeType }));
      if (recorder.state === "recording") {
        recorder.stop();
      } else {
        resolve(null);
      }
    });
    const mimeType = recorder.mimeType || "audio/webm";
    this.cleanup();
    if (!blob || blob.size === 0) return null;
    return { blob, mimeType: mimeType.split(";")[0] };
  }

  cancel(): void {
    const recorder = this.recorder;
    try {
      if (recorder && recorder.state === "recording") recorder.stop();
    } catch {
      /* already stopped */
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
      this.stream = null;
    }
    this.recorder = null;
    this.chunks = [];
  }
}
