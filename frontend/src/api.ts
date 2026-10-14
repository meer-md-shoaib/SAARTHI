/**
 * REST client for the SAARTHI SafePay backend.
 *
 * Same-origin by default (Vite proxy in dev, static serving in production);
 * set VITE_API_BASE to point somewhere else. Every failure becomes an
 * `ApiError` with a `kind` the UI can translate - never a silent fallback.
 */

import type {
  AnalyzeMessageResult,
  AnalyzePayload,
  AnalyzeResult,
  AskResult,
  HealthInfo,
  Lang,
  SttResult,
  TtsResult,
} from "./types";

const BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");

export type ApiErrorKind = "network" | "timeout" | "http" | "parse";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 20000,
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("timeout", "Request timed out");
    }
    throw new ApiError("network", "Could not reach the server");
  } finally {
    window.clearTimeout(timer);
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "detail" in body &&
        typeof (body as { detail: unknown }).detail === "string"
      ) {
        detail = (body as { detail: string }).detail;
      }
    } catch {
      /* keep the generic message */
    }
    throw new ApiError("http", detail, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("parse", "The server returned an unreadable response");
  }
}

function jsonInit(payload: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

export const api = {
  health: () => request<HealthInfo>("/health"),

  analyze: (payload: AnalyzePayload) =>
    request<AnalyzeResult>("/api/v1/analyze-payment", jsonInit(payload)),

  ask: (text: string, language: Lang, topicId?: string) =>
    request<AskResult>(
      "/api/v1/ask",
      jsonInit({ text, language, ...(topicId ? { topic_id: topicId } : {}) }),
    ),

  speechToText: (audio: Blob, language: string, filename: string) => {
    const form = new FormData();
    form.append("file", audio, filename);
    form.append("language", language);
    return request<SttResult>("/api/v1/speech-to-text", { method: "POST", body: form }, 45000);
  },

  textToSpeech: (text: string, language: string) =>
    request<TtsResult>("/api/v1/text-to-speech", jsonInit({ text, language }), 45000),

  analyzeMessage: (message: string, language: string) =>
    request<AnalyzeMessageResult>("/api/v1/analyze-message", jsonInit({ message, language })),
};

