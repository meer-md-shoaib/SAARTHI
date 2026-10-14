import type { Translated } from "../types";

export interface StoryOption {
  label: Translated;
  next: string;
}

export interface StoryNode {
  id: string;
  art: "message" | "thinking" | "check" | "gone" | "safe" | "threat" | "pin" | "otp" | "shop";
  text: Translated;
  options: StoryOption[];
}

export interface StoryEnding {
  kind: "good" | "bad";
  title: Translated;
  text: Translated;
  goldenRule: Translated;
}

export interface StoryEpisode {
  id: string;
  icon: string;
  title: Translated;
  subtitle: Translated;
  character: string;
  startNode: string;
  nodes: StoryNode[];
  endings: Record<string, StoryEnding>;
  endingsByNode: Record<string, string>;
  goldenRule: Translated;
}

/* ------------------------------------------------------------------------- */
/* Episode 1: Meena's Prize QR (Kept as default for backward compatibility) */
/* ------------------------------------------------------------------------- */

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
    goldenRule: {
      en: "Golden Rule: Never enter your UPI PIN to receive money.",
      hi: "मूल नियम: पैसे पाने के लिए कभी UPI पिन न डालें।",
      kn: "ಚಿನ್ನದ ನಿಯಮ: ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ UPI ಪಿನ್ ನಮೂದಿಸಬೇಡಿ.",
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
    goldenRule: {
      en: "Golden Rule: If a message claims you won money, it is almost certainly a trap.",
      hi: "मूल नियम: इनाम जीतने का कोई भी संदेश लगभग हमेशा ठगी होता है।",
      kn: "ಚಿನ್ನದ ನಿಯಮ: ಬಹುಮಾನ ಬಂದಿದೆ ಎಂಬ ಯಾವುದೇ ಸಂದೇಶ ಬಹುತೇಕ ಮೋಸವಾಗಿರುತ್ತದೆ.",
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
    goldenRule: {
      en: "Golden Rule: Ten seconds of pause before paying can save your hard-earned life savings.",
      hi: "मूल नियम: भुगतान से पहले 10 सेकंड रुकना आपकी मेहनत की कमाई बचा सकता है।",
      kn: "ಚಿನ್ನದ ನಿಯಮ: ಪಾವತಿಸುವ ಮುನ್ನ ಹತ್ತು ಸೆಕೆಂಡ್ ಯೋಚಿಸುವುದು ನಿಮ್ಮ ಸಂಪಾದನೆಯನ್ನು ಉಳಿಸುತ್ತದೆ.",
    },
  },
};

export const STORY_ENDINGS_BY_NODE: Record<string, string> = {
  hasty: "hasty",
  lost: "lost",
  safe_end: "safe_end",
};

/* ------------------------------------------------------------------------- */
/* Episode 2: Ramesh Ji & The Bijli Bill Cutoff Threat                       */
/* ------------------------------------------------------------------------- */

const BIJLI_NODES: StoryNode[] = [
  {
    id: "bijli_start",
    art: "threat",
    text: {
      en: "At 7:30 PM, 68-year-old Ramesh receives an urgent SMS: \u201cYour electricity connection will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately call power officer at 98765-XXXXX or scan meter QR.\u201d",
      hi: "शाम 7:30 बजे, 68 वर्षीय रमेश को डरावना SMS मिलता है: \u201cबिजली बिल अपडेट न होने के कारण आज रात 9:30 बजे आपकी बिजली काट दी जाएगी। तुरंत बिजली अधिकारी 98765-XXXXX को कॉल करें या मीटर क्यूआर स्कैन करें।\u201d",
      kn: "ಸಂಜೆ 7:30 ಕ್ಕೆ, 68 ವರ್ಷದ ರಮೇಶ್‌ಗೆ ಬೆದರಿಕೆ SMS ಬರುತ್ತದೆ: \u201cಹಿಂದಿನ ತಿಂಗಳ ಬಿಲ್ ಬಾಕಿ ಇರುವುದರಿಂದ ಇಂದು ರಾತ್ರಿ 9:30 ಕ್ಕೆ ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸಲಾಗುವುದು. ಕೂಡಲೇ ಅಧಿಕಾರಿ 98765-XXXXX ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.\u201d",
    },
    options: [
      {
        label: {
          en: "Call the officer in panic",
          hi: "घबराकर उस नंबर पर कॉल करूँ",
          kn: "ಗಾಬರಿಯಾಗಿ ಆ ನಂಬರ್‌ಗೆ ಕರೆ ಮಾಡಿ",
        },
        next: "bijli_call",
      },
      {
        label: {
          en: "Stop and check the paper bill / app",
          hi: "रुककर पिछला बिल या ऐप जाँचूँ",
          kn: "ನಿಂತು ಹಳೆಯ ಬಿಲ್ ಅಥವಾ ಆ್ಯಪ್ ಪರಿಶೀಲಿಸಿ",
        },
        next: "bijli_verify",
      },
    ],
  },
  {
    id: "bijli_call",
    art: "message",
    text: {
      en: "The \u201cofficer\u201d speaks aggressively: \u201cSir, your power will be cut in 1 hour! Install our QuickSupport app or pay ₹15 update fee via this QR right now.\u201d",
      hi: "\u201cअधिकारी\u201d गुस्से में बोलता है: \u201cसर, 1 घंटे में बत्ती गुल हो जाएगी! तुरंत हमारा सपोर्ट ऐप इंस्टॉल करें या इस क्यूआर पर ₹15 अपडेट फ़ीस भरें।\u201d",
      kn: "\u201cಅಧಿಕಾರಿ\u201d ಗದರುತ್ತಾನೆ: \u201cಸರ್, 1 ಗಂಟೆಯಲ್ಲಿ ಕರೆಂಟ್ ಹೋಗುತ್ತದೆ! ತಕ್ಷಣ ನಮ್ಮ ಸಪೋರ್ಟ್ ಆ್ಯಪ್ ಹಾಕಿ ಅಥವಾ ಈ QR ಗೆ ₹15 ಅಪ್ಡೇಟ್ ಶುಲ್ಕ ಕಟ್ಟಿ.\u201d",
    },
    options: [
      {
        label: {
          en: "Install app and pay ₹15",
          hi: "ऐप डालकर ₹15 भर दूँ",
          kn: "ಆ್ಯಪ್ ಹಾಕಿ ₹15 ಪಾವತಿಸಿ",
        },
        next: "bijli_scammed",
      },
      {
        label: {
          en: "Hang up and check in Saarthi SafePay",
          hi: "फ़ोन काटूँ और सारथी में जाँचूँ",
          kn: "ಫೋನ್ ಇಟ್ಟು ಸಾರಥಿಯಲ್ಲಿ ಪರಿಶೀಲಿಸಿ",
        },
        next: "bijli_safe",
      },
    ],
  },
  {
    id: "bijli_verify",
    art: "thinking",
    text: {
      en: "Ramesh opens his electricity provider's official portal. It clearly shows: \u201cBill Status: Paid in full. Balance: ₹0.00\u201d. The SMS was completely fake!",
      hi: "रमेश बिजली बोर्ड की आधिकारिक वेबसाइट खोलते हैं। वहाँ साफ़ लिखा है: \u201cबिल स्थिति: पूर्ण भुगतान। बकाया: ₹0.00\u201d। वह SMS पूरी तरह नकली था!",
      kn: "ರಮೇಶ್ ಅಧಿಕೃತ ವಿದ್ಯುತ್ ಮಂಡಳಿ ಪೋರ್ಟಲ್ ತೆರೆಯುತ್ತಾರೆ. ಅಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ತೋರಿಸುತ್ತದೆ: \u201cಬಿಲ್ ಸ್ಥಿತಿ: ಪಾವತಿಸಲಾಗಿದೆ. ಬಾಕಿ: ₹0.00\u201d. ಆ SMS ಪೂರ್ತಿ ನಕಲಿ!",
    },
    options: [
      {
        label: {
          en: "Block the scammer number",
          hi: "ठग का नंबर ब्लॉक करें",
          kn: "ಮೋಸಗಾರನ ನಂಬರ್ ಬ್ಲಾಕ್ ಮಾಡಿ",
        },
        next: "bijli_safe",
      },
    ],
  },
  {
    id: "bijli_scammed",
    art: "gone",
    text: {
      en: "The screen-sharing app gave scammers full access to Ramesh's phone. Within 3 minutes, OTPs were stolen and ₹45,000 was siphoned from his pension account.",
      hi: "स्क्रीन-शेयरिंग ऐप ने ठगों को रमेश के पूरे फ़ोन का नियंत्रण दे दिया। 3 मिनट के अंदर OTP चोरी हो गए और पेंशन खाते से ₹45,000 निकल गए।",
      kn: "ಸ್ಕ್ರೀನ್-ಶೇರಿಂಗ್ ಆ್ಯಪ್ ವಂಚಕರಿಗೆ ರಮೇಶ್ ಫೋನ್‌ನ ಸಂಪೂರ್ಣ ನಿಯಂತ್ರಣ ನೀಡಿತು. 3 ನಿಮಿಷದಲ್ಲಿ ಒಟಿಪಿ ಕದ್ದು ಅವರ ಪಿಂಚಣಿ ಖಾತೆಯಿಂದ ₹45,000 ಖಾಲಿಯಾಯಿತು.",
    },
    options: [],
  },
  {
    id: "bijli_safe",
    art: "safe",
    text: {
      en: "Ramesh blocked the number and slept peacefully. In the morning, the power was still on. He told his colony group: \u201cNever panic on electricity messages!\u201d",
      hi: "रमेश ने नंबर ब्लॉक किया और चैन की नींद सोए। सुबह बिजली चालू थी। उन्होंने अपनी कॉलोनी के समूह में बताया: \u201cबिजली काटने के संदेशों से कभी न डरें!\u201d",
      kn: "ರಮೇಶ್ ನಂಬರ್ ಬ್ಲಾಕ್ ಮಾಡಿ ನೆಮ್ಮದಿಯಿಂದ ಮಲಗಿದರು. ಬೆಳಗ್ಗೆ ವಿದ್ಯುತ್ ಎಂದಿನಂತೆ ಇತ್ತು. ಅವರು ತಮ್ಮ ಕಾಲೋನಿ ಗುಂಪಿನಲ್ಲಿ ಹೇಳಿದರು: \u201cವಿದ್ಯುತ್ ಸಂದೇಶಕ್ಕೆ ಎಂದಿಗೂ ಹೆದರಬೇಡಿ!\u201d",
    },
    options: [],
  },
];

const BIJLI_ENDINGS: Record<string, StoryEnding> = {
  bijli_scammed: {
    kind: "bad",
    title: { en: "Pension Savings Lost", hi: "पेंशन की कमाई लुट गई", kn: "ಪಿಂಚಣಿ ಹಣ ಕಳೆದುಹೋಯಿತು" },
    text: {
      en: "Scammers use panic of losing power to make people download remote access tools and reveal OTPs.",
      hi: "ठग बिजली कटने का डर दिखाकर रिमोट ऐप डाउनलोड करवाते हैं और OTP चुरा लेते हैं।",
      kn: "ವಿದ್ಯುತ್ ಕಡಿತದ ಭಯ ಹುಟ್ಟಿಸಿ ವಂಚಕರು ರಿಮೋಟ್ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿಸಿ ಒಟಿಪಿ ಕದಿಯುತ್ತಾರೆ.",
    },
    goldenRule: {
      en: "Golden Rule: Electricity boards never send personal 10-digit mobile numbers for bill payments.",
      hi: "मूल नियम: बिजली विभाग कभी बिल के लिए किसी का व्यक्तिगत 10-अंकों वाला मोबाइल नंबर नहीं भेजता।",
      kn: "ಚಿನ್ನದ ನಿಯಮ: ವಿದ್ಯುತ್ ಮಂಡಳಿ ಎಂದಿಗೂ ವೈಯಕ್ತಿಕ ಮೊಬೈಲ್ ನಂಬರ್‌ನಿಂದ ಬಿಲ್ ಕಟ್ಟಲು ಕೇಳುವುದಿಲ್ಲ.",
    },
  },
  bijli_safe: {
    kind: "good",
    title: { en: "A Calm & Safe Elder", hi: "समझदार और सुरक्षित", kn: "ಬುದ್ಧಿವಂತ ಮತ್ತು ಸುರಕ್ಷಿತ" },
    text: {
      en: "By verifying his actual bill on the official app, Ramesh saved his savings from a classic phishing trap.",
      hi: "आधिकारिक ऐप पर असली बिल जाँचकर रमेश ने अपनी ज़िंदगी की बचत बचा ली।",
      kn: "ಅಧಿಕೃತ ಆ್ಯಪ್‌ನಲ್ಲಿ ನಿಜವಾದ ಬಿಲ್ ಪರಿಶೀಲಿಸಿ ರಮೇಶ್ ದೊಡ್ಡ ವಂಚನೆಯಿಂದ ಪಾರಾದರು.",
    },
    goldenRule: {
      en: "Golden Rule: Always check bill dues directly on your official utility provider app.",
      hi: "मूल नियम: बकाया बिल हमेशा अपनी आधिकारिक बिजली कंपनी के ऐप पर ही देखें।",
      kn: "ಚಿನ್ನದ ನಿಯಮ: ಬಾಕಿ ಬಿಲ್ ಅನ್ನು ಯಾವಾಗಲೂ ನಿಮ್ಮ ಅಧಿಕೃತ ಕಂಪನಿಯ ಆ್ಯಪ್‌ನಲ್ಲೇ ಪರಿಶೀಲಿಸಿ.",
    },
  },
};

/* ------------------------------------------------------------------------- */
/* Episode 3: Sharma Ji & The Digital Arrest Scam                            */
/* ------------------------------------------------------------------------- */

const POLICE_NODES: StoryNode[] = [
  {
    id: "police_start",
    art: "threat",
    text: {
      en: "Sharma ji gets a video call from a man in police uniform: \u201cI am DCP Cyber Branch. A parcel with drugs and your Aadhaar was seized at customs. You are under Digital Arrest right now.\u201d",
      hi: "शर्मा जी को पुलिस वर्दी वाले व्यक्ति का वीडियो कॉल आता है: \u201cमैं डीसीपी साइबर ब्रांच बोल रहा हूँ। आपके आधार पर ड्रग्स का पार्सल पकड़ा गया है। आप अभी डिजिटल अरेस्ट में हैं।\u201d",
      kn: "ಶರ್ಮಾ ಜಿ ಅವರಿಗೆ ಪೊಲೀಸ್ ಸಮವಸ್ತ್ರಧಾರಿ ವ್ಯಕ್ತಿಯಿಂದ ವೀಡಿಯೊ ಕರೆ ಬರುತ್ತದೆ: \u201cನಾನು ಡಿಸಿಪಿ ಸೈಬರ್ ಬ್ರಾಂಚ್. ನಿಮ್ಮ ಆಧಾರ್ ಇರುವ ಡ್ರಗ್ಸ್ ಪಾರ್ಸಲ್ ಸಿಕ್ಕಿಬಿದ್ದಿದೆ. ನೀವು ಈಗಲೇ ಡಿಜಿಟಲ್ ಬಂಧನದಲ್ಲಿದ್ದೀರಿ.\u201d",
    },
    options: [
      {
        label: {
          en: "Beg him and follow instructions",
          hi: "घबराकर हाथ जोड़ूँ और जैसा कहे करूँ",
          kn: "ಹೆದರಿ ಕೈಮುಗಿದು ಹೇಳಿದಂತೆ ಮಾಡಿ",
        },
        next: "police_trap",
      },
      {
        label: {
          en: "Say: \u201cI will visit my local police station\u201d",
          hi: "कहूँ: \u201cमैं अपने नज़दीकी थाने खुद आऊँगा\u201d",
          kn: "ಹೇಳಿ: \u201cನಾನು ನನ್ನ ಠಾಣೆಗೆ ಖುದ್ದಾಗಿ ಬರುತ್ತೇನೆ\u201d",
        },
        next: "police_safe",
      },
    ],
  },
  {
    id: "police_trap",
    art: "pin",
    text: {
      en: "The fake officer yells: \u201cDo not disconnect, do not tell your family! To verify your funds are clean, transfer ₹1,00,000 to this RBI verification account now.\u201d",
      hi: "नकली पुलिसवाला चिल्लाता है: \u201cफ़ोन मत काटना, परिवार को मत बताना! खाते की जाँच के लिए इस RBI सत्यापन खाते में ₹1,00,000 अभी भेजो।\u201d",
      kn: "ನಕಲಿ ಅಧಿಕಾರಿ ಗದರುತ್ತಾನೆ: \u201cಫೋನ್ ಕಟ್ ಮಾಡಬೇಡಿ, ಮನೆಯವರಿಗೆ ಹೇಳಬೇಡಿ! ತನಿಖೆಗಾಗಿ RBI ವೆರಿಫಿಕೇಶನ್ ಖಾತೆಗೆ ₹1,00,000 ತಕ್ಷಣ ವರ್ಗಾಯಿಸಿ.\u201d",
    },
    options: [
      {
        label: {
          en: "Transfer money to stay out of jail",
          hi: "जेल जाने के डर से पैसे भेज दूँ",
          kn: "ಜೈಲಿನ ಭಯದಿಂದ ಹಣ ವರ್ಗಾಯಿಸಿ",
        },
        next: "police_lost",
      },
      {
        label: {
          en: "Hang up and dial 1930 Cyber helpline",
          hi: "फ़ोन काटूँ और 1930 हेल्पलाइन मिलाऊँ",
          kn: "ಫೋನ್ ಇಟ್ಟು 1930 ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ",
        },
        next: "police_safe",
      },
    ],
  },
  {
    id: "police_lost",
    art: "gone",
    text: {
      en: "Sharma ji transferred his life savings. The scammer hung up and deleted the account. Real police explained: \u201cNo Indian law has any provision for Digital Arrest.\u201d",
      hi: "शर्मा जी ने जीवन भर की पूंजी भेज दी। ठग ने तुरंत फ़ोन काट कर खाता बंद कर दिया। असली पुलिस ने समझाया: \u201cभारतीय कानून में डिजिटल अरेस्ट नाम की कोई चीज़ नहीं है।\u201d",
      kn: "ಶರ್ಮಾ ಜಿ ತಮ್ಮ ಇಡೀ ಉಳಿತಾಯದ ಹಣ ಕಳಿಸಿದರು. ವಂಚಕ ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸಿದ. ನಿಜವಾದ ಪೊಲೀಸರು ಹೇಳಿದರು: \u201cಭಾರತೀಯ ಕಾನೂನಿನಲ್ಲಿ ಡಿಜಿಟಲ್ ಬಂಧನ ಎಂಬುದು ಇಲ್ಲವೇ ಇಲ್ಲ.\u201d",
    },
    options: [],
  },
  {
    id: "police_safe",
    art: "safe",
    text: {
      en: "The moment Sharma ji said \u201cI am coming to the police station,\u201d the caller abruptly disconnected! Sharma ji dialed 1930 and saved his ₹1,00,000.",
      hi: "जैसे ही शर्मा जी ने कहा \u201cमैं खुद थाने आ रहा हूँ,\u201d फोन करने वाले ने तुरंत कॉल काट दी! शर्मा जी ने 1930 पर सूचना दी और ₹1,00,000 बचा लिए।",
      kn: "ಶರ್ಮಾ ಜಿ \u201cನಾನೇ ಠಾಣೆಗೆ ಬರುತ್ತೇನೆ\u201d ಎಂದ ತಕ್ಷಣ ಕರೆಯಲ್ಲಿದ್ದ ವ್ಯಕ್ತಿ ಫೋನ್ ಕಟ್ ಮಾಡಿದ! ಶರ್ಮಾ ಜಿ 1930 ಗೆ ಕರೆ ಮಾಡಿ ₹1,00,000 ಉಳಿಸಿಕೊಂಡರು.",
    },
    options: [],
  },
];

const POLICE_ENDINGS: Record<string, StoryEnding> = {
  police_lost: {
    kind: "bad",
    title: { en: "Trapped by Fear", hi: "डर के साए में लुट गए", kn: "ಭಯಕ್ಕೆ ಬಲಿಯಾದರು" },
    text: {
      en: "Scammers use fake uniforms, courtroom backdrops, and isolation to terrorize elderly citizens into transferring funds.",
      hi: "ठग नकली वर्दी और कोर्ट के बैकग्राउंड का इस्तेमाल करके बुज़ुर्गों को डराकर पैसे ऐंठते हैं।",
      kn: "ವಂಚಕರು ನಕಲಿ ಸಮವಸ್ತ್ರ ಮತ್ತು ಕೋರ್ಟ್ ಹಿನ್ನೆಲೆ ತೋರಿಸಿ ಹಿರಿಯರನ್ನು ಹೆದರಿಸಿ ಹಣ ಕೀಳುತ್ತಾರೆ.",
    },
    goldenRule: {
      en: "Golden Rule: There is NO SUCH THING as Digital Arrest. Real police never demand money on video calls.",
      hi: "मूल नियम: 'डिजिटल अरेस्ट' नाम की कोई चीज़ नहीं होती। असली पुलिस कभी वीडियो कॉल पर पैसे नहीं माँगती।",
      kn: "ಚಿನ್ನದ ನಿಯಮ: 'ಡಿಜಿಟಲ್ ಬಂಧನ' ಎಂಬುದು ಭಾರತೀಯ ಕಾನೂನಿನಲ್ಲಿ ಇಲ್ಲವೇ ಇಲ್ಲ. ಪೊಲೀಸರು ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿ ಹಣ ಕೇಳುವುದಿಲ್ಲ.",
    },
  },
  police_safe: {
    kind: "good",
    title: { en: "Brave & Victorious", hi: "निडर और सुरक्षित", kn: "ಧೈರ್ಯಶಾಲಿ ಮತ್ತು ಸುರಕ್ಷಿತ" },
    text: {
      en: "Insisting on meeting in person at the local station exposes fraud instantly. Scammers fear the real police.",
      hi: "थाने में आमने-सामने मिलने की बात कहते ही ठग भाग खड़े होते हैं क्योंकि वे असली पुलिस से डरते हैं।",
      kn: "ಖುದ್ದಾಗಿ ಠಾಣೆಯಲ್ಲಿ ಭೇಟಿಯಾಗುವುದಾಗಿ ಹೇಳಿದ ತಕ್ಷಣ ವಂಚಕರು ಓಡಿಹೋಗುತ್ತಾರೆ.",
    },
    goldenRule: {
      en: "Golden Rule: Never stay isolated on calls. Always involve your family and call helpline 1930.",
      hi: "मूल नियम: कभी अकेले में ऐसे कॉल न झेलें। तुरंत परिवार को बताएँ और 1930 पर कॉल करें।",
      kn: "ಚಿನ್ನದ ನಿಯಮ: ಇಂತಹ ಕರೆಯಲ್ಲಿ ರಹಸ್ಯವಾಗಿರಬೇಡಿ. ಕುಟುಂಬಕ್ಕೆ ತಿಳಿಸಿ ಮತ್ತು 1930 ಗೆ ದೂರು ನೀಡಿ.",
    },
  },
};

/* ------------------------------------------------------------------------- */
/* Episode 4: Kamala Ji & The Wrong Transfer Scam                            */
/* ------------------------------------------------------------------------- */

const REFUND_NODES: StoryNode[] = [
  {
    id: "refund_start",
    art: "shop",
    text: {
      en: "A man calls Kamala ji crying: \u201cAmma, my child is in ICU! I sent ₹10,000 to your GPay by mistake instead of the doctor. Please scan this QR to refund me immediately!\u201d A fake SMS also arrives.",
      hi: "एक आदमी कमला जी को रोते हुए कॉल करता है: \u201cअम्मा, मेरा बच्चा ICU में है! मैंने गलती से डॉक्टर की जगह आपके खाते में ₹10,000 भेज दिए। मुझे वापस करने के लिए यह क्यूआर स्कैन करें!\u201d एक फ़र्ज़ी SMS भी आता है।",
      kn: "ಒಬ್ಬ ವ್ಯಕ್ತಿ ಕಮಲಾ ಅಮ್ಮನಿಗೆ ಅಳುತ್ತಾ ಕರೆ ಮಾಡುತ್ತಾನೆ: \u201cಅಮ್ಮಾ, ನನ್ನ ಮಗು ಆಸ್ಪತ್ರೆಯಲ್ಲಿದೆ! ನಾನು ತಪ್ಪಾಗಿ ಡಾಕ್ಟರ್ ಬದಲು ನಿಮ್ಮ GPay ಗೆ ₹10,000 ಕಳಿಸಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ಈ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ವಾಪಸ್ ಕೊಡಿ!\u201d ಒಂದು ನಕಲಿ SMS ಕೂಡ ಬರುತ್ತದೆ.",
    },
    options: [
      {
        label: {
          en: "Help him quickly and scan QR",
          hi: "तरस खाकर तुरंत क्यूआर स्कैन करूँ",
          kn: "ಮರುಕಪಟ್ಟು ತಕ್ಷಣ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
        },
        next: "refund_trap",
      },
      {
        label: {
          en: "Open bank app to check real balance",
          hi: "बैंक ऐप खोलकर असली बैलेंस देखूँ",
          kn: "ಬ್ಯಾಂಕ್ ಆ್ಯಪ್ ತೆರೆದು ನಿಜವಾದ ಬ್ಯಾಲೆನ್ಸ್ ನೋಡಿ",
        },
        next: "refund_safe",
      },
    ],
  },
  {
    id: "refund_trap",
    art: "pin",
    text: {
      en: "The QR asks Kamala ji to enter her UPI PIN. The scammer says: \u201cAmma, PIN is just to verify the refund!\u201d",
      hi: "क्यूआर कमला जी से उनका UPI पिन माँगता है। ठग कहता है: \u201cअम्मा, पिन सिर्फ रिफ़ंड को मंज़ूर करने के लिए है!\u201d",
      kn: "QR ಕಮಲಾ ಅವರ ಬಳಿ UPI ಪಿನ್ ಕೇಳುತ್ತದೆ. ವಂಚಕ ಹೇಳುತ್ತಾನೆ: \u201cಅಮ್ಮಾ, ಪಿನ್ ಕೇವಲ ರಿಫಂಡ್ ವೆರಿಫಿಕೇಶನ್‌ಗೆ ಅಷ್ಟೇ!\u201d",
    },
    options: [
      {
        label: {
          en: "Enter PIN to help",
          hi: "पिन डालकर पैसे भेज दूँ",
          kn: "ಪಿನ್ ಹಾಕಿ ಕಳಿಸಿ",
        },
        next: "refund_lost",
      },
      {
        label: {
          en: "Stop! PIN is NEVER used for refunds",
          hi: "रुकें! रिफ़ंड के लिए पिन कभी नहीं डलता",
          kn: "ನಿಲ್ಲಿ! ಹಣ ಮರಳಿಸಲು ಪಿನ್ ಬೇಕಿಲ್ಲ",
        },
        next: "refund_safe",
      },
    ],
  },
  {
    id: "refund_lost",
    art: "gone",
    text: {
      en: "Kamala ji never received any ₹10,000 in the first place — the SMS was from an unknown personal mobile! And by entering her PIN, she lost ₹10,000 of her own savings.",
      hi: "कमला जी को कोई ₹10,000 मिले ही नहीं थे — वह SMS किसी अनजान मोबाइल से भेजा गया था! और पिन डालने से उनके खुद के ₹10,000 लुट गए।",
      kn: "ಕಮಲಾ ಅವರಿಗೆ ಯಾವುದೇ ₹10,000 ಬಂದೇ ಇರಲಿಲ್ಲ — ಆ SMS ನಕಲಿಯಾಗಿತ್ತು! ಮತ್ತು ಪಿನ್ ಹಾಕಿದ್ದರಿಂದ ಅವರದೇ ₹10,000 ಹಣ ಹೋಯಿತು.",
    },
    options: [],
  },
  {
    id: "refund_safe",
    art: "safe",
    text: {
      en: "Kamala ji checked her actual bank passbook statement inside her bank app. No money had arrived! She told the caller: \u201cLet us go together to the bank manager.\u201d The scammer hung up instantly.",
      hi: "कमला जी ने बैंक ऐप में जाकर अपना स्टेटमेंट देखा। कोई पैसा नहीं आया था! उन्होंने कॉल करने वाले से कहा: \u201cआओ साथ में बैंक मैनेजर के पास चलते हैं।\u201d ठग ने तुरंत कॉल काट दी।",
      kn: "ಕಮಲಾ ತಮ್ಮ ಬ್ಯಾಂಕ್ ಆ್ಯಪ್ ತೆರೆದು ಖಾತೆ ವಿವರ ನೋಡಿದರು. ಯಾವುದೇ ಹಣ ಬಂದಿರಲಿಲ್ಲ! ಅವರು ಹೇಳಿದರು: \u201cಬನ್ನಿ, ಇಬ್ಬರೂ ಬ್ಯಾಂಕ್ ಮ್ಯಾನೇಜರ್ ಬಳಿ ಹೋಗೋಣ.\u201d ವಂಚಕ ತಕ್ಷಣ ಫೋನ್ ಇಟ್ಟನು.",
    },
    options: [],
  },
];

const REFUND_ENDINGS: Record<string, StoryEnding> = {
  refund_lost: {
    kind: "bad",
    title: { en: "Kindness Exploited", hi: "भावुकता में धोखा", kn: "ಕರುಣೆಗೆ ವಂಚನೆಯ ಏಟು" },
    text: {
      en: "Scammers prey on emotional sympathy and fake credit SMS messages. Always verify your actual bank balance.",
      hi: "ठग झूठे रोने-धोने और नकली SMS के ज़रिए बुज़ुर्गों की दयालुता का ग़लत फ़ायदा उठाते हैं।",
      kn: "ವಂಚಕರು ನಕಲಿ ಅಳು ಮತ್ತು ನಕಲಿ SMS ಬಳಸಿ ಹಿರಿಯರ ಒಳ್ಳೆಯತನವನ್ನು ದುರುಪಯೋಗಪಡಿಸಿಕೊಳ್ಳುತ್ತಾರೆ.",
    },
    goldenRule: {
      en: "Golden Rule: Never trust an incoming SMS. Always log into your actual bank app to check real balance.",
      hi: "मूल नियम: सिर्फ SMS पर भरोसा न करें। हमेशा अपने बैंक ऐप में जाकर असली बैलेंस और स्टेटमेंट देखें।",
      kn: "ಚಿನ್ನದ ನಿಯಮ: ಕೇವಲ SMS ನಂಬಬೇಡಿ. ಯಾವಾಗಲೂ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಆ್ಯಪ್‌ನಲ್ಲಿ ನಿಜವಾದ ಬ್ಯಾಲೆನ್ಸ್ ನೋಡಿ.",
    },
  },
  refund_safe: {
    kind: "good",
    title: { en: "Smart Financial Defence", hi: "सच्ची समझदारी", kn: "ಬುದ್ಧಿವಂತಿಕೆಯ ರಕ್ಷಣೆ" },
    text: {
      en: "Kamala ji applied the ultimate check: verify before you trust. No bank transaction can bypass your real statement.",
      hi: "कमला जी ने सबसे बढ़िया नियम अपनाया: भरोसा करने से पहले बैंक में जाँचें।",
      kn: "ಕಮಲಾ ಅಮ್ಮ ಸರಿಯಾದ ನಿಯಮ ಪಾಲಿಸಿದರು: ನಂಬುವ ಮುನ್ನ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.",
    },
    goldenRule: {
      en: "Golden Rule: If anyone asks you to scan a QR or enter PIN to refund money, it is 100% a scam.",
      hi: "मूल नियम: यदि कोई पैसे वापस करने के लिए क्यूआर स्कैन या पिन माँगे, तो वह 100% ठगी है।",
      kn: "ಚಿನ್ನದ ನಿಯಮ: ಹಣ ವಾಪಸ್ ಕೊಡಲು QR ಸ್ಕ್ಯಾನ್ ಅಥವಾ ಪಿನ್ ಕೇಳಿದರೆ ಅದು 100% ವಂಚನೆ.",
    },
  },
};

/* ------------------------------------------------------------------------- */
/* All Episodes Registry                                                     */
/* ------------------------------------------------------------------------- */

export const STORY_EPISODES: StoryEpisode[] = [
  {
    id: "prize",
    icon: "🎁",
    title: {
      en: "Meena & The Prize QR",
      hi: "मीना और इनाम का क्यूआर",
      kn: "ಮೀನಾ ಮತ್ತು ಬಹುಮಾನದ ಕ್ಯೂಆರ್",
    },
    subtitle: {
      en: "The lottery reward trap targeting QR scans",
      hi: "इनाम के नाम पर पैसे काटने का झांसा",
      kn: "ಬಹುಮಾನದ ಹೆಸರಿನಲ್ಲಿ ಹಣ ಕದಿಯುವ ಜಾಲ",
    },
    character: "Meena (62 yrs)",
    startNode: "start",
    nodes: STORY_NODES,
    endings: STORY_ENDINGS,
    endingsByNode: STORY_ENDINGS_BY_NODE,
    goldenRule: {
      en: "You never need to enter a PIN or scan a QR to receive money.",
      hi: "पैसे पाने के लिए कभी पिन डालने या क्यूआर स्कैन करने की ज़रूरत नहीं होती।",
      kn: "ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ ಪಿನ್ ಹಾಕುವ ಅಥವಾ ಕ್ಯೂಆರ್ ಸ್ಕ್ಯಾನ್ ಮಾಡುವ ಅಗತ್ಯವಿಲ್ಲ.",
    },
  },
  {
    id: "bijli",
    icon: "⚡",
    title: {
      en: "Ramesh & The Electricity Threat",
      hi: "रमेश और बिजली बिल की धमकी",
      kn: "ರಮೇಶ್ ಮತ್ತು ವಿದ್ಯುತ್ ಬಿಲ್ ಬೆದರಿಕೆ",
    },
    subtitle: {
      en: "Urgent power disconnection message at night",
      hi: "रात को बिजली काटने का डर दिखाकर ठगी",
      kn: "ರಾತ್ರಿ ಕರೆಂಟ್ ಕಟ್ ಮಾಡುವ ಭಯ ಹುಟ್ಟಿಸಿ ವಂಚನೆ",
    },
    character: "Ramesh (68 yrs)",
    startNode: "bijli_start",
    nodes: BIJLI_NODES,
    endings: BIJLI_ENDINGS,
    endingsByNode: {
      bijli_scammed: "bijli_scammed",
      bijli_safe: "bijli_safe",
    },
    goldenRule: {
      en: "Electricity boards never send personal mobile numbers threatening immediate cutoff.",
      hi: "बिजली विभाग तुरंत बिजली काटने की धमकी वाले व्यक्तिगत मोबाइल नंबर नहीं भेजता।",
      kn: "ವಿದ್ಯುತ್ ಮಂಡಳಿ ಎಂದಿಗೂ ವೈಯಕ್ತಿಕ ನಂಬರ್ ಕಳಿಸಿ ತಕ್ಷಣ ಕಡಿತಗೊಳಿಸುವ ಬೆದರಿಕೆ ಹಾಕುವುದಿಲ್ಲ.",
    },
  },
  {
    id: "police",
    icon: "👮",
    title: {
      en: "Sharma Ji & Digital Arrest",
      hi: "शर्मा जी और डिजिटल अरेस्ट",
      kn: "ಶರ್ಮಾ ಜಿ ಮತ್ತು ಡಿಜಿಟಲ್ ಬಂಧನ",
    },
    subtitle: {
      en: "Fake police video call claiming illegal parcels",
      hi: "नकली पुलिस बनकर पार्सल के नाम पर डराना",
      kn: "ನಕಲಿ ಪೊಲೀಸ್ ವೀಡಿಯೊ ಕರೆ ಮೂಲಕ ಬೆದರಿಕೆ",
    },
    character: "Sharma Ji (71 yrs)",
    startNode: "police_start",
    nodes: POLICE_NODES,
    endings: POLICE_ENDINGS,
    endingsByNode: {
      police_lost: "police_lost",
      police_safe: "police_safe",
    },
    goldenRule: {
      en: "Digital Arrest does not exist in India. Real police never demand money on video calls.",
      hi: "डिजिटल अरेस्ट भारत में कोई कानून नहीं है। पुलिस कभी वीडियो कॉल पर पैसे नहीं माँगती।",
      kn: "ಭಾರತದಲ್ಲಿ ಡಿಜಿಟಲ್ ಬಂಧನ ಎಂಬುದು ಇಲ್ಲ. ಪೊಲೀಸರು ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿ ಹಣ ಕೇಳುವುದಿಲ್ಲ.",
    },
  },
  {
    id: "refund",
    icon: "💸",
    title: {
      en: "Kamala Ji & Accidental Transfer",
      hi: "कमला जी और गलत ट्रांसफर",
      kn: "ಕಮಲಾ ಮತ್ತು ತಪ್ಪು ಹಣ ವರ್ಗಾವಣೆ",
    },
    subtitle: {
      en: "Emotional plea to refund money that never arrived",
      hi: "अस्पताल का झूठा रोना रोकर पैसे ऐंठना",
      kn: "ಆಸ್ಪತ್ರೆಯ ಸುಳ್ಳು ಕಥೆ ಹೇಳಿ ಹಣ ಮರಳಿಸುವಂತೆ ಕೇಳುವುದು",
    },
    character: "Kamala (65 yrs)",
    startNode: "refund_start",
    nodes: REFUND_NODES,
    endings: REFUND_ENDINGS,
    endingsByNode: {
      refund_lost: "refund_lost",
      refund_safe: "refund_safe",
    },
    goldenRule: {
      en: "Always verify your real bank statement inside your bank app before refunding anyone.",
      hi: "किसी को भी पैसे वापस करने से पहले हमेशा अपने बैंक ऐप में असली स्टेटमेंट देखें।",
      kn: "ಯಾರಿಗಾದರೂ ಹಣ ಮರಳಿಸುವ ಮುನ್ನ ಬ್ಯಾಂಕ್ ಆ್ಯಪ್‌ನಲ್ಲಿ ನಿಜವಾದ ಸ್ಟೇಟ್‌ಮೆಂಟ್ ಪರಿಶೀಲಿಸಿ.",
    },
  },
];
