/**
 * Family Profiles and Trusted Contacts management.
 * Helps senior citizens recognize payments to loved ones and verified shops,
 * and request verification from family members when paying unknown recipients.
 */

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  relationshipKey: "son" | "daughter" | "spouse" | "caregiver" | "brother" | "sister" | "friend" | "trusted_shop" | "other";
  vpa: string;
  phoneNumber?: string;
}

const STORAGE_KEY = "saarthi:family_profiles";

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: "fam-1",
    name: "Rahul Sharma",
    relationship: "Son",
    relationshipKey: "son",
    vpa: "rahul.sharma@okhdfcbank",
    phoneNumber: "9876543210",
  },
  {
    id: "fam-2",
    name: "Priya Sharma",
    relationship: "Daughter",
    relationshipKey: "daughter",
    vpa: "priya.s@icici",
    phoneNumber: "9812345678",
  },
  {
    id: "fam-3",
    name: "Green Kiran Stores",
    relationship: "Trusted Shop",
    relationshipKey: "trusted_shop",
    vpa: "green.kiran@okhdfcbank",
    phoneNumber: "9988776655",
  },
];

export function getFamilyProfiles(): FamilyMember[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_FAMILY_MEMBERS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FAMILY_MEMBERS));
      return DEFAULT_FAMILY_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FAMILY_MEMBERS;
  } catch {
    return DEFAULT_FAMILY_MEMBERS;
  }
}

export function saveFamilyProfile(member: FamilyMember): void {
  const list = getFamilyProfiles();
  const existingIdx = list.findIndex((item) => item.id === member.id);
  let updated: FamilyMember[];
  if (existingIdx >= 0) {
    updated = [...list];
    updated[existingIdx] = member;
  } else {
    updated = [member, ...list];
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    /* storage full or unavailable */
  }
}

export function deleteFamilyProfile(id: string): void {
  const list = getFamilyProfiles();
  const updated = list.filter((item) => item.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    /* storage unavailable */
  }
}

export function findFamilyMatch(vpa: string | null): FamilyMember | null {
  if (!vpa) return null;
  const normalized = vpa.trim().toLowerCase();
  const list = getFamilyProfiles();
  return list.find((item) => item.vpa.trim().toLowerCase() === normalized) ?? null;
}

export function buildFamilyShareMessage(
  details: {
    payeeName: string;
    vpa: string;
    amount: number | null;
    outcomeLabel?: string;
  },
  lang: "en" | "hi" | "kn" = "en",
): string {
  const amountStr = details.amount !== null ? `₹${details.amount}` : "amount not specified";
  if (lang === "hi") {
    return (
      `नमस्ते! मैं SAARTHI SafePay का उपयोग कर रहा हूँ। मुझे इस भुगतान की जाँच करनी है:\n` +
      `प्राप्तकर्ता: ${details.payeeName} (${details.vpa})\n` +
      `राशि: ${amountStr}\n` +
      (details.outcomeLabel ? `सुरक्षा स्थिति: ${details.outcomeLabel}\n` : "") +
      `कृपया पुष्टि करें कि क्या यह भुगतान करना सुरक्षित है?`
    );
  }
  if (lang === "kn") {
    return (
      `ನಮಸ್ಕಾರ! ನಾನು SAARTHI SafePay ಬಳಸುತ್ತಿದ್ದೇನೆ. ಈ ಪಾವತಿಯನ್ನು ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ:\n` +
      `ಸ್ವೀಕೃತಿದಾರರು: ${details.payeeName} (${details.vpa})\n` +
      `ಮೊತ್ತ: ${amountStr}\n` +
      (details.outcomeLabel ? `ಸ್ಥಿತಿ: ${details.outcomeLabel}\n` : "") +
      `ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ನಾನು ಹಣ ಪಾವತಿಸಬಹುದೇ?`
    );
  }
  return (
    `Hello! I am using SAARTHI SafePay. Could you please check this payment request for me?\n` +
    `Recipient: ${details.payeeName} (${details.vpa})\n` +
    `Amount: ${amountStr}\n` +
    (details.outcomeLabel ? `Safety check verdict: ${details.outcomeLabel}\n` : "") +
    `Please confirm if this is safe for me to pay.`
  );
}

export function openWhatsAppShare(
  phoneNumber: string | undefined,
  message: string,
): void {
  const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, "") : "";
  const phoneParam = cleanPhone.length >= 10 ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : "";
  const url = phoneParam
    ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
