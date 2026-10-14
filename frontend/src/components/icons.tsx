/** Central icon + tone mappings so risk is never communicated by colour alone. */

import {
  AlertTriangle,
  BadgeAlert,
  CircleAlert,
  Check,
  Info,
  Minus,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  type LucideIcon,
} from "lucide-react";
import type { CheckStatus, Outcome, Severity } from "../types";

export const OUTCOME_ICON: Record<Outcome, LucideIcon> = {
  low_concern: ShieldCheck,
  be_careful: BadgeAlert,
  high_concern: ShieldAlert,
  unable_to_verify: ShieldQuestion,
};

/** Tailwind classes per outcome (soft background + strong border). */
export const OUTCOME_STYLE: Record<Outcome, string> = {
  low_concern: "bg-teal-soft border-teal text-navy",
  be_careful: "bg-sun-soft border-sun text-navy",
  high_concern: "bg-coral-soft border-coral text-navy",
  unable_to_verify: "bg-navy/8 border-navy/40 text-navy",
};

export const SEVERITY_ICON: Record<Severity, LucideIcon> = {
  high: AlertTriangle,
  medium: CircleAlert,
  info: Info,
};

export const SEVERITY_STYLE: Record<Severity, string> = {
  high: "bg-coral-soft border-coral",
  medium: "bg-sun-soft border-sun",
  info: "bg-navy/8 border-navy/30",
};

export const CHECK_ICON: Record<CheckStatus, LucideIcon> = {
  triggered: AlertTriangle,
  clear: Check,
  not_applicable: Minus,
};

export const CHECK_STYLE: Record<CheckStatus, string> = {
  triggered: "bg-coral-soft border-coral text-coral-dark",
  clear: "bg-teal-soft border-teal text-teal-dark",
  not_applicable: "bg-navy/6 border-navy/20 text-navy/60",
};
