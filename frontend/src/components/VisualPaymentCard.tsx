import {
  ArrowRight,
  Building2,
  HelpCircle,
  MessageSquareShare,
  ShieldAlert,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import { type FamilyMember, buildFamilyShareMessage, openWhatsAppShare } from "../lib/family";
import type { ParsedPayment } from "../lib/upi";
import { useApp } from "../state";
import type { Intention, Outcome } from "../types";

interface VisualPaymentCardProps {
  payment: ParsedPayment;
  intention?: Intention;
  expectedAmount?: number | null;
  outcome?: Outcome;
  familyMatch?: FamilyMember | null;
}

export function VisualPaymentCard({
  payment,
  intention = "pay",
  expectedAmount = null,
  outcome,
  familyMatch,
}: VisualPaymentCardProps) {
  const { lang, t } = useApp();

  const isReceive = intention === "receive";
  const displayAmount = payment.amount ?? expectedAmount;
  const isAmountMismatch =
    expectedAmount !== null &&
    payment.amount !== null &&
    Math.abs(expectedAmount - payment.amount) > 0.01;

  const handleAskFamily = () => {
    const msg = buildFamilyShareMessage(
      {
        payeeName: payment.displayName || payment.payeeVpa || "Unknown",
        vpa: payment.payeeVpa || "N/A",
        amount: displayAmount,
        outcomeLabel: outcome ? t.result.title : undefined,
      },
      lang,
    );
    openWhatsAppShare(familyMatch?.phoneNumber, msg);
  };

  const getDirectionText = () => {
    if (isReceive) {
      if (lang === "hi") {
        return {
          title: "सावधान! QR कोड से पैसे कभी नहीं मिलते",
          sub: "QR कोड स्कैन करने या पिन डालने से पैसे केवल कटते हैं, आते नहीं। पैसे पाने के लिए अपना QR दिखाएँ।",
        };
      }
      if (lang === "kn") {
        return {
          title: "ಎಚ್ಚರಿಕೆ! QR ಕೋಡ್‌ನಿಂದ ಹಣ ಬರುವುದಿಲ್ಲ",
          sub: "QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡುವುದರಿಂದ ಹಣ ಹೋಗುತ್ತದೆಯೇ ಹೊರತು ಖಾತೆಗೆ ಬರುವುದಿಲ್ಲ.",
        };
      }
      return {
        title: "STOP: QR codes CANNOT receive money!",
        sub: "Scanning any QR code or entering your UPI PIN will SEND money from your account, never receive.",
      };
    }

    // Paying
    if (lang === "hi") {
      return {
        title: "पैसे आपके बैंक खाते से कटेंगे",
        sub: "यह राशि आपके खाते से काटकर प्राप्तकर्ता को भेजी जा रही है।",
      };
    }
    if (lang === "kn") {
      return {
        title: "ಹಣ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಕಡಿತಗೊಳ್ಳುತ್ತದೆ",
        sub: "ಈ ಮೊತ್ತವನ್ನು ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆಯಿಂದ ಸ್ವೀಕೃತಿದಾರರಿಗೆ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ.",
      };
    }
    return {
      title: "Money is LEAVING your account",
      sub: "This payment will be deducted from your bank account and sent to the recipient.",
    };
  };

  const dirText = getDirectionText();

  return (
    <div
      data-testid="visual-payment-card"
      className="overflow-hidden rounded-3xl border-2 border-navy/15 bg-paper shadow-soft transition-all"
    >
      {/* 1. Flow & Money Direction Banner */}
      <div
        className={`px-5 py-4 text-white ${
          isReceive
            ? "bg-coral-dark"
            : outcome === "high_concern"
              ? "bg-coral"
              : outcome === "be_careful"
                ? "bg-amber-600"
                : "bg-navy"
        }`}
      >
        <div className="flex items-center gap-3">
          {isReceive ? (
            <ShieldAlert className="h-8 w-8 shrink-0 text-white animate-pulse" />
          ) : (
            <Wallet className="h-7 w-7 shrink-0 text-teal-light" />
          )}
          <div>
            <h2 className="text-xl font-black leading-snug">{dirText.title}</h2>
            <p className="mt-0.5 text-sm text-white/90">{dirText.sub}</p>
          </div>
        </div>

        {/* Visual transfer flow diagram */}
        {!isReceive ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-bold">
                <Wallet className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold sm:text-base">
                {lang === "hi" ? "आपका खाता" : lang === "kn" ? "ನಿಮ್ಮ ಖಾತೆ" : "Your Bank"}
              </span>
            </div>

            <div className="flex flex-col items-center px-2">
              <span className="text-xs font-black uppercase tracking-wider text-teal-light">
                {lang === "hi" ? "भुगतान" : lang === "kn" ? "ಪಾವತಿ" : "Outgoing"}
              </span>
              <div className="flex items-center gap-1 font-mono font-bold text-teal-light">
                <span className="text-sm">──💸──</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-right">
              <div className="text-right">
                <span className="block truncate max-w-[130px] text-sm font-bold sm:text-base">
                  {payment.displayName || payment.payeeName || "Recipient"}
                </span>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal font-bold text-white">
                <User className="h-5 w-5" />
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* 2. Recipient & Amount Details */}
      <div className="space-y-4 p-5">
        {/* Recipient info */}
        <div className="rounded-2xl border border-navy/10 bg-cream/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-navy/60">
                {lang === "hi" ? "प्राप्तकर्ता (किसे भुगतान हो रहा है)" : lang === "kn" ? "ಸ್ವೀಕೃತಿದಾರರು" : "Paying To"}
              </span>
              <p className="mt-0.5 truncate text-2xl font-black text-navy">
                {payment.displayName || payment.payeeName || (payment.payeeVpa ?? t.common.notShown)}
              </p>
              {payment.payeeVpa ? (
                <p className="mt-1 flex items-center gap-1.5 font-mono text-base font-semibold text-navy/80 break-all">
                  <span className="select-all">{payment.payeeVpa}</span>
                </p>
              ) : null}
            </div>

            {payment.bankName ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-teal/30 bg-teal-soft/60 px-3 py-1 text-xs font-extrabold text-teal-dark shadow-sm">
                <Building2 className="h-3.5 w-3.5 text-teal" />
                {lang === "hi" ? "सत्यापित बैंक:" : "Verified Bank:"} {payment.bankName}
              </span>
            ) : payment.payeeVpa && payment.payeeVpa.includes("@") ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900 shadow-sm">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                {lang === "hi" ? "अपुष्ट बैंक हैंडल" : "Unverified Bank"}
              </span>
            ) : null}
          </div>

          {/* Impersonation / Suspicious VPA Alert */}
          {payment.isSuspicious ? (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border-2 border-coral/60 bg-coral/15 p-3 text-coral-dark">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 animate-pulse text-coral-dark" />
              <div className="text-xs">
                <span className="block font-black text-sm">
                  {lang === "hi" ? "🚨 संदिग्ध पता चेतावनी (धोखाधड़ी का खतरा)" : "🚨 Suspicious Payment Address Alert"}
                </span>
                <p className="mt-0.5 font-medium">
                  {payment.suspicionReason ||
                    (lang === "hi"
                      ? "यह पता अक्सर धोखेबाजों द्वारा प्रयुक्त शब्दों (जैसे kyc, refund, helpline) से मिलता-जुलता है।"
                      : "This address contains words commonly used by scammers to impersonate banks or support.")}
                </p>
              </div>
            </div>
          ) : null}

          {/* Unverified handle alert */}
          {!payment.isSuspicious && payment.payeeVpa && payment.payeeVpa.includes("@") && !payment.isLegitBank ? (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-50/90 p-3 text-amber-900">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-xs">
                <span className="block font-black text-sm">
                  {lang === "hi" ? "⚠️ अपुष्ट बैंक हैंडल" : "⚠️ Unverified Bank Handle"}
                </span>
                <p className="mt-0.5 font-medium">
                  {lang === "hi"
                    ? `हैंडल "@${payment.handle || payment.payeeVpa.split("@")[1]}" किसी मान्यता प्राप्त भारतीय बैंक सूची में नहीं है। भुगतान करने से पहले पुष्टि करें।`
                    : `The handle "@${payment.handle || payment.payeeVpa.split("@")[1]}" is not an authorized Indian bank or NPCI UPI handle. Proceed with caution.`}
                </p>
              </div>
            </div>
          ) : null}

          {/* Family profile badge */}
          {familyMatch ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-teal/40 bg-teal-soft/60 px-3 py-2 text-teal-dark">
              <ShieldCheck className="h-5 w-5 shrink-0 text-teal-dark" />
              <span className="text-sm font-bold">
                {lang === "hi"
                  ? `सत्यापित पारिवारिक सदस्य: ${familyMatch.name} (${familyMatch.relationship})`
                  : lang === "kn"
                    ? `ಪರಿಶೀಲಿಸಿದ ಕುಟುಂಬ ಸದಸ್ಯ: ${familyMatch.name} (${familyMatch.relationship})`
                    : `Verified Family / Trusted Contact: ${familyMatch.name} (${familyMatch.relationship})`}
              </span>
            </div>
          ) : payment.payeeVpa ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-navy/15 bg-paper px-3 py-2 text-navy/80">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <HelpCircle className="h-4 w-4 text-navy/60" />
                {lang === "hi"
                  ? "अपरिचित संपर्क (परिवार सूची में नहीं)"
                  : lang === "kn"
                    ? "ಅಪರಿಚಿತ ಸಂಪರ್ಕ (ಕುಟುಂಬ ಪಟ್ಟಿಯಲ್ಲಿಲ್ಲ)"
                    : "Unknown Recipient (Not in your family profiles)"}
              </span>
              <button
                type="button"
                onClick={handleAskFamily}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal bg-teal-soft px-2.5 py-1 text-xs font-bold text-teal-dark transition-colors hover:bg-teal hover:text-white"
              >
                <MessageSquareShare className="h-3.5 w-3.5" />
                {lang === "hi" ? "व्हाट्सएप पर परिवार से पूछें" : lang === "kn" ? "ಕುಟುಂಬದವರನ್ನು ಕೇಳಿ" : "Ask Family on WhatsApp"}
              </button>
            </div>
          ) : null}
        </div>

        {/* Amount Box */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-navy/10 bg-cream/40 p-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-navy/60">
              {lang === "hi" ? "भुगतान राशि" : lang === "kn" ? "ಪಾವತಿ ಮೊತ್ತ" : "Payment Amount"}
            </span>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-navy sm:text-4xl">
                {displayAmount !== null
                  ? `₹${displayAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
                  : lang === "hi"
                    ? "कोई राशि तय नहीं"
                    : lang === "kn"
                      ? "ಮೊತ್ತ ನಿಗದಿಯಾಗಿಲ್ಲ"
                      : "No amount fixed in QR"}
              </span>
              {payment.amount !== null ? (
                <span className="rounded-md bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal-dark">
                  {lang === "hi" ? "QR में तय" : lang === "kn" ? "QR ನಲ್ಲಿ ನಿಗದಿ" : "In QR"}
                </span>
              ) : null}
            </div>
          </div>

          {/* Amount discrepancy indicator */}
          {isAmountMismatch ? (
            <div className="rounded-xl border border-coral bg-coral-soft px-3 py-2 text-coral-dark">
              <span className="block text-xs font-bold uppercase">
                {lang === "hi" ? "राशि में अंतर!" : lang === "kn" ? "ಮೊತ್ತ ವ್ಯತ್ಯಾಸ!" : "Amount Mismatch!"}
              </span>
              <span className="text-sm font-semibold">
                {lang === "hi"
                  ? `आपकी उम्मीद: ₹${expectedAmount}`
                  : lang === "kn"
                    ? `ನಿರೀಕ್ಷಿತ: ₹${expectedAmount}`
                    : `You expected: ₹${expectedAmount}`}
              </span>
            </div>
          ) : null}
        </div>

        {/* Note if present */}
        {payment.note ? (
          <div className="rounded-xl bg-paper px-4 py-2.5 text-sm">
            <span className="font-bold text-navy/70">
              {lang === "hi" ? "विवरण / नोट:" : lang === "kn" ? "ವಿವರ:" : "Payment Note:"}{" "}
            </span>
            <span className="font-medium text-navy">{payment.note}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
