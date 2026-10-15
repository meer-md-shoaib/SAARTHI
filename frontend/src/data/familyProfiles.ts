import type { LanguageCode } from "./emergencyContacts";

export interface FamilyProfile {
  id: string;
  name: Record<LanguageCode, string>;
  relation: Record<LanguageCode, string>;
  upiId: string;
  phone: string;
  avatarRole: "son" | "wife" | "grandson" | "granddaughter";
  badgeBg: string;
}

export const DEFAULT_FAMILY_PROFILES: FamilyProfile[] = [
  {
    id: "son",
    name: { en: "Rahul", hi: "राहुल", kn: "ರಾಹುಲ್" },
    relation: { en: "Son", hi: "बेटा", kn: "ಮಗ" },
    upiId: "rahul@okhdfcbank",
    phone: "+919876543210",
    avatarRole: "son",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    id: "wife",
    name: { en: "Savitri", hi: "सावित्री", kn: "ಸಾವಿತ್ರಿ" },
    relation: { en: "Wife", hi: "पत्नी", kn: "ಪತ್ನಿ" },
    upiId: "savitri@sbi",
    phone: "+919876543211",
    avatarRole: "wife",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-300",
  },
  {
    id: "grandson",
    name: { en: "Aarav", hi: "आरव", kn: "ಆರವ್" },
    relation: { en: "Grandson", hi: "पोता", kn: "ಮೊಮ್ಮಗ" },
    upiId: "aarav@icici",
    phone: "+919876543212",
    avatarRole: "grandson",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    id: "granddaughter",
    name: { en: "Ananya", hi: "अनन्या", kn: "ಅನನ್ಯ" },
    relation: { en: "Granddaughter", hi: "पोती", kn: "ಮೊಮ್ಮಗಳು" },
    upiId: "ananya@oksbi",
    phone: "+919876543213",
    avatarRole: "granddaughter",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
  },
];

const STORAGE_KEY = "saarthi:family_profiles";

export function normalizeUpi(vpa?: string | null): string {
  if (!vpa) return "";
  return vpa.trim().toLowerCase();
}

export function getFamilyProfiles(): FamilyProfile[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FamilyProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    /* fallback to default */
  }
  return DEFAULT_FAMILY_PROFILES;
}

export function saveFamilyProfiles(profiles: FamilyProfile[]): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    }
  } catch {
    /* storage unavailable */
  }
}

export function findFamilyProfileByUpi(upiId?: string | null): FamilyProfile | null {
  const target = normalizeUpi(upiId);
  if (!target) return null;
  const profiles = getFamilyProfiles();
  return profiles.find((p) => normalizeUpi(p.upiId) === target) ?? null;
}

export interface FamilyMismatchResult {
  hasMismatch: boolean;
  claimedName?: string;
  claimedRelation?: string;
  expectedUpi?: string;
}

export function checkForFamilyMismatch(
  declaredTextOrName: string | null | undefined,
  actualUpi: string | null | undefined,
): FamilyMismatchResult {
  const upi = normalizeUpi(actualUpi);
  if (!declaredTextOrName || !upi) {
    return { hasMismatch: false };
  }

  const text = declaredTextOrName.toLowerCase();
  const profiles = getFamilyProfiles();

  for (const profile of profiles) {
    const enName = profile.name.en.toLowerCase();
    const enRel = profile.relation.en.toLowerCase();
    const hiName = profile.name.hi.toLowerCase();
    const hiRel = profile.relation.hi.toLowerCase();
    const knName = profile.name.kn.toLowerCase();
    const knRel = profile.relation.kn.toLowerCase();

    const nameMentioned =
      text.includes(enName) ||
      text.includes(hiName) ||
      text.includes(knName) ||
      text.includes(enRel) ||
      text.includes(hiRel) ||
      text.includes(knRel);

    if (nameMentioned && normalizeUpi(profile.upiId) !== upi) {
      return {
        hasMismatch: true,
        claimedName: profile.name.en,
        claimedRelation: profile.relation.en,
        expectedUpi: profile.upiId,
      };
    }
  }

  return { hasMismatch: false };
}
