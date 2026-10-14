import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Gift,
  Mic,
  MicOff,
  Phone,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { api, ApiError } from "../api";
import { BigButton } from "../components/Button";
import { Banner, Card } from "../components/bits";
import { useApp, useNav } from "../state";
import { playTtsBase64 } from "../lib/speech";

type ScenarioKey = "fake_bank" | "lottery_email" | "grandchild_emergency";

interface ChatMessage {
  id: string;
  sender: "scammer" | "user";
  text: string;
  educationalTip?: string;
}

const SCENARIOS = [
  {
    key: "fake_bank" as ScenarioKey,
    icon: Phone,
    title: { en: "Fake Bank Manager Call", hi: "नकली बैंक मैनेजर का फोन", kn: "ನಕಲಿ ಬ್ಯಾಂಕ್ ಮ್ಯಾನೇಜರ್ ಕರೆ" },
    subtitle: {
      en: "Threatens to freeze your account in 30 minutes unless you share OTP.",
      hi: "धमकी देता है कि 30 मिनट में खाता बंद हो जाएगा यदि OTP नहीं दिया।",
      kn: "OTP ನೀಡದಿದ್ದರೆ 30 ನಿಮಿಷದಲ್ಲಿ ಖಾತೆ ಸ್ಥಗಿತಗೊಳಿಸುವ ಬೆದರಿಕೆ.",
    },
    opening: {
      en: "Hello, this is Rajesh from your bank's head office. Your account has suspicious activity and will be blocked in 30 minutes! Please confirm the 6-digit OTP I just sent you.",
      hi: "नमस्ते, मैं आपके बैंक के मुख्य कार्यालय से राजेश बोल रहा हूँ। आपके खाते में संदिग्ध गतिविधि हुई है और 30 मिनट में खाता बंद हो जाएगा! कृपया अपने फोन पर आया 6 अंकों का OTP बताएं।",
      kn: "ನಮಸ್ಕಾರ, ನಾನು ಬ್ಯಾಂಕ್ ಮುಖ್ಯ ಕಚೇರಿಯಿಂದ ರಾಜೇಶ್. ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಅನುಮಾನಾಸ್ಪದ ಚಟುವಟಿಕೆ ನಡೆದಿದೆ. ಬಂದಿರುವ 6 ಅಂಕಿಯ OTP ತಿಳಿಸಿ.",
    },
    quickReplies: [
      { en: "I never share OTP over phone. I will visit my branch.", hi: "मैं फोन पर OTP कभी नहीं देता। मैं शाखा जाऊँगा।", kn: "ನಾನು ಫೋನ್‌ನಲ್ಲಿ OTP ಕೊಡುವುದಿಲ್ಲ. ಬ್ಯಾಂಕ್‌ಗೆ ಹೋಗುತ್ತೇನೆ." },
      { en: "Why does a bank need my OTP? That is suspicious.", hi: "बैंक को OTP की क्या ज़रूरत? यह संदिग्ध है।", kn: "ಬ್ಯಾಂಕ್‌ಗೆ OTP ಏಕೆ ಬೇಕು? ಇದು ಅನುಮಾನಾಸ್ಪದವಾಗಿದೆ." },
      { en: "I am hanging up and calling 1930.", hi: "मैं फोन काटकर 1930 पर शिकायत कर रहा हूँ।", kn: "ನಾನು ಕರೆ ಕಟ್ ಮಾಡಿ 1930ಗೆ ಕರೆ ಮಾಡುತ್ತೇನೆ." },
    ],
  },
  {
    key: "lottery_email" as ScenarioKey,
    icon: Gift,
    title: { en: "₹25 Lakh Lottery Winner", hi: "₹25 लाख की लॉटरी विजेता", kn: "₹25 ಲಕ್ಷ ಲಾಟರಿ ವಿಜೇತ" },
    subtitle: {
      en: "Claims you won ₹25,00,000, but asks for a ₹2,500 'processing fee'.",
      hi: "कहता है कि आपने 25 लाख जीते हैं, पर 2,500 की 'प्रोसेसिंग फीस' माँगता है।",
      kn: "₹25 ಲಕ್ಷ ಗೆದ್ದಿದ್ದೀರಿ ಎಂದು ₹2,500 ಪ್ರಕ್ರಿಯೆ ಶುಲ್ಕ ಕೇಳುತ್ತಾನೆ.",
    },
    opening: {
      en: "Congratulations! You won ₹25,00,000 in the National Grand Lottery. To release your prize funds to your bank, pay a small registration tax of ₹2,500 to our UPI ID.",
      hi: "बधाई हो! आपने राष्ट्रीय महा-लॉटरी में ₹25,00,000 जीते हैं। पुरस्कार राशि आपके बैंक में भेजने के लिए हमारे UPI पर मात्र ₹2,500 का पंजीकरण शुल्क भेजें।",
      kn: "ಅಭಿನಂದನೆಗಳು! ನೀವು ₹25,00,000 ಲಾಟರಿ ಗೆದ್ದಿದ್ದೀರಿ. ಹಣ ಬಿಡುಗಡೆ ಮಾಡಲು ನಮ್ಮ UPIಗೆ ₹2,500 ಶುಲ್ಕ ಕಳುಹಿಸಿ.",
    },
    quickReplies: [
      { en: "I never bought any lottery ticket. This is fraud.", hi: "मैंने कभी कोई लॉटरी टिकट नहीं खरीदा। यह धोखाधड़ी है।", kn: "ನಾನು ಎಂದಿಗೂ ಲಾಟರಿ ಟಿಕೆಟ್ ಖರೀದಿಸಿಲ್ಲ. ಇದು ವಂಚನೆ." },
      { en: "Deduct the fee from the prize money and send the rest.", hi: "पुरस्कार की राशि से ही फीस काटकर बाकी भेज दो।", kn: "ಬಹುಮಾನದ ಹಣದಲ್ಲೇ ಶುಲ್ಕ ಮುರಿದುಕೊಂಡು ಉಳಿದ ಹಣ ಕಳುಹಿಸಿ." },
      { en: "I am not sending a single rupee to strangers.", hi: "मैं किसी अनजान को एक भी रुपया नहीं भेजूँगा।", kn: "ನಾನು ಅಪರಿಚಿತರಿಗೆ ಒಂದು ರೂಪಾಯಿಯನ್ನೂ ಕಳುಹಿಸುವುದಿಲ್ಲ." },
    ],
  },
  {
    key: "grandchild_emergency" as ScenarioKey,
    icon: Users,
    title: { en: "Grandchild in Distress", hi: "पोते/पोती का आपातकालीन कॉल", kn: "ಮೊಮ್ಮಗನ ತುರ್ತು ಪರಿಸ್ಥಿತಿ" },
    subtitle: {
      en: "Scammer imitates a crying grandchild needing urgent money.",
      hi: "धोखेबाज़ रोते हुए पोते की आवाज़ बनाकर तुरंत अस्पताल के पैसे माँगता है।",
      kn: "ವಂಚಕ ಅಳುತ್ತಾ ತುರ್ತು ಆಸ್ಪತ್ರೆ ವೆಚ್ಚಕ್ಕೆ ಹಣ ಕೇಳುತ್ತಾನೆ.",
    },
    opening: {
      en: "Dadi/Dada! It's me, Arjun! I had a bad bike accident and the clinic needs ₹15,000 right now for medicine. Please UPI it urgently, and don't tell Mummy-Papa, they will panic!",
      hi: "दादी/दादा! मैं अर्जुन बोल रहा हूँ! मेरी बाइक का एक्सीडेंट हो गया है और क्लिनिक में तुरंत ₹15,000 चाहिए। कृपया तुरंत UPI कर दीजिए, मम्मी-पापा को मत बताना, वो घबरा जाएँगे!",
      kn: "ಅಜ್ಜಿ/ತಾತಾ! ನಾನು ಅರ್ಜುನ್! ಬೈಕ್ ಅಪಘಾತವಾಗಿದೆ, ಕ್ಲಿನಿಕ್‌ಗೆ ₹15,000 ಬೇಕು. ತುರ್ತಾಗಿ UPI ಮಾಡಿ, ಅಪ್ಪ-ಅಮ್ಮನಿಗೆ ಹೇಳಬೇಡಿ!",
    },
    quickReplies: [
      { en: "I am calling your mother directly to verify right now.", hi: "मैं तुम्हारी माँ को सीधे फोन करके पुष्टि कर रहा हूँ।", kn: "ನಾನು ನಿಮ್ಮ ಅಮ್ಮನಿಗೆ ನೇರವಾಗಿ ಕರೆ ಮಾಡುತ್ತೇನೆ." },
      { en: "What is your pet dog's name? Prove you are Arjun.", hi: "तुम्हारे पालतू कुत्ते का नाम क्या है? साबित करो कि तुम अर्जुन हो।", kn: "ನಿಮ್ಮ ಸಾಕು ನಾಯಿಯ ಹೆಸರೇನು? ಸಾಬೀತುಪಡಿಸಿ." },
      { en: "I will not send money without speaking to your parents.", hi: "माता-पिता से बात किए बिना मैं पैसे नहीं भेजूँगा।", kn: "ಪೋಷಕರೊಂದಿಗೆ ಮಾತನಾಡದೆ ಹಣ ಕಳುಹಿಸುವುದಿಲ್ಲ." },
    ],
  },
];

export function ScamRoleplayScreen() {
  const { uiLang, lang, speakIfOn, stopSpeaking } = useApp();
  const { go } = useNav();

  const [activeScenarioKey, setActiveScenarioKey] = useState<ScenarioKey | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resistanceWon, setResistanceWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const activeScenario = SCENARIOS.find((s) => s.key === activeScenarioKey);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startScenario = (key: ScenarioKey) => {
    const sc = SCENARIOS.find((s) => s.key === key)!;
    const openingMsg = sc.opening[uiLang];

    setActiveScenarioKey(key);
    setMessages([
      {
        id: "msg_1",
        sender: "scammer",
        text: openingMsg,
      },
    ]);
    setHistory([{ role: "assistant", content: openingMsg }]);
    setResistanceWon(false);
    setGameOver(false);
    setInputVal("");
    speakIfOn(openingMsg);
  };

  const handleSendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || !activeScenarioKey || loading) return;

    stopSpeaking();
    setInputVal("");

    const newMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, newMsg]);

    const updatedHistory = [...history, { role: "user", content: trimmed }];
    setHistory(updatedHistory);
    setLoading(true);

    try {
      const resp = await api.scamRoleplay(activeScenarioKey, trimmed, updatedHistory, lang);

      const scammerMsg: ChatMessage = {
        id: `scam_${Date.now()}`,
        sender: "scammer",
        text: resp.reply,
        educationalTip: resp.educational_tip,
      };

      setMessages((prev) => [...prev, scammerMsg]);
      setHistory((prev) => [...prev, { role: "assistant", content: resp.reply }]);

      if (resp.audio_base64) {
        await playTtsBase64(resp.audio_base64);
      } else {
        speakIfOn(resp.reply);
      }

      if (resp.resistance_detected) {
        setResistanceWon(true);
        setTimeout(() => setGameOver(true), 2500);
      } else if (updatedHistory.length >= 8) {
        setGameOver(true);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error contacting simulation AI.";
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "scammer",
          text: uiLang === "hi" ? "कॉल कट गई। फिर से प्रयास करें।" : uiLang === "kn" ? "ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ." : "Call dropped or network timed out.",
          educationalTip: msg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Browser Speech-to-text dictation
  const toggleRecording = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert("Voice recognition is not supported in this browser. Please type or click a quick reply.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0]?.transcript;
        if (transcript) {
          setInputVal(transcript);
        }
      };

      recognition.start();
    } catch {
      setIsRecording(false);
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
            if (activeScenarioKey) {
              setActiveScenarioKey(null);
            } else {
              go({ screen: "learn" });
            }
          }}
          icon={<ArrowLeft className="h-5 w-5" />}
        >
          {activeScenarioKey
            ? (uiLang === "hi" ? "गेम बदलें" : uiLang === "kn" ? "ಬೇರೆ ಸನ್ನಿವೇಶ" : "Choose Another")
            : (uiLang === "hi" ? "वापस" : uiLang === "kn" ? "ಹಿಂತಿರುಗಿ" : "Back")}
        </BigButton>
        <span className="flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-sm font-extrabold text-navy">
          <ShieldCheck className="h-4 w-4 text-teal" />
          {uiLang === "hi" ? "AI स्कैम सिमुलेशन" : uiLang === "kn" ? "AI ಸ್ಕ್ಯಾಮ್ ಸಿಮ್ಯುಲೇಶನ್" : "AI Scam Roleplay"}
        </span>
      </div>

      {/* Scenario Selection Mode */}
      {!activeScenarioKey ? (
        <div className="space-y-4">
          <header>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
              {uiLang === "hi" ? "🎭 AI स्कैम रोलप्ले गेम" : uiLang === "kn" ? "🎭 AI ಸ್ಕ್ಯಾಮ್ ರೋಲ್‌ಪ್ಲೇ ಆಟ" : "🎭 Scam Roleplay Game"}
            </h1>
            <p className="mt-1 text-base sm:text-lg text-navy/80">
              {uiLang === "hi"
                ? "असली AI धोखेबाज़ से सुरक्षित बात करके 'ना' कहने की आदत डालें।"
                : uiLang === "kn"
                  ? "ನೈಜ AI ವಂಚಕರೊಂದಿಗೆ ಸಂವಾದ ನಡೆಸಿ ಧೈರ್ಯವಾಗಿ 'ಬೇಡ' ಎಂದು ಹೇಳಲು ಕಲಿಯಿರಿ."
                  : "Practice saying NO to realistic AI scammers in a safe simulation."}
            </p>
          </header>

          <div className="grid gap-4">
            {SCENARIOS.map((sc) => {
              const Icon = sc.icon;
              return (
                <button
                  key={sc.key}
                  type="button"
                  onClick={() => startScenario(sc.key)}
                  className="group flex flex-col items-start gap-3 rounded-3xl border-2 border-navy/10 bg-white p-5 text-left shadow-soft transition-all hover:border-coral hover:shadow-lift"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand text-navy">
                        <Icon className="h-6 w-6 text-coral-dark" />
                      </div>
                      <h2 className="text-xl font-extrabold text-navy group-hover:text-coral-dark">
                        {sc.title[uiLang]}
                      </h2>
                    </div>
                    <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-bold text-navy/70">
                      {uiLang === "hi" ? "प्रारंभ करें →" : uiLang === "kn" ? "ಪ್ರಾರಂಭಿಸಿ →" : "Start →"}
                    </span>
                  </div>
                  <p className="text-base text-navy/80">{sc.subtitle[uiLang]}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Active Roleplay Chat */
        <div className="space-y-4">
          <Card className="flex items-center justify-between border-2 border-coral/30 bg-coral/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral/20 text-coral-dark">
                {activeScenario && <activeScenario.icon className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-navy">{activeScenario?.title[uiLang]}</h2>
                <p className="text-xs text-navy/70">
                  {uiLang === "hi" ? "सावधानी: गोपनीय जानकारी बिल्कुल न दें।" : uiLang === "kn" ? "ಎಚ್ಚರಿಕೆ: ಗೌಪ್ಯ ಮಾಹಿತಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ." : "Mission: Stand your ground and refuse to share secret info."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startScenario(activeScenarioKey)}
              className="rounded-full p-2 text-navy/60 hover:bg-navy/10"
              title="Restart Call"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </Card>

          {/* Victory / Game Over Card */}
          {gameOver && (
            <Banner
              tone={resistanceWon ? "success" : "danger"}
              icon={resistanceWon ? <Trophy className="h-8 w-8 text-emerald-600" /> : <ShieldAlert className="h-8 w-8 text-coral-dark" />}
              title={resistanceWon
                ? (uiLang === "hi" ? "🏆 बधाई! आपने जालसाज को हरा दिया!" : uiLang === "kn" ? "🏆 ಅಭಿನಂದನೆಗಳು! ನೀವು ವಂಚಕನನ್ನು ಸೋಲಿಸಿದ್ದೀರಿ!" : "🏆 Victory! Scam Defeated!")
                : (uiLang === "hi" ? "कॉल समाप्त" : uiLang === "kn" ? "ಕರೆ ಮುಕ್ತಾಯ" : "Simulation Completed")}
            >
              <p className="text-base">
                {resistanceWon
                  ? (uiLang === "hi"
                      ? "आपने दृढ़ता से मना किया और अपनी सुरक्षा सुनिश्चित की! असली ज़िंदगी में भी ऐसे ही अडिग रहें।"
                      : uiLang === "kn"
                        ? "ನೀವು ದೃಢವಾಗಿ ನಿರಾಕರಿಸಿದ್ದೀರಿ! ನೈಜ ಜೀವನದಲ್ಲೂ ಇದೇ ಜಾಗರೂಕತೆ ಇರಲಿ."
                        : "You stood firm and refused the scammer's demands. Outstanding resistance!")
                  : (uiLang === "hi"
                      ? "याद रखें: कोई भी असली बैंक अधिकारी कभी फोन पर OTP नहीं माँगता।"
                      : uiLang === "kn"
                        ? "ನೆನಪಿಡಿ: ನೈಜ ಬ್ಯಾಂಕ್ ಅಧಿಕಾರಿಗಳು ಎಂದಿಗೂ OTP ಕೇಳುವುದಿಲ್ಲ."
                        : "Never forget: True bank officers never threaten or request OTP over calls.")}
              </p>
              <div className="mt-3 flex gap-2">
                <BigButton variant="outline" onClick={() => startScenario(activeScenarioKey)}>
                  {uiLang === "hi" ? "फिर से खेलें" : uiLang === "kn" ? "ಮತ್ತೆ ಆಡಿ" : "Play Again"}
                </BigButton>
                <BigButton variant="teal" onClick={() => setActiveScenarioKey(null)}>
                  {uiLang === "hi" ? "अन्य परिदृश्य" : uiLang === "kn" ? "ಇನ್ನೊಂದು ಸನ್ನಿವೇಶ" : "Other Scenarios"}
                </BigButton>
              </div>
            </Banner>
          )}

          {/* Messages Bubble Area */}
          <div className="max-h-[380px] min-h-[260px] overflow-y-auto rounded-3xl border border-navy/15 bg-paper/60 p-4 space-y-3 shadow-inner">
            {messages.map((m) => {
              const isScammer = m.sender === "scammer";
              return (
                <div key={m.id} className={`flex flex-col ${isScammer ? "items-start" : "items-end"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-base ${
                      isScammer
                        ? "bg-white text-navy border-2 border-navy/10 rounded-tl-sm"
                        : "bg-teal text-white rounded-tr-sm font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1 opacity-70">
                      {isScammer ? (
                        <>
                          <Phone className="h-3.5 w-3.5 text-coral" />
                          <span>{uiLang === "hi" ? "कॉलर (संदिग्ध)" : uiLang === "kn" ? "ಕರೆದಾರ (ವಂಚಕ)" : "Caller (Suspect)"}</span>
                        </>
                      ) : (
                        <span>{uiLang === "hi" ? "आप" : uiLang === "kn" ? "ನೀವು" : "You"}</span>
                      )}
                    </div>
                    <p className="leading-relaxed">{m.text}</p>
                  </div>

                  {m.educationalTip && (
                    <div className="mt-1 max-w-[85%] rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-900 font-medium flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{m.educationalTip}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-navy/60 italic p-2">
                <span className="inline-block animate-spin">⏳</span>
                <span>{uiLang === "hi" ? "कॉलर जवाब दे रहा है..." : uiLang === "kn" ? "ಕರೆದಾರ ಉತ್ತರಿಸುತ್ತಿದ್ದಾನೆ..." : "Scammer is responding..."}</span>
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Quick Reply Suggestions */}
          {!gameOver && activeScenario && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-navy/60">
                {uiLang === "hi" ? "सुझाए गए सुरक्षित जवाब (टैप करें):" : uiLang === "kn" ? "ಸುರಕ್ಷಿತ ಪ್ರತಿಕ್ರಿಯೆಗಳು:" : "Suggested Safe Replies:"}
              </span>
              <div className="flex flex-wrap gap-2">
                {activeScenario.quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSendMessage(qr[uiLang])}
                    className="rounded-full border border-navy/20 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-bold text-navy hover:border-teal hover:bg-teal/10 hover:text-teal-dark active:scale-95 transition-all"
                  >
                    💬 {qr[uiLang]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text/Speech Input Bar */}
          {!gameOver && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage(inputVal);
                }}
                placeholder={uiLang === "hi" ? "अपना जवाब यहाँ लिखें..." : uiLang === "kn" ? "ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆ ಬರೆಯಿರಿ..." : "Type your response..."}
                disabled={loading}
                className="flex-1 rounded-2xl border-2 border-navy/20 bg-white px-4 py-3 text-base text-navy shadow-inner focus:border-teal focus:outline-none"
              />

              <button
                type="button"
                onClick={toggleRecording}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all ${
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-sand text-navy hover:bg-sand/80"
                }`}
                title="Speak your reply"
              >
                {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>

              <button
                type="button"
                disabled={loading || !inputVal.trim()}
                onClick={() => handleSendMessage(inputVal)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal text-white shadow-soft hover:bg-teal-dark disabled:opacity-40 transition-all"
                title="Send"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
