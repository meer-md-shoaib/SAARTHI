import type { Lang } from "../types";

/**
 * Safely extract a localized string from an object indexed by language code,
 * falling back to Hindi, English, first available translation, or a fallback default.
 */
export function tr(
  container: Record<string, string> | Record<string, any> | undefined | null,
  lang: Lang | string,
  fallback = ""
): string {
  if (!container || typeof container !== "object") return fallback;
  return (
    container[lang] ||
    container.hi ||
    container.en ||
    (Object.values(container)[0] as string) ||
    fallback
  );
}
