import type { Translated } from "../types";

export type QuizArt = "otp" | "pin" | "threat" | "qr" | "amount" | "receive";

export interface QuizOption {
  id: string;
  label: Translated;
}

export interface QuizQuestion {
  id: string;
  art: QuizArt;
  scene: Translated;
  question: Translated;
  options: QuizOption[];
  correctId: string;
  explanation: Translated;
  action: Translated;
}

/** "Scam or Safe" - at least five everyday scenarios, all reviewed for correctness. */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "otp-request",
    art: "otp",
    scene: {
      en: "A message says: \u201cYour account will be blocked today. Share the OTP you just received to keep it active.\u201d",
      hi: "संदेश: \u201cआपका खाता आज ब्लॉक हो जाएगा। खाता सक्रिय रखने के लिए अभी आया OTP भेजें।\u201d",
      kn: "ಸಂದೇಶ: \u201cನಿಮ್ಮ ಖಾತೆ ಇಂದು ನಿರ್ಬಂಧಗೊಳ್ಳುತ್ತದೆ. ಸಕ್ರಿಯವಾಗಿರಲು ಈಗ ಬಂದ ಒಟಿಪಿ ಕಳುಹಿಸಿ.\u201d",
    },
    question: {
      en: "What should you do?",
      hi: "आपको क्या करना चाहिए?",
      kn: "ನೀವು ಏನು ಮಾಡಬೇಕು?",
    },
    options: [
      { id: "scam", label: { en: "It is a scam", hi: "यह ठगी है", kn: "ಇದು ವಂಚನೆ" } },
      { id: "safe", label: { en: "Send the OTP", hi: "OTP भेज दूँ", kn: "ಒಟಿಪಿ ಕಳುಹಿಸಿ" } },
    ],
    correctId: "scam",
    explanation: {
      en: "No bank ever asks for an OTP. The message also uses fear (\u201cblocked today\u201d) so you act without thinking.",
      hi: "कोई भी बैंक OTP कभी नहीं माँगता। संदेश डर भी दिखाता है (\u201cआज ब्लॉक\u201d) ताकि आप बिना सोचे काम करें।",
      kn: "ಯಾವ ಬ್ಯಾಂಕೂ ಒಟಿಪಿ ಕೇಳುವುದಿಲ್ಲ. ಸಂದೇಶ ಭಯವನ್ನೂ ತೋರಿಸುತ್ತದೆ (\u201cಇಂದು ನಿರ್ಬಂಧ\u201d) ನೀವು ಯೋಚಿಸದೆ ಕೆಲಸ ಮಾಡಲು.",
    },
    action: {
      en: "Do not reply. Call your bank on the number printed on your card.",
      hi: "जवाब न दें। अपने कार्ड पर छपे नंबर पर बैंक को कॉल करें।",
      kn: "ಉತ್ತರಿಸಬೇಡಿ. ನಿಮ್ಮ ಕಾರ್ಡ್‌ನಲ್ಲಿ ಮುದ್ರಿತ ನಂಬರ್‌ನಲ್ಲಿ ಬ್ಯಾಂಕಿಗೆ ಕರೆ ಮಾಡಿ.",
    },
  },
  {
    id: "pin-request",
    art: "pin",
    scene: {
      en: "A caller says: \u201cI am from your bank. Tell me your UPI PIN and I will fix the problem.\u201d",
      hi: "कॉल: \u201cमैं आपके बैंक से बोल रहा/रही हूँ। समस्या ठीक करने के लिए अपना UPI पिन बताइए।\u201d",
      kn: "ಕರೆ: \u201cನಾನು ನಿಮ್ಮ ಬ್ಯಾಂಕಿನಿಂದ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ಸಮಸ್ಯೆ ಸರಿಪಡಿಸಲು ನಿಮ್ಮ UPI ಪಿನ್ ಹೇಳಿ.\u201d",
    },
    question: {
      en: "Is it okay to share the PIN?",
      hi: "क्या पिन साझा करना ठीक है?",
      kn: "ಪಿನ್ ಹಂಚಿಕೊಳ್ಳುವುದು ಸರಿಯೇ?",
    },
    options: [
      { id: "share", label: { en: "Yes, they are the bank", hi: "हाँ, वे बैंक हैं", kn: "ಹೌದು, ಅವರು ಬ್ಯಾಂಕ್" } },
      { id: "refuse", label: { en: "No, never", hi: "नहीं, कभी नहीं", kn: "ಇಲ್ಲ, ಎಂದಿಗೂ ಇಲ್ಲ" } },
    ],
    correctId: "refuse",
    explanation: {
      en: "Your UPI PIN is only for you. No bank employee, shop or agent may ever ask for it.",
      hi: "आपका UPI पिन सिर्फ आपका है। कोई भी बैंक कर्मचारी, दुकान या एजेंट इसे नहीं माँग सकता।",
      kn: "ನಿಮ್ಮ UPI ಪಿನ್ ನಿಮ್ಮದು ಮಾತ್ರ. ಯಾವ ಬ್ಯಾಂಕ್ ಉದ್ಯೋಗಿ, ಅಂಗಡಿ ಅಥವಾ ಏಜೆಂಟ್ ಅದನ್ನು ಕೇಳುವಂತಿಲ್ಲ.",
    },
    action: {
      en: "Hang up. If you already said it, change your PIN in the bank app now.",
      hi: "फ़ोन रख दें। अगर बता दिया है तो अभी बैंक ऐप में पिन बदल दें।",
      kn: "ಫೋನ್ ಇಡಿ. ಈಗಾಗಲೇ ಹೇಳಿದ್ದರೆ, ಈಗಲೇ ಬ್ಯಾಂಕ್ ಆ್ಯಪ್‌ನಲ್ಲಿ ಪಿನ್ ಬದಲಾಯಿಸಿ.",
    },
  },
  {
    id: "urgent-threat",
    art: "threat",
    scene: {
      en: "An SMS says: \u201cPay ₹5,000 immediately or police action will be taken.\u201d",
      hi: "SMS: \u201cतुरंत ₹5,000 भेजें, नहीं तो पुलिस कार्रवाई होगी।\u201d",
      kn: "SMS: \u201cತಕ್ಷಣ ₹5,000 ಕಳುಹಿಸಿ, ಇಲ್ಲದಿದ್ದರೆ ಪೊಲೀಸ್ ಕ್ರಮ ಆಗುತ್ತದೆ.\u201d",
    },
    question: {
      en: "What is the safe response?",
      hi: "सुरक्षित प्रतिक्रिया क्या है?",
      kn: "ಸುರಕ್ಷಿತ ಪ್ರತಿಕ್ರಿಯೆ ಯಾವುದು?",
    },
    options: [
      { id: "pay", label: { en: "Pay quickly to be safe", hi: "सुरक्षा के लिए जल्दी भेजूँ", kn: "ಸುರಕ್ಷತೆಗೆ ಬೇಗ ಕೊಡಿ" } },
      { id: "stop", label: { en: "Stop and check first", hi: "रुकें, पहले जाँचें", kn: "ನಿಲ್ಲಿ, ಮೊದಲು ಪರಿಶೀಲಿ" } },
    ],
    correctId: "stop",
    explanation: {
      en: "Police and banks never demand money by SMS or call. Fear is used so you do not stop to think.",
      hi: "पुलिस और बैंक SMS या कॉल पर पैसे कभी नहीं माँगते। डर दिखाकर आपको सोचने नहीं दिया जाता।",
      kn: "ಪೊಲೀಸ್ ಮತ್ತು ಬ್ಯಾಂಕ್ SMS ಅಥವಾ ಕರೆಯಲ್ಲಿ ಹಣ ಎಂದಿಗೂ ಕೇಳುವುದಿಲ್ಲ. ಭಯ ತೋರಿಸಿ ನಿಮ್ಮನ್ನು ಯೋಚಿಸದಂತೆ ಮಾಡುತ್ತಾರೆ.",
    },
    action: {
      en: "Do not pay. Show the message to family and report it on helpline 1930.",
      hi: "भुगतान न करें। संदेश परिवार को दिखाएँ और 1930 पर शिकायत करें।",
      kn: "ಪಾವತಿ ಮಾಡಬೇಡಿ. ಸಂದೇಶವನ್ನು ಕುಟುಂಬಕ್ಕೆ ತೋರಿಸಿ ಮತ್ತು 1930 ಸಹಾಯವಾಣಿಗೆ ದೂರು ನೀಡಿ.",
    },
  },
  {
    id: "shop-qr",
    art: "qr",
    scene: {
      en: "At a shop you scan the QR. The payment screen shows the shop's name \u201cGreen Kiran Stores\u201d and ₹300 \u2014 the same as your bill. You meant to pay.",
      hi: "दुकान पर क्यूआर स्कैन किया। भुगतान स्क्रीन पर दुकान का नाम \u201cGreen Kiran Stores\u201d और ₹300 है \u2014 जितना बिल था। आप देना ही चाहते थे।",
      kn: "ಅಂಗಡಿಯಲ್ಲಿ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿದಿರಿ. ಪಾವತಿ ಪರದೆಯಲ್ಲಿ ಅಂಗಡಿಯ ಹೆಸರು \u201cGreen Kiran Stores\u201d ಮತ್ತು ₹300 ಇದೆ \u2014 ಬಿಲ್ಲಿನಷ್ಟೇ. ನೀವು ಕೊಡಲು ಬಯಸಿದ್ದಿರಿ.",
    },
    question: {
      en: "What should you do?",
      hi: "आपको क्या करना चाहिए?",
      kn: "ನೀವು ಏನು ಮಾಡಬೇಕು?",
    },
    options: [
      {
        id: "check",
        label: { en: "Check name and amount, then approve", hi: "नाम व राशि जाँचकर स्वीकारें", kn: "ಹೆಸರು ಮತ್ತು ಮೊತ್ತ ಪರಿಶೀಲಿಸಿ ಒಪ್ಪಿಸಿ" },
      },
      {
        id: "hurry",
        label: { en: "Enter the PIN without looking", hi: "देखे बिना पिन डाल दूँ", kn: "ನೋಡದೆ ಪಿನ್ ನಮೂದಿಸಿ" },
      },
    ],
    correctId: "check",
    explanation: {
      en: "The name and amount match what you expected \u2014 that is the right way to pay. Always look once before approving.",
      hi: "नाम और राशि आपकी उम्मीद से मेल खाती है \u2014 भुगतान का सही तरीका यही है। स्वीकार करने से पहले एक बार ज़रूर देखें।",
      kn: "ಹೆಸರು ಮತ್ತು ಮೊತ್ತ ನಿಮ್ಮ ನಿರೀಕ್ಷೆಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ \u2014 ಪಾವತಿಯ ಸರಿಯಾದ ವಿಧಾನ ಇದು. ಒಪ್ಪಿಸುವ ಮೊದಲು ಒಮ್ಮೆ ನೋಡಿ.",
    },
    action: {
      en: "Still never share your UPI PIN, and keep the payment receipt.",
      hi: "फिर भी अपना UPI पिन कभी न बताएँ, और भुगतान रसीद रखें।",
      kn: "ಆದರೂ ನಿಮ್ಮ UPI ಪಿನ್ ಎಂದಿಗೂ ಹೇಳಬೇಡಿ ಮತ್ತು ಪಾವತಿ ರಸೀದಿ ಇಟ್ಟುಕೊಳ್ಳಿ.",
    },
  },
  {
    id: "wrong-amount",
    art: "amount",
    scene: {
      en: "You agreed to pay ₹450. On the payment screen the amount shows ₹4,500.",
      hi: "आपने ₹450 देने की सहमति दी थी। भुगतान स्क्रीन पर राशि ₹4,500 दिख रही है।",
      kn: "ನೀವು ₹450 ಕೊಡಲು ಒಪ್ಪಿದ್ದಿರಿ. ಪಾವತಿ ಪರದೆಯಲ್ಲಿ ₹4,500 ಕಾಣಿಸುತ್ತಿದೆ.",
    },
    question: {
      en: "What do you do?",
      hi: "आप क्या करते हैं?",
      kn: "ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?",
    },
    options: [
      { id: "cancel", label: { en: "Cancel and ask again", hi: "रद्द करके दोबारा पूछें", kn: "ರದ್ದುಗೊಳಿಸಿ ಮತ್ತೆ ಕೇಳಿ" } },
      { id: "pay", label: { en: "Pay anyway, quickly", hi: "जल्दी जैसा है वैसे भेजूँ", kn: "ಬೇಗ ಹಾಗೇ ಕೊಡಿ" } },
    ],
    correctId: "cancel",
    explanation: {
      en: "Scammers quietly change the amount at the last moment. A wrong amount is a common sign of fraud.",
      hi: "ठग आखिरी पल में राशि बदल देते हैं। गलत राशि धोखे का आम संकेत है।",
      kn: "ವಂಚಕರು ಕೊನೆಯ ಕ್ಷಣದಲ್ಲಿ ಮೊತ್ತ ಬದಲಾಯಿಸುತ್ತಾರೆ. ತಪ್ಪು ಮೊತ್ತ ವಂಚನೆಯ ಸಾಮಾನ್ಯ ಸೂಚನೆ.",
    },
    action: {
      en: "Press Cancel, and confirm the correct amount with the shop.",
      hi: "रद्द दबाएँ और दुकान से सही राशि की पुष्टि करें।",
      kn: "ರದ್ದುಗೊಳಿಸಿ ಒತ್ತಿ ಮತ್ತು ಅಂಗಡಿಯೊಂದಿಗೆ ಸರಿಯಾದ ಮೊತ್ತ ದೃಢೀಕರಿಸಿ.",
    },
  },
  {
    id: "receive-prize",
    art: "receive",
    scene: {
      en: "A stranger messages: \u201cCongratulations! You have won ₹2,000. Scan this QR to receive your prize.\u201d",
      hi: "अज्ञात व्यक्ति: \u201cबधाई! आपने ₹2,000 जीते हैं। इनाम पाने के लिए यह क्यूआर स्कैन करें।\u201d",
      kn: "ಅಪರಿಚಿತ ವ್ಯಕ್ತಿ: \u201cಅಭಿನಂದನೆ! ನೀವು ₹2,000 ಗೆದ್ದಿದ್ದೀರಿ. ಬಹುಮಾನ ಪಡೆಯಲು ಈ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.\u201d",
    },
    question: {
      en: "Can scanning this QR bring you money?",
      hi: "क्या इस क्यूआर को स्कैन करने से पैसे मिलेंगे?",
      kn: "ಈ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿದರೆ ಹಣ ಬರುತ್ತದೆಯಾ?",
    },
    options: [
      { id: "yes", label: { en: "Yes, it is my prize", hi: "हाँ, यह मेरा इनाम है", kn: "ಹೌದು, ಇದು ನನ್ನ ಬಹುಮಾನ" } },
      { id: "no", label: { en: "No \u2014 it would take money", hi: "नहीं \u2014 यह पैसे लेगा", kn: "ಇಲ್ಲ \u2014 ಇದು ಹಣ ತೆಗೆಯುತ್ತದೆ" } },
    ],
    correctId: "no",
    explanation: {
      en: "Scanning a QR code always starts a payment FROM your account. Money never arrives by you scanning a code.",
      hi: "क्यूआर स्कैन करने से हमेशा आपके खाते से भुगतान शुरू होता है। स्कैन करने से पैसे कभी नहीं आते।",
      kn: "QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿದರೆ ಯಾವಾಗಲೂ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಪಾವತಿ ಆರಂಭವಾಗುತ್ತದೆ. ಸ್ಕ್ಯಾನ್ ಮಾಡಿದರೆ ಹಣ ಎಂದಿಗೂ ಬರುವುದಿಲ್ಲ.",
    },
    action: {
      en: "Do not scan. Delete the message, and never share a PIN or OTP to claim anything.",
      hi: "स्कैन न करें। संदेश हटा दें, और इनाम के नाम पर पिन या OTP कभी न बताएँ।",
      kn: "ಸ್ಕ್ಯಾನ್ ಮಾಡಬೇಡಿ. ಸಂದೇಶ ಅಳಿಸಿ ಮತ್ತು ಏನನ್ನೂ ಪಡೆಯಲು ಪಿನ್ ಅಥವಾ ಒಟಿಪಿ ಎಂದಿಗೂ ಹೇಳಬೇಡಿ.",
    },
  },
];
