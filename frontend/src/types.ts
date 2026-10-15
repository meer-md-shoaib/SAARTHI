/**
 * Types mirroring the FastAPI backend contract (backend/app/schemas.py).
 * Keeping them in one place makes drift between the two sides a compile error
 * as soon as a response shape changes.
 */

export type Lang =
  | "en"
  | "hi"
  | "kn"
  | "bn"
  | "gu"
  | "ml"
  | "mr"
  | "od"
  | "pa"
  | "ta"
  | "te";

export type Intention = "pay" | "receive" | "unknown";

export type Outcome = "low_concern" | "be_careful" | "high_concern" | "unable_to_verify";
export type Severity = "high" | "medium" | "info";
export type CheckStatus = "triggered" | "clear" | "not_applicable";

export interface WarningSign {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  evidence?: string;
}

export interface Check {
  id: string;
  status: CheckStatus;
  title: string;
}

export interface ExtractedInfo {
  kind: "upi_pay" | "vpa" | "url" | "text" | "empty";
  payee_vpa: string | null;
  payee_name: string | null;
  amount: number | null;
  amount_source: "structured" | "text" | null;
  currency: string | null;
  note: string | null;
  transaction_ref: string | null;
  merchant_code: string | null;
  link: string | null;
  supported: boolean;
}

export interface AnalyzeResult {
  outcome: Outcome;
  outcome_label: string;
  summary: string;
  explanation: string;
  warning_signs: WarningSign[];
  recommended_actions: string[];
  checks: Check[];
  status_labels: Record<CheckStatus, string>;
  extracted: ExtractedInfo;
  insufficient_reasons: string[];
  disclaimer: string;
  language: string;
  engine_version: string;
  ai_overrode_engine: boolean;
}

export interface AnalyzePayload {
  raw_text: string;
  intention: Intention;
  expected_amount: number | null;
  language: string;
  source: "camera" | "manual" | "demo";
}

export interface SuggestedTopic {
  topic_id: string;
  title: string;
}

export interface AskResult {
  topic_id: string;
  question: string;
  title: string;
  answer: string;
  suggested: SuggestedTopic[];
  language: string;
  answered_by: "knowledge_base" | "ml_message_analysis" | "contextual_followup" | "gemini_ai";
}

export interface EvidenceItem {
  subtype: string;
  title: string;
  snippet: string;
  explanation: string;
}

export interface AnalyzeMessageResult {
  category: "legitimate" | "promotional" | "scam" | "unsupported" | "unknown";
  risk_level: "low" | "medium" | "high" | "unknown";
  confidence: number;
  class_probabilities: Record<string, number>;
  subcategories: string[];
  is_out_of_distribution: boolean;
  evidence: EvidenceItem[];
  safe_next_steps: string[];
  explanation: string;
  model_version: string;
  safety_engine_override: boolean;
}

export interface SttResult {
  status: "ok" | "unavailable";
  transcript: string;
  detected_language: string | null;
  engine: string | null;
  error_code: string | null;
  message: string | null;
  typed_fallback: boolean;
}

export interface TtsResult {
  status: "ok" | "unavailable";
  audio_base64: string | null;
  content_type: string | null;
  engine: string | null;
  error_code: string | null;
  message: string | null;
  fallback: "browser_voice" | null;
}

export interface HealthInfo {
  status: "ok";
  service: string;
  version: string;
  engine_version: string;
  voice: {
    stt_configured: boolean;
    tts_configured: boolean;
    stt_model: string;
    tts_model: string;
  };
}

export type UILang = Lang;

/** Localised text container used by demo/quiz/SOS/story content. */
export interface Translated {
  en: string;
  hi: string;
  kn: string;
  [key: string]: string;
}

export interface ScamRoleplayResponse {
  reply: string;
  resistance_detected: boolean;
  educational_tip: string;
  audio_base64: string | null;
  status: string;
}

export interface JargonResponse {
  term: string;
  plain_english: string;
  elder_analogy: string;
  keep_secret: boolean;
  audio_base64: string | null;
}

export interface RescueStep {
  step_number: number;
  title: string;
  action: string;
  contact?: string | null;
  urgent: boolean;
}

export interface EmergencyRescueResponse {
  immediate_actions: RescueStep[];
  complaint_template: string;
  helpline_number: string;
  cybercrime_portal_url: string;
}

