import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Trophy,
  Volume2,
  XCircle,
} from "lucide-react";
import { BigButton } from "../components/Button";
import { Banner, Card, ProgressBar } from "../components/bits";
import { useApp, useNav } from "../state";

interface PracticeScenario {
  id: string;
  category: { en: string; hi: string; kn: string };
  icon: string;
  title: { en: string; hi: string; kn: string };
  story: { en: string; hi: string; kn: string };
  previewSnippet: string;
  options: {
    id: string;
    text: { en: string; hi: string; kn: string };
    correct: boolean;
    explanation: { en: string; hi: string; kn: string };
  }[];
}

const PRACTICE_SCENARIOS: PracticeScenario[] = [
  {
    id: "cashback_pin",
    category: { en: "Cashback Trap", hi: "कैशबैक जाल", kn: "ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್ ಮೋಸ" },
    icon: "🎁",
    title: {
      en: "₹5,000 Reward QR Code",
      hi: "₹5,000 इनाम का क्यूआर कोड",
      kn: "₹5,000 ಬಹುಮಾನದ QR ಕೋಡ್",
    },
    story: {
      en: "You get a message: 'Congratulations! You won ₹5,000 festive cashback. Scan this QR code and enter your UPI PIN immediately to credit money into your bank.'",
      hi: "आपको संदेश मिलता है: 'बधाई हो! आपने ₹5,000 का त्योहारी कैशबैक जीता है। तुरंत पैसे अपने खाते में पाने के लिए यह क्यूआर स्कैन करें और अपना UPI पिन डालें।'",
      kn: "ನಿಮಗೆ ಸಂದೇಶ ಬರುತ್ತದೆ: 'ಅಭಿನಂದನೆಗಳು! ನೀವು ₹5,000 ಹಬ್ಬದ ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್ ಗೆದ್ದಿದ್ದೀರಿ. ಹಣ ಪಡೆಯಲು ಈ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ UPI ಪಿನ್ ನಮೂದಿಸಿ.'",
    },
    previewSnippet: "upi://pay?pa=cashback-rewards@okaxis&pn=BonusReward&am=5000",
    options: [
      {
        id: "a",
        text: {
          en: "Ignore & delete — UPI PIN is only needed to SEND money, never to receive rewards.",
          hi: "अनदेखा कर डिलीट करें — UPI पिन केवल पैसे भेजने के लिए चाहिए, इनाम पाने के लिए कभी नहीं।",
          kn: "ನಿರ್ಲಕ್ಷಿಸಿ ಅಳಿಸಿ — UPI ಪಿನ್ ಹಣ ಕಳುಹಿಸಲು ಮಾತ್ರ ಬೇಕು, ಪಡೆಯಲು ಅಲ್ಲ.",
        },
        correct: true,
        explanation: {
          en: "Golden Rule: You NEVER enter your UPI PIN to receive money. Scanning a QR code always debits your account.",
          hi: "स्वर्ण नियम: पैसे प्राप्त करने के लिए कभी UPI पिन नहीं डाला जाता। क्यूआर कोड स्कैन करने पर हमेशा पैसे कटते हैं।",
          kn: "ಚಿನ್ನದ ನಿಯಮ: ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ UPI ಪಿನ್ ಹಾಕಬೇಡಿ. QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿದರೆ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಹಣ ಕಡಿತವಾಗುತ್ತದೆ.",
        },
      },
      {
        id: "b",
        text: {
          en: "Scan the QR code and enter UPI PIN right away.",
          hi: "तुरंत क्यूआर कोड स्कैन करके UPI पिन डाल दें।",
          kn: "ತಕ್ಷಣ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ UPI ಪಿನ್ ನಮೂದಿಸಿ.",
        },
        correct: false,
        explanation: {
          en: "Danger! Entering your PIN will instantly deduct ₹5,000 from YOUR bank account.",
          hi: "खतरा! पिन डालते ही आपके बैंक खाते से तुरंत ₹5,000 कट जाएँगे।",
          kn: "ಅಪಾಯ! ಪಿನ್ ಹಾಕಿದರೆ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ₹5,000 ಹಣ ಕಡಿತಗೊಳ್ಳುತ್ತದೆ.",
        },
      },
      {
        id: "c",
        text: {
          en: "Forward it to your children and friends.",
          hi: "इसे अपने बच्चों और दोस्तों को फॉरवर्ड करें।",
          kn: "ಇದನ್ನು ನಿಮ್ಮ ಮಕ್ಕಳು ಮತ್ತು ಸ್ನೇಹಿತರಿಗೆ ಫಾರ್ವರ್ಡ್ ಮಾಡಿ.",
        },
        correct: false,
        explanation: {
          en: "Never forward unverified scam messages — this spreads fraud to your loved ones.",
          hi: "अपुष्ट संदेश कभी आगे न भेजें — इससे आपके अपनों के साथ भी ठगी हो सकती है।",
          kn: "ಪರಿಶೀಲಿಸದ ವಂಚನೆ ಸಂದೇಶಗಳನ್ನು ಬೇರೆಯವರಿಗೆ ಕಳುಹಿಸಬೇಡಿ.",
        },
      },
    ],
  },
  {
    id: "fake_bank_kyc",
    category: { en: "Bank Impersonation", hi: "बैंक अधिकारी का कॉल", kn: "ಬ್ಯಾಂಕ್ ಅಧಿಕಾರಿ ಕರೆ" },
    icon: "📞",
    title: {
      en: "Urgent: 'Your Account is Being Blocked'",
      hi: "ज़रूरी: 'आपका बैंक खाता बंद हो रहा है'",
      kn: "ತುರ್ತು: 'ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆ ಬ್ಲಾಕ್ ಆಗುತ್ತಿದೆ'",
    },
    story: {
      en: "A caller speaking formally claims to be 'Mr. Sharma, Senior Manager at SBI'. He says your PAN/KYC expired and your ATM card is frozen unless you tell him the 6-digit OTP just sent to your phone.",
      hi: "एक व्यक्ति फोन करके खुद को 'एसबीआई का सीनियर मैनेजर शर्मा' बताता है। वह कहता है कि आपका पैन/केवाईसी समाप्त हो गया है और आपका कार्ड तुरंत ब्लॉक हो जाएगा अगर आपने फोन पर आया 6 अंकों का OTP नहीं बताया।",
      kn: "ಒಬ್ಬ ವ್ಯಕ್ತಿ ಕರೆ ಮಾಡಿ 'SBI ಮ್ಯಾನೇಜರ್ ಶರ್ಮಾ' ಎಂದು ಹೇಳಿಕೊಳ್ಳುತ್ತಾನೆ. ನಿಮ್ಮ KYC ಮುಗಿದಿದೆ, ತಕ್ಷಣ ಬಂದ 6 ಅಂಕಿಯ OTP ಹೇಳದಿದ್ದರೆ ಖಾತೆ ಬ್ಲಾಕ್ ಆಗುತ್ತದೆ ಎಂದು ಹೆದರಿಸುತ್ತಾನೆ.",
    },
    previewSnippet: "SMS: 'Your OTP for SBI Netbanking login is 482910. Do not share with anyone.'",
    options: [
      {
        id: "a",
        text: {
          en: "Cut the call immediately. Banks never ask for OTPs over phone.",
          hi: "कॉल तुरंत काट दें। बैंक कभी भी फोन पर OTP नहीं माँगते।",
          kn: "ತಕ್ಷಣ ಕರೆ ಕಟ್ ಮಾಡಿ. ಬ್ಯಾಂಕ್‌ಗಳು ಫೋನ್‌ನಲ್ಲಿ ಎಂದಿಗೂ OTP ಕೇಳುವುದಿಲ್ಲ.",
        },
        correct: true,
        explanation: {
          en: "Exact! The scammer triggered a login or transaction and needed your OTP to steal money. Calling your branch directly is always the right step.",
          hi: "बिल्कुल सही! धोखेबाज़ ने लॉगिन शुरू किया था और पैसे चुराने के लिए OTP माँग रहा था। सीधे अपनी शाखा से संपर्क करना ही सही है।",
          kn: "ಸರಿಯಾಗಿದೆ! ವಂಚಕ ಹಣ ಕದಿಯಲು OTP ಕೇಳುತ್ತಿದ್ದನು. ನೇರವಾಗಿ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಶಾಖೆಗೆ ಹೋಗಿ.",
        },
      },
      {
        id: "b",
        text: {
          en: "Share the OTP since the caller sounded polite and official.",
          hi: "OTP बता दें क्योंकि फोन करने वाला अधिकारी जैसा लग रहा था।",
          kn: "ಅಧಿಕಾರಿಯಂತೆ ಮಾತನಾಡಿದ್ದರಿಂದ OTP ಹಂಚಿಕೊಳ್ಳಿ.",
        },
        correct: false,
        explanation: {
          en: "Catastrophic! Scammers use polite language and false urgency. Sharing OTP gives them total control of your money.",
          hi: "बड़ी भूल! धोखेबाज़ मीठी आवाज़ में बात करके डर दिखाते हैं। OTP देते ही आपका पैसा लुट जाएगा।",
          kn: "ದೊಡ್ಡ ತಪ್ಪು! ವಂಚಕರು ಸಭ್ಯವಾಗಿ ಮಾತನಾಡುತ್ತಾರೆ. OTP ನೀಡಿದರೆ ನಿಮ್ಮ ಹಣ ಕಳೆದುಕೊಳ್ಳುತ್ತೀರಿ.",
        },
      },
    ],
  },
  {
    id: "electricity_power_cut",
    category: { en: "Utility Threat", hi: "बिजली बिल धमकी", kn: "ವಿದ್ಯುತ್ ಬಿಲ್ ಬೆದರಿಕೆ" },
    icon: "⚡",
    title: {
      en: "'Electricity Bill Unpaid - Disconnection Tonight'",
      hi: "'बिजली का बिल बकाया - आज रात कटेगा कनेक्शन'",
      kn: "'ವಿದ್ಯುತ್ ಬಿಲ್ ಬಾಕಿ - ಇಂದು ರಾತ್ರಿ ಸಂಪರ್ಕ ಕಡಿತ'",
    },
    story: {
      en: "An SMS arrives at 8 PM: 'Dear consumer, your electricity bill was not updated. Power will be disconnected at 9:30 PM. Download the official update app immediately: bill-update-bescom.apk'",
      hi: "रात 8 बजे संदेश आता है: 'उपभोक्ता ध्यान दें, आपका बिजली बिल अपडेट नहीं हुआ है। रात 9:30 बजे बिजली काट दी जाएगी। तुरंत अपडेट ऐप डाउनलोड करें: bill-update-bescom.apk'",
      kn: "ರಾತ್ರಿ 8 ಗಂಟೆಗೆ SMS ಬರುತ್ತದೆ: 'ನಿಮ್ಮ ವಿದ್ಯುತ್ ಬಿಲ್ ಅಪ್‌ಡೇಟ್ ಆಗಿಲ್ಲ. ರಾತ್ರಿ 9:30ಕ್ಕೆ ವಿದ್ಯುತ್ ಕಟ್ ಆಗುತ್ತದೆ. ಕೂಡಲೇ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ: bill-update-bescom.apk'",
    },
    previewSnippet: "SMS: 'Urgent! Download & install helper app from http://bijli-bill-support.top/app.apk'",
    options: [
      {
        id: "a",
        text: {
          en: "Do NOT download the file. Unknown .apk files are malicious spyware.",
          hi: "फ़ाइल बिल्कुल डाउनलोड न करें। अज्ञात .apk फ़ाइलें जासूसी वायरस होती हैं।",
          kn: "ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಡಿ. ಅಪರಿಚಿತ .apk ಫೈಲ್‌ಗಳು ವೈರಸ್ ಆಗಿರುತ್ತವೆ.",
        },
        correct: true,
        explanation: {
          en: "Perfect! Installing .apk apps from links grants scammers full remote access to read your SMS and bank OTPs.",
          hi: "शानदार! किसी लिंक से .apk ऐप इंस्टॉल करने पर धोखेबाज़ आपके फोन के SMS और OTP पढ़ सकते हैं।",
          kn: "ಸರಿಯಾಗಿದೆ! .apk ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿದರೆ ವಂಚಕರು ನಿಮ್ಮ ಬ್ಯಾಂಕ್ SMS ಮತ್ತು OTP ಓದಬಹುದು.",
        },
      },
      {
        id: "b",
        text: {
          en: "Install the app quickly to prevent electricity from being cut.",
          hi: "बिजली कटने के डर से तुरंत ऐप इंस्टॉल कर लें।",
          kn: "ಕರೆಂಟ್ ಕಟ್ ಆಗದಂತೆ ತಕ್ಷಣ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ.",
        },
        correct: false,
        explanation: {
          en: "Trap! Disconnection notices are never sent via random mobile numbers or .apk links at night.",
          hi: "धोखा! बिजली विभाग कभी रात को ऐसे निजी नंबरों से ऐप लिंक नहीं भेजता।",
          kn: "ಮೋಸ! ವಿದ್ಯುತ್ ಮಂಡಳಿ ಎಂದಿಗೂ ಇಂತಹ ಅಪರಿಚಿತ ಲಿಂಕ್ ಕಳುಹಿಸುವುದಿಲ್ಲ.",
        },
      },
    ],
  },
  {
    id: "olx_qr_receive",
    category: { en: "Marketplace / Buyer Scam", hi: "खरीदार का क्यूआर धोखा", kn: "ಖರೀದಿದಾರನ QR ಮೋಸ" },
    icon: "🛒",
    title: {
      en: "Online Buyer: 'Scan my QR to receive payment'",
      hi: "ऑनलाइन खरीदार: 'पैसे पाने के लिए मेरा क्यूआर स्कैन करें'",
      kn: "ಆನ್‌ಲೈನ್ ಖರೀದಿದಾರ: 'ಹಣ ಪಡೆಯಲು ನನ್ನ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ'",
    },
    story: {
      en: "You are selling old furniture online. A buyer messages: 'I am paying full advance ₹12,000. I am sending a QR code. Just scan it with PhonePe/GPay to get the ₹12,000 in your account.'",
      hi: "आप पुराना सामान बेच रहे हैं। खरीदार कहता है: 'मैं पूरा ₹12,000 एडवांस दे रहा हूँ। मैं एक क्यूआर भेज रहा हूँ। PhonePe/GPay से स्कैन करते ही ₹12,000 आपके खाते में आ जाएँगे।'",
      kn: "ನೀವು ಹಳೆಯ ವಸ್ತು ಮಾರುತ್ತಿದ್ದೀರಿ. ಖರೀದಿದಾರ: 'ನಾನು ₹12,000 ಮುಂಗಡ ನೀಡುತ್ತಿದ್ದೇನೆ. QR ಕಳುಹಿಸಿದ್ದೇನೆ, ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಹಣ ಪಡೆಯಿರಿ' ಎನ್ನುತ್ತಾನೆ.",
    },
    previewSnippet: "QR Code text: upi://pay?pa=buyer99@okicici&pn=AdvancePayment&am=12000",
    options: [
      {
        id: "a",
        text: {
          en: "Refuse. To receive money, you NEVER scan someone else's QR code.",
          hi: "मना करें। पैसे लेने के लिए कभी किसी और का क्यूआर स्कैन नहीं किया जाता।",
          kn: "ತಿರಸ್ಕರಿಸಿ. ಹಣ ಪಡೆಯಲು ಬೇರೆಯವರ QR ಸ್ಕ್ಯಾನ್ ಮಾಡುವ ಅಗತ್ಯವೇ ಇಲ್ಲ.",
        },
        correct: true,
        explanation: {
          en: "Brilliant! You only show YOUR QR code or give your phone number/VPA. Scanning ANY code initiates money transfer OUT.",
          hi: "बहुत खूब! आपको सिर्फ अपना फोन नंबर या क्यूआर दिखाना होता है। दूसरे का क्यूआर स्कैन करने पर आपके खाते से पैसे कटते हैं।",
          kn: "ಅತ್ಯುತ್ತಮ! ಹಣ ಪಡೆಯಲು ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಸಾಕು. ಬೇರೆಯವರ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿದರೆ ನಿಮ್ಮ ಹಣ ಹೋಗುತ್ತದೆ.",
        },
      },
      {
        id: "b",
        text: {
          en: "Scan it, because he said it is for receiving an advance.",
          hi: "स्कैन कर लें क्योंकि उसने कहा कि यह एडवांस लेने के लिए है।",
          kn: "ಅಡ್ವಾನ್ಸ್ ಪಡೆಯಲು ಹೇಳಿದ್ದರಿಂದ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.",
        },
        correct: false,
        explanation: {
          en: "Huge loss! You would end up sending ₹12,000 to the fraudster instead of receiving it.",
          hi: "भारी नुकसान! पैसे मिलने की बजाय आपके खाते से ₹12,000 धोखेबाज़ के पास चले जाएँगे।",
          kn: "ಭಾರಿ ನಷ್ಟ! ಹಣ ಬರುವುದರ ಬದಲಿಗೆ ನಿಮ್ಮ ₹12,000 ವಂಚಕನಿಗೆ ತಲುಪುತ್ತದೆ.",
        },
      },
    ],
  },
];

export function PracticeScreen() {
  const { uiLang, speakIfOn, stopSpeaking } = useApp();
  const { go } = useNav();

  const [index, setIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const scenario = PRACTICE_SCENARIOS[index];
  const total = PRACTICE_SCENARIOS.length;
  const isAnswered = selectedOpt !== null;
  const chosen = scenario.options.find((o) => o.id === selectedOpt);

  const handleSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOpt(optionId);
    const opt = scenario.options.find((o) => o.id === optionId);
    if (opt?.correct) {
      setScore((s) => s + 1);
      speakIfOn(opt.explanation[uiLang]);
    } else if (opt) {
      speakIfOn(opt.explanation[uiLang]);
    }
  };

  const handleNext = () => {
    stopSpeaking();
    if (index + 1 >= total) {
      setCompleted(true);
      return;
    }
    setIndex(index + 1);
    setSelectedOpt(null);
  };

  const handleRestart = () => {
    stopSpeaking();
    setIndex(0);
    setSelectedOpt(null);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    const isPerfect = score === total;
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <BigButton
            variant="outline"
            onClick={() => go({ screen: "learn" })}
            icon={<ArrowLeft className="h-5 w-5" />}
          >
            {uiLang === "hi" ? "सीखने पर वापस" : uiLang === "kn" ? "ಕಲಿಕೆಗೆ ಹಿಂತಿರುಗಿ" : "Back to Learn"}
          </BigButton>
        </div>

        <Card className="flex flex-col items-center p-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 shadow-soft">
            <Trophy className="h-10 w-10" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-navy">
            {uiLang === "hi" ? "शाबाश! अभ्यास पूरा हुआ" : uiLang === "kn" ? "ಅಭಿನಂದನೆಗಳು! ಅಭ್ಯಾಸ ಪೂರ್ಣಗೊಂಡಿದೆ" : "Practice Completed!"}
          </h1>
          <p className="mt-2 text-xl font-bold text-teal-dark">
            {uiLang === "hi"
              ? `आपने ${total} में से ${score} सही निर्णय लिए।`
              : uiLang === "kn"
                ? `ನೀವು ${total}ರಲ್ಲಿ ${score} ಸರಿಯಾದ ನಿರ್ಧಾರ ಮಾಡಿದ್ದೀರಿ.`
                : `You made ${score} of ${total} safe decisions.`}
          </p>
          <p className="mt-2 text-base text-navy/80 max-w-md">
            {isPerfect
              ? (uiLang === "hi"
                  ? "अद्भुत! आप डिजिटल ठगों के झांसे में कभी नहीं आएंगे। ऐसे ही सतर्क रहें!"
                  : uiLang === "kn"
                    ? "ಅದ್ಭುತ! ನೀವು ಡಿಜಿಟಲ್ ವಂಚಕರ ಬಲೆಗೆ ಬೀಳುವುದಿಲ್ಲ. ಸದಾ ಜಾಗರೂಕರಾಗಿರಿ!"
                    : "Outstanding! You spotted every single trap. Keep this caution with real transactions!")
              : (uiLang === "hi"
                  ? "अच्छा प्रयास! हमेशा याद रखें: पैसे लेने के लिए कभी पिन नहीं लगता।"
                  : uiLang === "kn"
                    ? "ಉತ್ತಮ ಪ್ರಯತ್ನ! ಸದಾ ನೆನಪಿಡಿ: ಹಣ ಪಡೆಯಲು ಪಿನ್ ಅಗತ್ಯವಿಲ್ಲ."
                    : "Good effort! Always remember: Scanning QR and entering PIN only sends money.")}
          </p>

          <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
            <BigButton
              full
              variant="teal"
              onClick={handleRestart}
              icon={<RotateCcw className="h-5 w-5" />}
            >
              {uiLang === "hi" ? "फिर से अभ्यास करें" : uiLang === "kn" ? "ಮತ್ತೆ ಅಭ್ಯಾಸ ಮಾಡಿ" : "Practice Again"}
            </BigButton>
            <BigButton
              full
              variant="navy"
              onClick={() => go({ screen: "roleplay" })}
            >
              {uiLang === "hi" ? "🎭 AI स्कैम रोलप्ले खेलें" : uiLang === "kn" ? "🎭 AI ಸ್ಕ್ಯಾಮ್ ರೋಲ್‌ಪ್ಲೇ ಆಡಿ" : "🎭 Play AI Scam Roleplay"}
            </BigButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <BigButton
          variant="outline"
          onClick={() => go({ screen: "learn" })}
          icon={<ArrowLeft className="h-5 w-5" />}
        >
          {uiLang === "hi" ? "वापस" : uiLang === "kn" ? "ಹಿಂತಿರುಗಿ" : "Back"}
        </BigButton>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          {uiLang === "hi" ? "शून्य पैसा • सुरक्षित सिमुलेशन" : uiLang === "kn" ? "ಶೂನ್ಯ ಹಣ • ಸುರಕ್ಷಿತ ಅಭ್ಯಾಸ" : "Zero Money • Safe Sandbox"}
        </span>
      </div>

      {/* Header and Progress */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
            {uiLang === "hi" ? "अभ्यास — सुरक्षित प्रैक्टिस" : uiLang === "kn" ? "ಅಭ್ಯಾಸ — ಸುರಕ್ಷಿತ ಅಭ್ಯಾಸ" : "Abhyas — Practice Mode"}
          </h1>
          <span className="text-base font-extrabold text-navy/70">
            {index + 1} / {total}
          </span>
        </div>
        <ProgressBar value={(index + (isAnswered ? 1 : 0)) / total} label={`Scenario ${index + 1}`} />
      </header>

      {/* Active Scenario Card */}
      <Card className="space-y-4 border-2 border-navy/10">
        <div className="flex items-center justify-between border-b border-navy/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl" role="img" aria-label="scenario icon">
              {scenario.icon}
            </span>
            <div>
              <span className="rounded-md bg-navy/5 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-navy/70">
                {scenario.category[uiLang]}
              </span>
              <h2 className="text-xl font-extrabold text-navy">{scenario.title[uiLang]}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => speakIfOn(`${scenario.title[uiLang]}. ${scenario.story[uiLang]}`)}
            className="rounded-full p-2 text-navy/60 hover:bg-navy/5 hover:text-navy"
            title="Listen aloud"
          >
            <Volume2 className="h-6 w-6" />
          </button>
        </div>

        <p className="text-lg leading-relaxed text-navy/90">{scenario.story[uiLang]}</p>

        {/* Realistic snippet box */}
        <div className="rounded-2xl border border-navy/15 bg-sand/40 p-3 font-mono text-sm text-navy/85 break-all shadow-inner">
          <span className="block text-xs font-bold uppercase tracking-wider text-navy/60 mb-1">
            {uiLang === "hi" ? "सामने आया संदेश / विवरण:" : uiLang === "kn" ? "ಬಂದ ಸಂದೇಶ / ವಿವರ:" : "Received details:"}
          </span>
          {scenario.previewSnippet}
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-extrabold text-navy">
            {uiLang === "hi" ? "आप क्या करेंगे?" : uiLang === "kn" ? "ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?" : "What should you do?"}
          </h3>

          <div className="grid gap-3">
            {scenario.options.map((option) => {
              const isSelected = selectedOpt === option.id;
              let btnClass = "border-2 border-navy/15 bg-white hover:border-navy/40 text-navy";
              let iconElement = null;

              if (isAnswered) {
                if (option.correct) {
                  btnClass = "border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold";
                  iconElement = <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />;
                } else if (isSelected) {
                  btnClass = "border-2 border-coral-dark bg-coral/10 text-coral-dark font-bold";
                  iconElement = <XCircle className="h-6 w-6 text-coral-dark shrink-0" />;
                } else {
                  btnClass = "border border-navy/10 bg-paper opacity-60 text-navy/60";
                }
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelect(option.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-all ${btnClass}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy/10 text-sm font-extrabold text-navy">
                    {option.id.toUpperCase()}
                  </span>
                  <span className="flex-1 text-base sm:text-lg leading-snug">
                    {option.text[uiLang]}
                  </span>
                  {iconElement}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation & Feedback */}
        {isAnswered && chosen && (
          <div className="mt-4 space-y-3 pt-2 border-t border-navy/10 animate-fade-in">
            <Banner
              tone={chosen.correct ? "success" : "danger"}
              icon={chosen.correct ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
              title={chosen.correct
                ? (uiLang === "hi" ? "बिल्कुल सही निर्णय!" : uiLang === "kn" ? "ಸರಿಯಾದ ನಿರ್ಧಾರ!" : "Safe Decision!")
                : (uiLang === "hi" ? "सावधान — यह एक जाल है!" : uiLang === "kn" ? "ಎಚ್ಚರಿಕೆ — ಇದು ಮೋಸದ ಬಲೆ!" : "Warning — Scam Trap!")}
            >
              <p className="text-base sm:text-lg">{chosen.explanation[uiLang]}</p>
            </Banner>

            <div className="pt-2">
              <BigButton
                full
                variant="teal"
                onClick={handleNext}
              >
                {index + 1 < total
                  ? (uiLang === "hi" ? "अगली स्थिति देखें →" : uiLang === "kn" ? "ಮುಂದಿನ ಸನ್ನಿವೇಶ →" : "Next Scenario →")
                  : (uiLang === "hi" ? "परिणाम देखें 🏆" : uiLang === "kn" ? "ಫಲಿತಾಂಶ ನೋಡಿ 🏆" : "View Results 🏆")}
              </BigButton>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
