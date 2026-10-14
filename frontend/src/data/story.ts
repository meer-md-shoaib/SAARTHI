import type { Translated } from "../types";

export interface StoryOption {
  label: Translated;
  next: string;
}

export interface StoryNode {
  id: string;
  art: "message" | "thinking" | "check" | "gone" | "safe";
  text: Translated;
  options: StoryOption[];
}

export interface StoryEnding {
  kind: "good" | "bad";
  title: Translated;
  text: Translated;
}

/**
 * "Choose your action" story - teaches safer payment decisions by letting the
 * reader try both paths.
 */
export const STORY_START = "start";

export const STORY_NODES: StoryNode[] = [
  {
    id: "start",
    art: "message",
    text: {
      en: "Meena gets a message: \u201cYou have won ₹2,000! Scan this QR to receive your prize.\u201d Her phone shows the QR now.",
      hi: "मीना को संदेश मिलता है: \u201cआपने ₹2,000 जीते हैं! इनाम पाने के लिए यह क्यूआर स्कैन करें।\u201d उसके फ़ोन पर क्यूआर आ गया है।",
      kn: "ಮೀನಾಳಿಗೆ ಸಂದೇಶ ಬರುತ್ತದೆ: \u201cನೀವು ₹2,000 ಗೆದ್ದಿದ್ದೀರಿ! ಬಹುಮಾನ ಪಡೆಯಲು ಈ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.\u201d ಫೋನ್‌ನಲ್ಲಿ QR ಬಂದಿದೆ.",
    },
    options: [
      {
        label: { en: "Scan it quickly", hi: "जल्दी से स्कैन करूँ", kn: "ಬೇಗ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ" },
        next: "hasty",
      },
      {
        label: { en: "Pause and think first", hi: "रुककर पहले सोचूँ", kn: "ನಿಲ್ಲಿ ಮೊದಲು ಯೋಚಿಸಿ" },
        next: "pause",
      },
    ],
  },
  {
    id: "pause",
    art: "thinking",
    text: {
      en: "Meena remembers: scanning a QR only starts a payment, it never brings money in. She decides to check the code in SAARTHI SafePay.",
      hi: "मीना को याद आता है: क्यूआर स्कैन करने से सिर्फ भुगतान शुरू होता है, पैसे कभी नहीं आते। वह कोड को SAARTHI SafePay में जाँचने का फैसला करती है।",
      kn: "ಮೀನಾಗೆ ನೆನಪಾಗುತ್ತದೆ: QR ಸ್ಕ್ಯಾನ್ ಪಾವತಿ ಮಾತ್ರ ಆರಂಭಿಸುತ್ತದೆ, ಹಣ ಎಂದಿಗೂ ತರುವುದಿಲ್ಲ. ಅವಳು ಕೋಡ್ ಅನ್ನು SAARTHI SafePay‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಲು ನಿರ್ಧರಿಸುತ್ತಾಳೆ.",
    },
    options: [
      {
        label: { en: "Check the QR in the app", hi: "ऐप में क्यूआर जाँचूँ", kn: "ಆ್ಯಪ್‌ನಲ್ಲಿ QR ಪರಿಶೀಲಿಸಿ" },
        next: "checked",
      },
      {
        label: { en: "Ignore the warning signs", hi: "चेतावनी को अनदेखा करूँ", kn: "ಎಚ್ಚರಿಕೆಗಳನ್ನು ಕಡೆಗಣಿಸಿ" },
        next: "hasty",
      },
    ],
  },
  {
    id: "checked",
    art: "check",
    text: {
      en: "The app shows \u201cHigh Concern\u201d: the message claims you will receive money, but the QR starts a payment from her account. Saarthi says: stop, do not pay.",
      hi: "ऐप \u201cअधिक चिंता\u201d दिखाता है: संदेश कहता है कि पैसे मिलेंगे, पर क्यूआर उसके खाते से भुगतान शुरू करता है। सारथी कहता है: रुकें, भुगतान न करें।",
      kn: "ಆ್ಯಪ್ \u201cಹೆಚ್ಚು ಆತಂಕ\u201d ತೋರಿಸುತ್ತದೆ: ಸಂದೇಶ ಹಣ ಬರುತ್ತದೆ ಎಂದಿದೆ, ಆದರೆ QR ಅವಳ ಖಾತೆಯಿಂದ ಪಾವತಿ ಆರಂಭಿಸುತ್ತದೆ. ಸಾರಥಿ ಹೇಳುತ್ತಾನೆ: ನಿಲ್ಲಿ, ಪಾವತಿ ಮಾಡಬೇಡಿ.",
    },
    options: [
      {
        label: { en: "Do not pay, tell her son", hi: "भुगतान न करें, बेटे को बताऊँ", kn: "ಪಾವತಿ ಮಾಡಬೇಡಿ, ಮಗನಿಗೆ ಹೇಳಿ" },
        next: "safe_end",
      },
      {
        label: { en: "Pay to finish quickly", hi: "जल्दी निपटाने के लिए भुगतान करूँ", kn: "ಬೇಗ ಮುಗಿಸಲು ಪಾವತಿಸಿ" },
        next: "lost",
      },
    ],
  },
  {
    id: "hasty",
    art: "gone",
    text: {
      en: "The screen asks for an amount Meena never agreed to. She enters her PIN to finish \u2014 and ₹2,000 leaves her account.",
      hi: "स्क्रीन वह राशि माँगती है जिस पर मीना ने सहमति नहीं दी थी। जल्दी निपटाने के लिए वह पिन डालती है \u2014 और ₹2,000 खाते से निकल जाते हैं।",
      kn: "ಪರದೆ ಮೀನಾ ಒಪ್ಪದ ಮೊತ್ತವನ್ನು ಕೇಳುತ್ತದೆ. ಬೇಗ ಮುಗಿಸಲು ಅವಳು ಪಿನ್ ನಮೂದಿಸುತ್ತಾಳೆ \u2014 ಮತ್ತು ₹2,000 ಖಾತೆಯಿಂದ ಹೋಗುತ್ತದೆ.",
    },
    options: [],
  },
  {
    id: "lost",
    art: "gone",
    text: {
      en: "Too late, the money is gone. Meena calls her bank on the official number and reports it on 1930, but the amount cannot be returned at once.",
      hi: "देर हो चुकी है, पैसे चले गए। मीना बैंक के आधिकारिक नंबर पर कॉल करती है और 1930 पर शिकायत करती है, पर पैसे तुरंत वापस नहीं मिलते।",
      kn: "ತಡವಾಗಿದೆ, ಹಣ ಹೋಗಿದೆ. ಮೀನಾ ಬ್ಯಾಂಕಿನ ಅಧಿಕೃತ ನಂಬರ್‌ಗೆ ಕರೆ ಮಾಡಿ 1930 ರಲ್ಲಿ ದೂರು ನೀಡುತ್ತಾಳೆ, ಆದರೆ ಹಣ ತಕ್ಷಣ ಹಿಂತಿರುಗುವುದಿಲ್ಲ.",
    },
    options: [],
  },
  {
    id: "safe_end",
    art: "safe",
    text: {
      en: "Meena does not pay. She shows her son, blocks the number, and nothing is lost. \u201cTen seconds of thinking saved two thousand rupees,\u201d she says.",
      hi: "मीना भुगतान नहीं करती। वह बेटे को दिखाती है, नंबर ब्लॉक कराती है, और कुछ नहीं जाता। वह कहती है: \u201cदस सेकंड की सोच ने दो हज़ार रुपये बचा लिए।\u201d",
      kn: "ಮೀನಾ ಪಾವತಿ ಮಾಡುವುದಿಲ್ಲ. ಅವಳು ಮಗನಿಗೆ ತೋರಿಸುತ್ತಾಳೆ, ನಂಬರ್ ನಿರ್ಬಂಧಿಸುತ್ತಾಳೆ, ಏನೂ ಹೋಗುವುದಿಲ್ಲ. \u201cಹತ್ತು ಸೆಕೆಂಡಿನ ಯೋಚನೆ ಎರಡು ಸಾವಿರ ರೂಪಾಯಿ ಉಳಿಸಿತು\u201d ಎಂದು ಅವಳು ಹೇಳುತ್ತಾಳೆ.",
    },
    options: [],
  },
];

export const STORY_ENDINGS: Record<string, StoryEnding> = {
  hasty: {
    kind: "bad",
    title: { en: "A costly mistake", hi: "भारी पड़ी गलती", kn: "ದುಬಾರಿ ತಪ್ಪು" },
    text: {
      en: "Scam succeeded because there was no pause. A QR code can only take money, never give it.",
      hi: "रुकने की कमी के कारण ठगी सफल हुई। क्यूआर केवल पैसे ले सकता है, दे नहीं सकता।",
      kn: "ನಿಲ್ಲದಿದ್ದರಿಂದ ವಂಚನೆ ಯಶಸ್ವಿಯಾಯಿತು. QR ಹಣ ತೆಗೆಯಬಹುದು, ಕೊಡಲಾರದು.",
    },
  },
  lost: {
    kind: "bad",
    title: { en: "A costly mistake", hi: "भारी पड़ी गलती", kn: "ದುಬಾರಿ ತಪ್ಪು" },
    text: {
      en: "Ignoring the warning signs cost Meena her money. Reporting quickly on 1930 helps the bank act fast.",
      hi: "चेतावनी को अनदेखा करने से मीना के पैसे गए। जल्दी 1930 पर शिकायत करने पर बैंक तेज़ी से कार्रवाई कर सकता है।",
      kn: "ಎಚ್ಚರಿಕೆ ಕಡೆಗಣಿಸಿದ್ದರಿಂದ ಮೀನಾಳ ಹಣ ಹೋಯಿತು. ಬೇಗ 1930 ರಲ್ಲಿ ದೂರು ನೀಡಿದರೆ ಬ್ಯಾಂಕ್ ಬೇಗ ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳಬಹುದು.",
    },
  },
  safe_end: {
    kind: "good",
    title: { en: "A safe choice", hi: "सुरक्षित चुनाव", kn: "ಸುರಕ್ಷಿತ ಆಯ್ಕೆ" },
    text: {
      en: "Pausing and checking protected Meena's money. That is the whole trick: slow down, check, then decide.",
      hi: "रुककर जाँचने से मीना के पैसे बच गए। पूरी बात यही है: रुकें, जाँचें, फिर फैसला करें।",
      kn: "ನಿಂತು ಪರಿಶೀಲಿಸಿದ್ದರಿಂದ ಮೀನಾಳ ಹಣ ಉಳಿಯಿತು. ಇಡೀ ಸತ್ಯ ಇದೇ: ನಿಲ್ಲಿ, ಪರಿಶೀಲಿಸಿ, ನಂತರ ನಿರ್ಧರಿಸಿ.",
    },
  },
};

/** Node id -> ending id (nodes without options end the story). */
export const STORY_ENDINGS_BY_NODE: Record<string, string> = {
  hasty: "hasty",
  lost: "lost",
  safe_end: "safe_end",
};
