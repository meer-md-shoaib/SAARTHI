import type { Intention, Translated } from "../types";

export interface DemoScenario {
  id: string;
  art: "shop" | "amount" | "message" | "receive" | "link" | "novpa";
  title: Translated;
  description: Translated;
  raw_text: string;
  intention: Intention;
  expected_amount: number | null;
}

/**
 * Realistic sample payloads. Each one is crafted to exercise a different
 * engine verdict (low concern, high concern, be careful, unable to verify).
 */
export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "gpay-user-qr",
    art: "shop",
    title: {
      en: "Google Pay QR (Meer Mohammed Shoaib)",
      hi: "गूगल पे क्यूआर (मीर मोहम्मद शोएब)",
      kn: "ಗೂಗಲ್ ಪೇ QR (ಮೀರ್ ಮೊಹಮ್ಮದ್ ಶೋಯೆಬ್)",
    },
    description: {
      en: "Official Google Pay UPI QR: @okicici for Meer Mohammed Shoaib.",
      hi: "मीर मोहम्मद शोएब का आधिकारिक गूगल पे UPI क्यूआर (@okicici)।",
      kn: "ಮೀರ್ ಮೊಹಮ್ಮದ್ ಶೋಯೆಬ್ ಅವರ ಅಧಿಕೃತ ಗೂಗಲ್ ಪೇ UPI QR (@okicici).",
    },
    raw_text:
      "upi://pay?pa=meermohammedshoaib@okicici&pn=Meer%20Mohammed%20Shoaib&aid=uGICAgKCC74LNFw",
    intention: "pay",
    expected_amount: null,
  },
  {
    id: "kirana",
    art: "shop",
    title: {
      en: "A normal shop payment",
      hi: "एक सामान्य दुकान का भुगतान",
      kn: "ಒಂದು ಸಾಮಾನ್ಯ ಅಂಗಡಿ ಪಾವತಿ",
    },
    description: {
      en: "Kirana shop QR: right name, right amount.",
      hi: "किराना दुकान का क्यूआर: सही नाम, सही राशि।",
      kn: "ಕಿರಾಣಾ ಅಂಗಡಿ QR: ಸರಿಯಾದ ಹೆಸರು, ಸರಿಯಾದ ಮೊತ್ತ.",
    },
    raw_text:
      "upi://pay?pa=green.kiran@okhdfcbank&pn=Green%20Kiran%20Stores&am=250&cu=INR&tn=Kirana%20groceries",
    intention: "pay",
    expected_amount: 250,
  },
  {
    id: "wrong-amount",
    art: "amount",
    title: {
      en: "The amount is different",
      hi: "राशि अलग है",
      kn: "ಮೊತ್ತ ಬೇರೆಯಾಗಿದೆ",
    },
    description: {
      en: "The QR asks for ₹5,000, but you expect to pay ₹500.",
      hi: "क्यूआर ₹5,000 माँग रहा है, जबकि आप ₹500 देने की उम्मीद रखते हैं।",
      kn: "QR ₹5,000 ಕೇಳುತ್ತಿದೆ, ಆದರೆ ನೀವು ₹500 ಕೊಡುವ ನಿರೀಕ್ಷೆಯಲ್ಲಿದ್ದೀರಿ.",
    },
    raw_text:
      "upi://pay?pa=lucky.offer@okaxis&pn=Lucky%20Offer%20Store&am=5000&cu=INR&tn=Prize%20fee",
    intention: "pay",
    expected_amount: 500,
  },
  {
    id: "otp-threat",
    art: "message",
    title: {
      en: "A threatening message",
      hi: "धमकी भरा संदेश",
      kn: "ಬೆದರಿಕೆಯ ಸಂದೇಶ",
    },
    description: {
      en: "It asks for your OTP and PIN or your account will be blocked.",
      hi: "आपका OTP और पिन माँगता है, नहीं तो खाता ब्लॉक होगा।",
      kn: "ನಿಮ್ಮ ಒಟಿಪಿ ಮತ್ತು ಪಿನ್ ಕೇಳುತ್ತದೆ, ಇಲ್ಲದಿದ್ದರೆ ಖಾತೆ ನಿರ್ಬಂಧ.",
    },
    raw_text:
      "Your bank account will be blocked today. Share your OTP and UPI PIN immediately to keep it active.",
    intention: "pay",
    expected_amount: null,
  },
  {
    id: "receive-trick",
    art: "receive",
    title: {
      en: "A 'receive money' trick",
      hi: "'पैसे पाने' का जाल",
      kn: "'ಹಣ ಪಡೆ' ಜಾಲ",
    },
    description: {
      en: "You are told to scan a QR to receive ₹2,000.",
      hi: "₹2,000 पाने के लिए क्यूआर स्कैन करने को कहा जा रहा है।",
      kn: "₹2,000 ಪಡೆಯಲು QR ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಹೇಳಲಾಗುತ್ತಿದೆ.",
    },
    raw_text:
      "Congratulations! You will receive Rs. 2,000. Scan this QR to receive money: upi://pay?pa=winner.claim@ybl&pn=Prize%20Desk&am=2000&cu=INR",
    intention: "receive",
    expected_amount: null,
  },
  {
    id: "short-link",
    art: "link",
    title: {
      en: "A short website link",
      hi: "छोटा वेबसाइट लिंक",
      kn: "ಚಿಕ್ಕ ಜಾಲತಾಣ ಕೊಂಡಿ",
    },
    description: {
      en: "The code only contains a website link, not payment details.",
      hi: "कोड में सिर्फ वेबसाइट लिंक है, भुगतान की जानकारी नहीं।",
      kn: "ಕೋಡ್‌ನಲ್ಲಿ ಜಾಲತಾಣ ಕೊಂಡಿ ಮಾತ್ರ ಇದೆ, ಪಾವತಿ ಮಾಹಿತಿ ಇಲ್ಲ.",
    },
    raw_text: "https://bit.ly/claim-prize-now",
    intention: "pay",
    expected_amount: null,
  },
  {
    id: "no-amount",
    art: "novpa",
    title: {
      en: "A QR without an amount",
      hi: "राशि के बिना क्यूआर",
      kn: "ಮೊತ್ತವಿಲ್ಲದ QR",
    },
    description: {
      en: "No amount in the code, but you expect to pay ₹1,500.",
      hi: "कोड में कोई राशि नहीं, पर आप ₹1,500 देने की उम्मीद रखते हैं।",
      kn: "ಕೋಡ್‌ನಲ್ಲಿ ಮೊತ್ತ ಇಲ್ಲ, ಆದರೆ ನೀವು ₹1,500 ಕೊಡುವ ನಿರೀಕ್ಷೆಯಲ್ಲಿದ್ದೀರಿ.",
    },
    raw_text: "upi://pay?pa=ramesh.verifiers@oksbi&pn=Ramesh",
    intention: "pay",
    expected_amount: 1500,
  },
];
