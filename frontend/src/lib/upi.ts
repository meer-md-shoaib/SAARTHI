/**
 * Client-side UPI parsing and bank resolution utilities.
 */

export interface ParsedPayment {
  isPayment: boolean;
  kind: "upi_pay" | "vpa" | "url" | "text" | "empty";
  payeeVpa: string | null;
  payeeName: string | null;
  displayName: string | null;
  amount: number | null;
  currency: string;
  note: string | null;
  bankName: string | null;
  direction: "pay" | "receive" | "unknown";
  rawText: string;
  isLegitBank?: boolean;
  isSuspicious?: boolean;
  suspicionReason?: string;
  handle?: string | null;
}

export const BANK_HANDLES: Record<string, string> = {
  // Google Pay
  okhdfcbank: "HDFC Bank",
  oksbi: "State Bank of India",
  okaxis: "Axis Bank",
  okicici: "ICICI Bank",
  // PhonePe
  ybl: "YES Bank (PhonePe)",
  ibl: "ICICI Bank (PhonePe)",
  axl: "Axis Bank (PhonePe)",
  // Paytm
  paytm: "Paytm Payments Bank",
  ptsbi: "State Bank of India (Paytm)",
  pthdfc: "HDFC Bank (Paytm)",
  ptaxis: "Axis Bank (Paytm)",
  pticici: "ICICI Bank (Paytm)",
  // BHIM / NPCI
  upi: "NPCI BHIM UPI",
  // Public and Private Banks
  sbi: "State Bank of India",
  sbiupi: "State Bank of India",
  hdfcbank: "HDFC Bank",
  icici: "ICICI Bank",
  eazypay: "ICICI Bank EazyPay",
  axisbank: "Axis Bank",
  axis: "Axis Bank",
  kotak: "Kotak Mahindra Bank",
  kmbl: "Kotak Mahindra Bank",
  pnb: "Punjab National Bank",
  barodampay: "Bank of Baroda",
  bob: "Bank of Baroda",
  cnrb: "Canara Bank",
  canarabank: "Canara Bank",
  unionbank: "Union Bank of India",
  unionbankofindia: "Union Bank of India",
  uboi: "Union Bank of India",
  indianbank: "Indian Bank",
  indbank: "Indian Bank",
  boi: "Bank of India",
  cbi: "Central Bank of India",
  idfcbank: "IDFC FIRST Bank",
  idfc: "IDFC FIRST Bank",
  indus: "IndusInd Bank",
  indusind: "IndusInd Bank",
  federal: "Federal Bank",
  fed: "Federal Bank",
  yesbank: "YES Bank",
  rbl: "RBL Bank",
  bandhan: "Bandhan Bank",
  uco: "UCO Bank",
  postbank: "India Post Payments Bank",
  ippb: "India Post Payments Bank",
  airtel: "Airtel Payments Bank",
  airtelbank: "Airtel Payments Bank",
  jio: "Jio Payments Bank",
  jiopay: "Jio Payments Bank",
  aubank: "AU Small Finance Bank",
  // Amazon Pay & WhatsApp Pay
  apl: "Amazon Pay (Axis Bank)",
  rapl: "Amazon Pay (RBL Bank)",
  yapl: "Amazon Pay (YES Bank)",
  waaxis: "WhatsApp Pay (Axis Bank)",
  wahdfc: "WhatsApp Pay (HDFC Bank)",
  waicici: "WhatsApp Pay (ICICI Bank)",
  wasbi: "WhatsApp Pay (SBI)",
  // Fintech TPAPs
  slice: "Slice (Axis Bank)",
  axisb: "CRED (Axis Bank)",
  cbwq: "CRED",
  ikwik: "MobiKwik",
  freecharge: "Freecharge (Axis Bank)",
  jupiteraxis: "Jupiter (Axis Bank)",
  tapicici: "Tata Neu (ICICI Bank)",
  navi: "Navi",
  scb: "Standard Chartered Bank",
  hsbc: "HSBC Bank",
  kvb: "Karur Vysya Bank",
  sib: "South Indian Bank",
};

export const VPA_SCAM_KEYWORDS = [
  "kyc", "refund", "cashback", "reward", "lottery", "winner", "prize",
  "helpline", "tollfree", "toll-free", "customercare", "customer.care",
  "customer-care", "support", "verification", "unblock", "suspended",
  "electricity-bill", "electricity.bill", "billdesk", "bonus", "freegift", "free-gift"
];

export function verifyUpiLegitimacy(vpa: string | null): {
  isFormatValid: boolean;
  isLegitBank: boolean;
  bankName: string | null;
  handle: string | null;
  isSuspicious: boolean;
  suspicionReason?: string;
} {
  if (!vpa || !vpa.includes("@")) {
    return {
      isFormatValid: false,
      isLegitBank: false,
      bankName: null,
      handle: null,
      isSuspicious: false,
    };
  }

  const parts = vpa.split("@");
  const username = parts[0].toLowerCase();
  const handle = parts[1].toLowerCase();

  const isFormatValid = VPA_REGEX.test(vpa);
  const bankName = BANK_HANDLES[handle] ?? null;
  const isLegitBank = Boolean(bankName);

  const matchedKeyword = VPA_SCAM_KEYWORDS.find((kw) => username.includes(kw));
  const isSuspicious = Boolean(matchedKeyword);
  const suspicionReason = matchedKeyword
    ? `Address contains suspicious keyword "${matchedKeyword}" (often used in impersonation scams)`
    : undefined;

  return {
    isFormatValid,
    isLegitBank,
    bankName,
    handle,
    isSuspicious,
    suspicionReason,
  };
}

const VPA_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z0-9]{2,64}$/;
const EMBEDDED_VPA_REGEX = /(?<![A-Za-z0-9._-])([a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z0-9]{2,64})(?![A-Za-z0-9.-])/;

export function inferBankName(vpa: string | null): string | null {
  if (!vpa || !vpa.includes("@")) return null;
  const handle = vpa.split("@")[1].toLowerCase();
  return BANK_HANDLES[handle] ?? null;
}

function formatHandleName(vpa: string | null): string | null {
  if (!vpa || !vpa.includes("@")) return null;
  const username = vpa.split("@")[0];
  // Replace dots, underscores, dashes with spaces and capitalize
  const parts = username
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  return parts.length > 0 ? parts.join(" ") : username;
}

function parseAmount(val: string | null): number | null {
  if (!val) return null;
  const num = Number(val.replace(/,/g, "").trim());
  return Number.isFinite(num) && num > 0 ? num : null;
}

function buildPaymentResult(
  kind: "upi_pay" | "vpa" | "url" | "text" | "empty",
  payeeVpa: string | null,
  payeeName: string | null,
  displayName: string | null,
  amount: number | null,
  currency: string,
  note: string | null,
  direction: "pay" | "receive" | "unknown",
  rawText: string,
): ParsedPayment {
  const leg = verifyUpiLegitimacy(payeeVpa);
  return {
    isPayment: Boolean(payeeVpa && (kind === "upi_pay" || leg.isFormatValid)),
    kind,
    payeeVpa,
    payeeName,
    displayName: displayName || (payeeVpa ? formatHandleName(payeeVpa) : null),
    amount,
    currency,
    note,
    bankName: leg.bankName,
    direction,
    rawText,
    isLegitBank: leg.isLegitBank,
    isSuspicious: leg.isSuspicious,
    suspicionReason: leg.suspicionReason,
    handle: leg.handle,
  };
}

export function parseUpiPayment(rawInput: string): ParsedPayment {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isPayment: false,
      kind: "empty",
      payeeVpa: null,
      payeeName: null,
      displayName: null,
      amount: null,
      currency: "INR",
      note: null,
      bankName: null,
      direction: "unknown",
      rawText: "",
      isLegitBank: false,
      isSuspicious: false,
    };
  }

  // 1. Check for upi://pay URI
  const upiPayMatch = trimmed.match(/upi:\/\/pay\b[^\s]*/i) || (trimmed.startsWith("upi://pay") ? [trimmed] : null);
  if (upiPayMatch) {
    try {
      const fullUrl = upiPayMatch[0].replace(/^upi:\/\/pay\?/i, "http://dummy/?");
      const url = new URL(fullUrl.startsWith("http") ? fullUrl : `http://dummy/?${fullUrl}`);
      const params = new URLSearchParams(url.search);

      const vpa = params.get("pa") || null;
      const pn = params.get("pn") ? decodeURIComponent(params.get("pn")!) : null;
      const am = parseAmount(params.get("am") || params.get("amount"));
      const cu = (params.get("cu") || "INR").toUpperCase();
      const tn = params.get("tn") ? decodeURIComponent(params.get("tn")!) : null;

      return buildPaymentResult("upi_pay", vpa, pn, pn, am, cu, tn, "pay", trimmed);
    } catch {
      // Fallback to regex parameter extraction
      const paMatch = trimmed.match(/[?&]pa=([^&]+)/i);
      const pnMatch = trimmed.match(/[?&]pn=([^&]+)/i);
      const amMatch = trimmed.match(/[?&]am=([^&]+)/i);
      const tnMatch = trimmed.match(/[?&]tn=([^&]+)/i);

      const vpa = paMatch ? decodeURIComponent(paMatch[1]) : null;
      const pn = pnMatch ? decodeURIComponent(pnMatch[1]) : null;
      const am = amMatch ? parseAmount(decodeURIComponent(amMatch[1])) : null;
      const tn = tnMatch ? decodeURIComponent(tnMatch[1]) : null;

      return buildPaymentResult("upi_pay", vpa, pn, pn, am, "INR", tn, "pay", trimmed);
    }
  }

  // 2. Standalone VPA
  if (VPA_REGEX.test(trimmed)) {
    return buildPaymentResult("vpa", trimmed, null, null, null, "INR", null, "pay", trimmed);
  }

  // 3. Embedded VPA and amount inside text
  const vpaMatch = trimmed.match(EMBEDDED_VPA_REGEX);
  if (vpaMatch) {
    const vpa = vpaMatch[1];
    const amountMatch = trimmed.match(/(?:₹|rs\.?\s?|inr\s?)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i) ||
      trimmed.match(/([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:rupees|₹)/i);
    const amount = amountMatch ? parseAmount(amountMatch[1]) : null;

    return buildPaymentResult("vpa", vpa, null, null, amount, "INR", null, "pay", trimmed);
  }

  // 4. Web link
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      isPayment: false,
      kind: "url",
      payeeVpa: null,
      payeeName: null,
      displayName: null,
      amount: null,
      currency: "INR",
      note: null,
      bankName: null,
      direction: "unknown",
      rawText: trimmed,
      isLegitBank: false,
      isSuspicious: false,
    };
  }

  // 5. Generic text
  return {
    isPayment: false,
    kind: "text",
    payeeVpa: null,
    payeeName: null,
    displayName: null,
    amount: null,
    currency: "INR",
    note: null,
    bankName: null,
    direction: "unknown",
    rawText: trimmed,
    isLegitBank: false,
    isSuspicious: false,
  };
}
