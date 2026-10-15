import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lock,
  Search,
  ShieldAlert,
  Sparkles,
  Volume2,
} from "lucide-react";
import { api, ApiError } from "../api";
import { BigButton } from "../components/Button";
import { Banner, Card } from "../components/bits";
import { useApp, useNav } from "../state";
import { playTtsBase64 } from "../lib/speech";
import { tr } from "../lib/localize";

interface JargonItem {
  term: string;
  badge: "secret" | "safe" | "warning";
  title: Record<string, string>;
  simpleMeaning: Record<string, string>;
  analogy: Record<string, string>;
  rule: Record<string, string>;
}

const PRESET_JARGON: JargonItem[] = [
  {
    term: "UPI PIN",
    badge: "secret",
    title: { en: "UPI PIN", hi: "UPI पिन", kn: "UPI ಪಿನ್" },
    simpleMeaning: {
      en: "A secret 4 or 6-digit password known only to you that approves money leaving your bank.",
      hi: "4 या 6 अंकों का आपका गोपनीय पासवर्ड जो केवल आपके खाते से पैसे भेजने की अनुमति देता है।",
      kn: "ನಿಮ್ಮ ಬ್ಯಾಂಕ್‌ನಿಂದ ಹಣ ಕಳುಹಿಸಲು ಅನುಮೋದಿಸುವ 4 ಅಥವಾ 6 ಅಂಕಿಯ ರಹಸ್ಯ ಪಾಸ್‌ವರ್ಡ್.",
    },
    analogy: {
      en: "Think of your UPI PIN like the physical key to your home Godrej locker. Would you ever hand your key to a stranger on the road?",
      hi: "जैसे आपकी तिजोरी की चाबी सिर्फ आपके पास रहती है और आप उसे किसी अजनबी को नहीं देते, वैसे ही UPI पिन किसी को न दें।",
      kn: "ನಿಮ್ಮ ಮನೆಯ ಬೀರುವಿನ ಕೀಲಿ ಕೈಯಂತೆ. ಯಾರಾದರೂ ಅಪರಿಚಿತರಿಗೆ ಕೀಲಿ ನೀಡುತ್ತೀರಾ? ಇಲ್ಲವಲ್ಲ!",
    },
    rule: {
      en: "NEVER enter PIN to receive money. PIN is entered ONLY when you are transferring money OUT.",
      hi: "पैसे पाने के लिए कभी पिन न डालें। पिन केवल पैसे भेजने के लिए ही डाला जाता है।",
      kn: "ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ ಪಿನ್ ಹಾಕಬೇಡಿ. ಹಣ ಕಳುಹಿಸುವಾಗ ಮಾತ್ರ ಪಿನ್ ಬೇಕು.",
    },
  },
  {
    term: "OTP",
    badge: "secret",
    title: { en: "OTP (One-Time Password)", hi: "OTP (वन-टाइम पासवर्ड)", kn: "OTP (ಒನ್-ಟೈಮ್ ಪಾಸ್‌ವರ್ಡ್)" },
    simpleMeaning: {
      en: "A 6-digit verification code sent by SMS that expires in a few minutes.",
      hi: "एसएमएस द्वारा भेजा गया 6 अंकों का कोड जो कुछ ही मिनटों में समाप्त हो जाता है।",
      kn: "SMS ಮೂಲಕ ಬರುವ ಕೆಲವೇ ನಿಮಿಷಗಳಲ್ಲಿ ಮುಕ್ತಾಯವಾಗುವ 6 ಅಂಕಿಯ ಕೋಡ್.",
    },
    analogy: {
      en: "An OTP is like a single-use digital door entry ticket. Whoever has this ticket can open your bank account.",
      hi: "OTP आपके बैंक के दरवाज़े का एक बार उपयोग होने वाला टोकन है। जिसके पास टोकन होगा, वह अंदर घुस सकता है।",
      kn: "OTP ನಿಮ್ಮ ಖಾತೆಯ ಪ್ರವೇಶ ಪತ್ರದಂತೆ. ಇದನ್ನು ಪಡೆದವರು ಖಾತೆಗೆ ಲಗ್ಗೆಯಿಡಬಹುದು.",
    },
    rule: {
      en: "Banks, customer care, and police will NEVER ask you for your OTP over phone.",
      hi: "बैंक, कस्टमर केयर या पुलिस कभी भी फोन पर आपसे OTP नहीं माँगते।",
      kn: "ಬ್ಯಾಂಕ್, ಪೊಲೀಸ್ ಅಥವಾ ಯಾರೇ ಆದರೂ ಫೋನ್‌ನಲ್ಲಿ OTP ಕೇಳುವುದಿಲ್ಲ.",
    },
  },
  {
    term: "VPA / UPI ID",
    badge: "safe",
    title: { en: "VPA / UPI ID", hi: "VPA / UPI आईडी", kn: "VPA / UPI ಐಡಿ" },
    simpleMeaning: {
      en: "Your public digital payment handle (e.g. yourname@oksbi or 9876543210@paytm).",
      hi: "आपका सार्वजनिक डिजिटल पता (जैसे yourname@oksbi या 9876543210@paytm)।",
      kn: "ನಿಮ್ಮ ಸಾರ್ವಜನಿಕ ಡಿಜಿಟಲ್ ಪಾವತಿ ವಿಳಾಸ (ಉದಾ. name@oksbi).",
    },
    analogy: {
      en: "It is like your home's postal nameplate. Safe to share with anyone who wants to send you a post or courier.",
      hi: "यह आपके घर के पते की तरह है। किसी से भी पैसे मंगाने के लिए इसे बताना पूरी तरह सुरक्षित है।",
      kn: "ಇದು ನಿಮ್ಮ ಮನೆಯ ಅಂಚೆ ವಿಳಾಸದಂತೆ. ಯಾರಿಂದಲಾದರೂ ಹಣ ಪಡೆಯಲು ಇದನ್ನು ಹಂಚಿಕೊಳ್ಳಬಹುದು.",
    },
    rule: {
      en: "Safe to share for receiving money. Knowing your VPA alone cannot steal money from your account.",
      hi: "पैसे प्राप्त करने के लिए इसे साझा करना सुरक्षित है। केवल VPA से कोई पैसे नहीं निकाल सकता।",
      kn: "ಹಣ ಸ್ವೀಕರಿಸಲು ಇದು ಸುರಕ್ಷಿತ. ಕೇವಲ VPA ಯಿಂದ ಯಾರೂ ಹಣ ಕದಿಯಲಾರರು.",
    },
  },
  {
    term: "Collect Request",
    badge: "warning",
    title: { en: "Collect Request", hi: "कलेक्ट रिक्वेस्ट", kn: "ಕಲೆಕ್ಟ್ ರಿಕ್ವೆಸ್ಟ್" },
    simpleMeaning: {
      en: "A notification in Google Pay/PhonePe where someone asks YOU to pay THEM money.",
      hi: "पेमेंट ऐप में आया संदेश जिसमें कोई दूसरा व्यक्ति आपसे पैसे माँग रहा होता है।",
      kn: "ನಿಮ್ಮ ಪಾವತಿ ಆ್ಯಪ್‌ನಲ್ಲಿ ಬೇರೆಯವರು ನಿಮ್ಮಿಂದ ಹಣ ಕೇಳುವ ವಿನಂತಿ.",
    },
    analogy: {
      en: "It is an invoice or a bill handed to you. Approving it pays money OUT of your pocket.",
      hi: "यह एक बिल की तरह है। इसे स्वीकार करते ही आपके हाथ से पैसे चले जाएँगे।",
      kn: "ಇದು ನಿಮಗೆ ನೀಡಿದ ಬಿಲ್‌ನಂತೆ. ಒಪ್ಪಿಗೆ ನೀಡಿದರೆ ನಿಮ್ಮ ಹಣ ಹೊರಹೋಗುತ್ತದೆ.",
    },
    rule: {
      en: "Fraudsters send collect requests pretending you are 'receiving cashback'. Decline unknown collect requests immediately.",
      hi: "धोखेबाज़ 'कैशबैक मिलने' का झांसा देकर कलेक्ट रिक्वेस्ट भेजते हैं। अनजान रिक्वेस्ट को तुरंत अस्वीकार (Decline) करें।",
      kn: "ವಂಚಕರು ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್ ನೆಪದಲ್ಲಿ ಕಲೆಕ್ಟ್ ರಿಕ್ವೆಸ್ಟ್ ಕಳುಹಿಸುತ್ತಾರೆ. ಕೂಡಲೇ ತಿರಸ್ಕರಿಸಿ (Decline).",
    },
  },
  {
    term: "Digital Arrest",
    badge: "warning",
    title: { en: "Digital Arrest (100% Scam)", hi: "डिजिटल अरेस्ट (पूर्णतः ठगी)", kn: "ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ (100% ಸುಳ್ಳು)" },
    simpleMeaning: {
      en: "Scammers pretend to be CBI, Police, or Customs officers on video calls wearing fake uniforms to threaten you.",
      hi: "धोखेबाज़ वीडियो कॉल पर नकली पुलिस या सीबीआई की वर्दी पहनकर आपको डराते हैं।",
      kn: "ವಂಚಕರು ನಕಲಿ ಪೊಲೀಸ್ ಸಮವಸ್ತ್ರ ಧರಿಸಿ ವಿಡಿಯೋ ಕಾಲ್‌ನಲ್ಲಿ ಹೆದರಿಸುವ ಸುಳ್ಳು ನಾಟಕ.",
    },
    analogy: {
      en: "Indian Law does NOT have any concept called 'Digital Arrest'. Real police never interrogate citizens on Skype or WhatsApp.",
      hi: "भारतीय कानून में 'डिजिटल अरेस्ट' नाम की कोई चीज़ नहीं है। असली पुलिस कभी व्हाट्सएप या स्काइप पर पूछताछ नहीं करती।",
      kn: "ಭಾರತೀಯ ಕಾನೂನಿನಲ್ಲಿ 'ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್' ಎಂಬುದೇ ಇಲ್ಲ. ನೈಜ ಪೊಲೀಸರು ವಾಟ್ಸಾಪ್ ವಿಡಿಯೋ ಕಾಲ್ ಮಾಡುವುದಿಲ್ಲ.",
    },
    rule: {
      en: "Disconnect immediately! Do not transfer any 'security deposit' or penalty money.",
      hi: "तुरंत वीडियो कॉल काट दें! किसी भी 'जमानत' या 'सुरक्षा निधि' के नाम पर पैसे न भेजें।",
      kn: "ಕೂಡಲೇ ಕರೆ ಕಟ್ ಮಾಡಿ! ಯಾವುದೇ ಹಣವನ್ನು ಎಂದಿಗೂ ವರ್ಗಾಯಿಸಬೇಡಿ.",
    },
  },
  {
    term: "APK File",
    badge: "warning",
    title: { en: "APK File (.apk)", hi: "APK फ़ाइल (.apk)", kn: "APK ಫೈಲ್ (.apk)" },
    simpleMeaning: {
      en: "An Android application installation package downloaded outside the official Google Play Store.",
      hi: "गूगल प्ले स्टोर के बाहर किसी लिंक से डाउनलोड की जाने वाली ऐप फ़ाइल।",
      kn: "ಗೂಗಲ್ ಪ್ಲೇ ಸ್ಟೋರ್ ಹೊರತಾಗಿ ಲಿಂಕ್ ಮೂಲಕ ಬರುವ ಆ್ಯಪ್ ಫೈಲ್.",
    },
    analogy: {
      en: "Like opening your door to an unknown stranger wearing a mask. Once inside, they can read your private letters and copy keys.",
      hi: "जैसे किसी अनजान नकाबपोश को घर की चाबियाँ सौंप देना। फोन में आते ही यह सारे SMS और पासवर्ड चुरा लेता है।",
      kn: "ಅಪರಿಚಿತರಿಗೆ ನಿಮ್ಮ ಮನೆಯ ಎಲ್ಲ ಬೀಗದ ಕೀಲಿಗಳನ್ನು ಕೊಟ್ಟಂತೆ. ಇದು ನಿಮ್ಮ OTP ಕದಿಯುತ್ತದೆ.",
    },
    rule: {
      en: "Never install apps from WhatsApp or SMS links. Only install verified apps from Google Play Store.",
      hi: "व्हाट्सएप या मैसेज में आए लिंक से कभी ऐप डाउनलोड न करें। केवल गूगल प्ले स्टोर का उपयोग करें।",
      kn: "ವಾಟ್ಸಾಪ್ ಲಿಂಕ್‌ಗಳಿಂದ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಬೇಡಿ. ಪ್ಲೇ ಸ್ಟೋರ್ ಮಾತ್ರ ಬಳಸಿ.",
    },
  },
];

export function JargonScreen() {
  const { uiLang, lang, speakIfOn, stopSpeaking } = useApp();
  const { go } = useNav();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeItem, setActiveItem] = useState<JargonItem | null>(PRESET_JARGON[0]);
  const [aiCustomResult, setAiCustomResult] = useState<{
    term: string;
    meaning: string;
    analogy: string;
    keepSecret: boolean;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleSelectPreset = (item: JargonItem) => {
    stopSpeaking();
    setActiveItem(item);
    setAiCustomResult(null);
    setAiError("");
    speakIfOn(`${item.title[uiLang]}. ${item.simpleMeaning[uiLang]}. ${item.analogy[uiLang]}`);
  };

  const handleAskAI = async (termToAsk?: string) => {
    const query = (termToAsk || searchQuery).trim();
    if (!query) return;

    stopSpeaking();
    setAiLoading(true);
    setAiError("");
    setActiveItem(null);

    try {
      const resp = await api.translateJargon(query, lang);
      setAiCustomResult({
        term: resp.term,
        meaning: resp.plain_english,
        analogy: resp.elder_analogy,
        keepSecret: resp.keep_secret,
      });

      if (resp.audio_base64) {
        await playTtsBase64(resp.audio_base64);
      } else {
        speakIfOn(`${resp.term}: ${resp.plain_english}. ${resp.elder_analogy}`);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not fetch AI explanation.";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <BigButton
          variant="outline"
          onClick={() => {
            stopSpeaking();
            go({ screen: "learn" });
          }}
          icon={<ArrowLeft className="h-5 w-5" />}
        >
          {uiLang === "hi" ? "सीखने पर वापस" : uiLang === "kn" ? "ಕಲಿಕೆಗೆ ಹಿಂತಿರುಗಿ" : "Back to Learn"}
        </BigButton>
        <span className="flex items-center gap-1.5 rounded-full border border-coral/30 bg-coral/10 px-3 py-1 text-sm font-extrabold text-coral-dark">
          <BookOpen className="h-4 w-4 text-coral-dark" />
          {uiLang === "hi" ? "कठिन शब्दों का सरल अर्थ" : uiLang === "kn" ? "ಕಠಿಣ ಪದಗಳ ಸರಳ ಕೋಶ" : "Jargon Buster"}
        </span>
      </div>

      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
          {uiLang === "hi" ? "📖 बैंकिंग शब्दों का सरल अर्थ" : uiLang === "kn" ? "📖 ಬ್ಯಾಂಕಿಂಗ್ ಪದಗಳ ಸರಳ ವಿವರಣೆ" : "📖 Payment Jargon Buster"}
        </h1>
        <p className="mt-1 text-base text-navy/80">
          {uiLang === "hi"
            ? "कठिन तकनीकी शब्दों को आसान भाषा और घरेलू उदाहरणों से समझें।"
            : uiLang === "kn"
              ? "ಗೊಂದಲಮಯ ತಾಂತ್ರಿಕ ಪದಗಳನ್ನು ಸರಳ ದೈನಂದಿನ ಉದಾಹರಣೆಗಳಿಂದ ಸುಲಭವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ."
              : "Plain-language, elder-friendly explanations for confusing payment and cyber terms."}
        </p>
      </header>

      {/* Search Input for AI Explanation */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-navy/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAskAI();
            }}
            placeholder={uiLang === "hi" ? "किसी भी शब्द का अर्थ पूछें (उदा. CVV, Chargeback)..." : uiLang === "kn" ? "ಯಾವುದೇ ಪದದ ಅರ್ಥ ಕೇಳಿ (ಉದಾ. CVV)..." : "Ask meaning of any term (e.g. CVV, Chargeback)..."}
            className="w-full rounded-2xl border-2 border-navy/20 bg-white py-3 pl-11 pr-4 text-base text-navy shadow-inner focus:border-teal focus:outline-none"
          />
        </div>
        <button
          type="button"
          disabled={aiLoading || !searchQuery.trim()}
          onClick={() => handleAskAI()}
          className="flex items-center gap-1.5 rounded-2xl bg-teal px-4 py-3 font-extrabold text-white shadow-soft hover:bg-teal-dark disabled:opacity-40 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>{uiLang === "hi" ? "AI से पूछें" : uiLang === "kn" ? "AI ವಿವರಣೆ" : "AI Explain"}</span>
        </button>
      </div>

      {/* Preset Term Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-navy/60">
          {uiLang === "hi" ? "मुख्य बैंकिंग शब्द (टैप करें):" : uiLang === "kn" ? "ಪ್ರಮುಖ ಬ್ಯಾಂಕಿಂಗ್ ಪದಗಳು:" : "Common terms (tap to view):"}
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_JARGON.map((item) => {
            const isSelected = activeItem?.term === item.term && !aiCustomResult;
            return (
              <button
                key={item.term}
                type="button"
                onClick={() => handleSelectPreset(item)}
                className={`rounded-full px-4 py-2 text-sm font-extrabold transition-all ${
                  isSelected
                    ? "bg-navy text-white shadow-md scale-105"
                    : "border-2 border-navy/15 bg-white text-navy hover:border-coral"
                }`}
              >
                {item.title[uiLang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Loading indicator */}
      {aiLoading && (
        <Card className="flex items-center justify-center p-8 text-center">
          <div className="space-y-2">
            <span className="inline-block animate-spin text-3xl">✨</span>
            <p className="font-extrabold text-navy text-lg">
              {uiLang === "hi" ? "सारथी AI सरल अर्थ तैयार कर रहा है..." : uiLang === "kn" ? "AI ವಿವರಣೆ ಸಿದ್ಧಪಡಿಸುತ್ತಿದೆ..." : "Generating elder-friendly explanation..."}
            </p>
          </div>
        </Card>
      )}

      {/* AI Error message */}
      {aiError && (
        <Banner tone="danger" icon={<ShieldAlert className="h-6 w-6" />} title="Error">
          {aiError}
        </Banner>
      )}

      {/* AI Dynamic Explanation Card */}
      {aiCustomResult && !aiLoading && (
        <Card className="space-y-4 border-2 border-teal/40 bg-teal/5 p-5">
          <div className="flex items-start justify-between border-b border-navy/10 pb-3">
            <div>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
                aiCustomResult.keepSecret
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
              }`}>
                {aiCustomResult.keepSecret ? "🔒 KEEP SECRET — Never share" : "📢 SAFE TO SHARE"}
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-navy">{aiCustomResult.term}</h2>
            </div>
            <button
              type="button"
              onClick={() => speakIfOn(`${aiCustomResult.term}: ${aiCustomResult.meaning}. ${aiCustomResult.analogy}`)}
              className="rounded-full p-2 text-navy/60 hover:bg-navy/10"
              title="Listen"
            >
              <Volume2 className="h-6 w-6" />
            </button>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy/60">
              {uiLang === "hi" ? "सरल अर्थ:" : uiLang === "kn" ? "ಸರಳ ಅರ್ಥ:" : "Simple meaning:"}
            </h3>
            <p className="mt-1 text-lg leading-relaxed text-navy font-semibold">{aiCustomResult.meaning}</p>
          </div>

          <div className="rounded-2xl border border-sand bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <span>💡</span>
              <span>{uiLang === "hi" ? "घरेलू उदाहरण (समझने के लिए):" : uiLang === "kn" ? "ದೈನಂದಿನ ಉದಾಹರಣೆ:" : "Real-world analogy:"}</span>
            </h3>
            <p className="mt-1.5 text-base text-navy/90 leading-relaxed italic">"{aiCustomResult.analogy}"</p>
          </div>
        </Card>
      )}

      {/* Active Preset Jargon Card */}
      {activeItem && !aiCustomResult && (
        <Card className="space-y-4 border-2 border-navy/10 p-5">
          <div className="flex items-start justify-between border-b border-navy/10 pb-3">
            <div>
              {activeItem.badge === "secret" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-extrabold text-red-800 border border-red-300">
                  <Lock className="h-3.5 w-3.5" />
                  {uiLang === "hi" ? "🔒 गोपनीय रखें — कभी किसी को न बताएं" : uiLang === "kn" ? "🔒 ರಹಸ್ಯವಾಗಿಡಿ — ಯಾರಿಗೂ ಹೇಳಬೇಡಿ" : "🔒 KEEP SECRET — Never share with anyone"}
                </span>
              ) : activeItem.badge === "safe" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {uiLang === "hi" ? "📢 साझा करना सुरक्षित है" : uiLang === "kn" ? "📢 ಹಂಚಿಕೊಳ್ಳಲು ಸುರಕ್ಷಿತ" : "📢 SAFE TO SHARE — For receiving money"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 border border-amber-300">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {uiLang === "hi" ? "⚠️ सावधान — अक्सर ठगी का तरीका" : uiLang === "kn" ? "⚠️ ಎಚ್ಚರಿಕೆ — ವಂಚನೆಯ ತಂತ್ರ" : "⚠️ WARNING TRICK — High Scam Trap"}
                </span>
              )}

              <h2 className="mt-2 text-2xl font-extrabold text-navy">{activeItem.title[uiLang]}</h2>
            </div>

            <button
              type="button"
              onClick={() => speakIfOn(`${activeItem.title[uiLang]}. ${activeItem.simpleMeaning[uiLang]}. ${activeItem.analogy[uiLang]}`)}
              className="rounded-full p-2 text-navy/60 hover:bg-navy/10"
              title="Listen aloud"
            >
              <Volume2 className="h-6 w-6" />
            </button>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy/60">
              {uiLang === "hi" ? "सरल अर्थ:" : uiLang === "kn" ? "ಸರಳ ಅರ್ಥ:" : "Simple definition:"}
            </h3>
            <p className="mt-1 text-lg leading-relaxed text-navy font-semibold">
              {activeItem.simpleMeaning[uiLang]}
            </p>
          </div>

          <div className="rounded-2xl border border-sand bg-sand/30 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <span>💡</span>
              <span>{uiLang === "hi" ? "घरेलू उदाहरण (समझने के लिए):" : uiLang === "kn" ? "ದೈನಂದಿನ ಉದಾಹರಣೆ:" : "Real-world analogy:"}</span>
            </h3>
            <p className="mt-1.5 text-base text-navy/90 leading-relaxed italic">
              "{tr(activeItem.analogy, uiLang)}"
            </p>
          </div>

          <div className="rounded-2xl border-2 border-navy/10 bg-paper p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy/70 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-coral-dark" />
              <span>{uiLang === "hi" ? "याद रखने योग्य नियम:" : uiLang === "kn" ? "ನೆನಪಿನಲ್ಲಿಡಬೇಕಾದ ನಿಯಮ:" : "Safety Golden Rule:"}</span>
            </h3>
            <p className="mt-1.5 text-base font-bold text-navy leading-relaxed">
              {tr(activeItem.rule, uiLang)}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
