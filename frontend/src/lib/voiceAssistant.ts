/**
 * Voice Assistant Engine for SAARTHI SafePay.
 *
 * Implements the continuous hands-free voice loop:
 *   Listen -> Transcribe (Sarvam Saaras v4) -> Intent Understanding ->
 *   Execute Action -> Spoken Response (Sarvam Bulbul v3) -> Listen for next instruction.
 *
 * Safety Principles:
 * - High-risk deterministic engine findings are never overridden.
 * - Never claims a recipient is verified merely because a message is legitimate.
 * - Never asks for, collects, or enters users' PINs, OTPs, or passwords.
 */

import { api } from "../api";
import type { Lang } from "../types";
import { getLanguageInfo } from "./languages";
import { LiveSpeechRecognizer, playMicTone } from "./speechRecognition";
import { speakText, stopSpeech } from "./speech";

export type AssistantState =
  | "idle"
  | "listening"
  | "transcribing"
  | "processing"
  | "speaking"
  | "error";

export interface AssistantTurn {
  id: string;
  role: "user" | "saarthi";
  text: string;
  timestamp: number;
}

export interface AssistantCallbacks {
  onStateChange: (state: AssistantState) => void;
  onInterimText: (text: string) => void;
  onTranscript: (userText: string) => void;
  onResponse: (response: string) => void;
  onError: (errorMsg: string) => void;
  onNavigate: (screen: "home" | "scan" | "ask" | "learn" | "quiz" | "sos" | "story" | "help") => void;
  onChangeLanguage: (newLang: Lang) => void;
  onContinuousLoopChange?: (active: boolean) => void;
}

export interface ParsedIntent {
  intent:
    | "SCAN_QR"
    | "ANALYZE_MESSAGE"
    | "ASK_QUESTION"
    | "NAVIGATE_SOS"
    | "NAVIGATE_LEARN"
    | "NAVIGATE_QUIZ"
    | "NAVIGATE_STORY"
    | "NAVIGATE_HELP"
    | "NAVIGATE_HOME"
    | "CHANGE_LANGUAGE"
    | "REPEAT"
    | "STOP_EXIT"
    | "CLARIFICATION";
  targetLang?: Lang;
  query?: string;
  clarificationPrompt?: string;
}

/** Check for language change commands */
function parseLanguageChange(text: string): Lang | null {
  const lowered = text.toLowerCase();
  if (lowered.includes("hindi") || lowered.includes("हिन्दी") || lowered.includes("हिंदी")) return "hi";
  if (lowered.includes("kannada") || lowered.includes("ಕನ್ನಡ") || lowered.includes("कन्नड़")) return "kn";
  if (lowered.includes("english") || lowered.includes("अंग्रेजी") || lowered.includes("ಇಂಗ್ಲಿಷ್")) return "en";
  if (lowered.includes("bengali") || lowered.includes("bangla") || lowered.includes("বাংলা")) return "bn";
  if (lowered.includes("gujarati") || lowered.includes("ગુજરાતી")) return "gu";
  if (lowered.includes("malayalam") || lowered.includes("മലയാളം")) return "ml";
  if (lowered.includes("marathi") || lowered.includes("मराठी")) return "mr";
  if (lowered.includes("odia") || lowered.includes("oriya") || lowered.includes("ଓଡ଼ିଆ")) return "od";
  if (lowered.includes("punjabi") || lowered.includes("ਪੰਜਾਬੀ")) return "pa";
  if (lowered.includes("tamil") || lowered.includes("தமிழ்")) return "ta";
  if (lowered.includes("telugu") || lowered.includes("తెలుగు")) return "te";
  if (lowered.includes("urdu") || lowered.includes("اردو") || lowered.includes("उर्दू")) return "ur";
  return null;
}

export function parseVoiceIntent(rawText: string, currentLang: Lang): ParsedIntent {
  const text = rawText.trim();
  const lowered = text.toLowerCase();

  // 1. Stop / Cancel / Exit commands
  if (
    /^(stop|exit|cancel|bye|goodbye|quiet|close|shut up|बस|रुक जाओ|बंद करो|ನಿಲ್ಲಿಸು|ಸಾಕು|போதும்|ఆపు)$/i.test(
      lowered,
    ) ||
    lowered.includes("stop listening") ||
    lowered.includes("stop speaking") ||
    lowered.includes("रुक जाओ") ||
    lowered.includes("बंद करो") ||
    lowered.includes("ನಿಲ್ಲಿಸು") || lowered.includes("روکیں") || lowered.includes("بند کرو") || lowered.includes("رک جاؤ")
  ) {
    return { intent: "STOP_EXIT" };
  }

  // 2. Repeat command
  if (
    /^(repeat|say again|what did you say|repeat that|फिर से बोलो|दोबारा बोलो|ಮತ್ತೆ ಹೇಳಿ|ಪುನರಾವರ್ತಿಸಿ|மீண்டும் சொல்|మళ్ళీ చెప్పు)$/i.test(
      lowered,
    ) ||
    lowered.includes("repeat again") ||
    lowered.includes("फिर से") ||
    lowered.includes("ಮತ್ತೆ ಹೇಳಿ") || lowered.includes("دوبارہ") || lowered.includes("دہرائیں")
  ) {
    return { intent: "REPEAT" };
  }

  // 3. Language switch command
  const targetLang = parseLanguageChange(lowered);
  if (
    targetLang &&
    (lowered.includes("language") ||
      lowered.includes("speak in") ||
      lowered.includes("switch to") ||
      lowered.includes("में बोलो") ||
      lowered.includes("में बात करो") ||
      lowered.includes("ಮಾತನಾಡು") ||
      lowered.includes("ಬದಲಿಸು") || lowered.includes("میں بولو") || lowered.includes("میں بات کرو") || lowered.includes("زبان بدلو"))
  ) {
    return { intent: "CHANGE_LANGUAGE", targetLang };
  }

  // 4. QR Scan & Payment Check commands
  if (
    lowered.includes("scan") ||
    lowered.includes("qr") ||
    lowered.includes("camera") ||
    lowered.includes("pay someone") ||
    lowered.includes("check qr") ||
    lowered.includes("check payment") ||
    lowered.includes("स्कैन") ||
    lowered.includes("क्यूआर") ||
    lowered.includes("कैमरा") ||
    lowered.includes("स्केन") ||
    lowered.includes("ಸ್ಕ್ಯಾನ್") ||
    lowered.includes("ಕ್ಯೂಆರ್") ||
    lowered.includes("ಕ್ಯಾಮರಾ") ||
    lowered.includes("స్కాన్") ||
    lowered.includes("கமெரா") ||
    lowered.includes("স্ক্যান") ||
    lowered.includes("કૅમેરા") ||
    lowered.includes("ਕੈਮਰਾ") || lowered.includes("اسکین") || lowered.includes("کیو آر") || lowered.includes("کیمرہ")
  ) {
    return { intent: "SCAN_QR" };
  }

  // 5. Emergency SOS commands
  if (
    lowered.includes("sos") ||
    lowered.includes("emergency") ||
    lowered.includes("help me") ||
    lowered.includes("cheat") ||
    lowered.includes("fraud call") ||
    lowered.includes("someone is asking to pay") ||
    lowered.includes("pressuring me") ||
    lowered.includes("threatened") ||
    lowered.includes("police") ||
    lowered.includes("धोखा") ||
    lowered.includes("आपातकाल") ||
    lowered.includes("मदद") ||
    lowered.includes("दबाव") ||
    lowered.includes("ತುರ್ತು") ||
    lowered.includes("ಸಹಾಯ") || lowered.includes("رہنمائی") ||
    lowered.includes("ಒತ್ತಡ") || lowered.includes("دھوکہ") || lowered.includes("ایمرجنسی") || lowered.includes("مدد") || lowered.includes("دباؤ")
  ) {
    return { intent: "NAVIGATE_SOS" };
  }

  // 6. Navigation to Learn / Quiz / Story
  if (lowered.includes("story") || lowered.includes("कहानी") || lowered.includes("ಕಥೆ") || lowered.includes("کہانی")) {
    return { intent: "NAVIGATE_STORY" };
  }
  if (lowered.includes("quiz") || lowered.includes("game") || lowered.includes("क्विज") || lowered.includes("ಆಟ") || lowered.includes("کوئز") || lowered.includes("کھیل")) {
    return { intent: "NAVIGATE_QUIZ" };
  }
  if (lowered.includes("learn") || lowered.includes("learn safely") || lowered.includes("सीखें") || lowered.includes("ಕಲಿ") || lowered.includes("سیکھیں") || lowered.includes("سیکھنا")) {
    return { intent: "NAVIGATE_LEARN" };
  }

  // 7. Help & Home Navigation
  if (lowered.includes("help") || lowered.includes("how to use") || lowered.includes("सहायता") || lowered.includes("ಸಹಾಯ") || lowered.includes("رہنمائی")) {
    return { intent: "NAVIGATE_HELP" };
  }
  if (lowered.includes("go home") || lowered.includes("main screen") || lowered.includes("होम") || lowered.includes("ಮುಖಪುಟ") || lowered.includes("ہوم") || lowered.includes("مرکزی صفحہ")) {
    return { intent: "NAVIGATE_HOME" };
  }

  // 8. Message / SMS fraud evaluation
  const messageIndicators = [
    "http", "www.", ".top", ".site", ".xyz", ".apk", "electricity", "bill",
    "disconnected", "lottery", "cashback", "dear customer", "account blocked",
    "kyc", "suspended", "refund", "won rs", "part time job", "kbc",
    "संदेश", "बिजली", "खाता बंद", "लॉटरी", "संदेह", "ವಿದ್ಯುತ್", "ಖಾತೆ ಸ್ಥಗಿತ",
  ];
  const isMessageAnalysis =
    lowered.includes("check this message") ||
    lowered.includes("is this scam") ||
    lowered.includes("is this message safe") ||
    lowered.includes("sms check") ||
    messageIndicators.some((indicator) => lowered.includes(indicator));

  if (isMessageAnalysis) {
    return { intent: "ANALYZE_MESSAGE", query: text };
  }

  // 9. Ambiguous partial input -> Clarification prompt
  if (
    lowered === "pay" ||
    lowered === "payment" ||
    lowered === "money" ||
    lowered === "पैसे" ||
    lowered === "पेमेंट" ||
    lowered === "ಹಣ" ||
    lowered === "ಪಾವತಿ" ||
    lowered === "پیسے" ||
    lowered === "رقم"
  ) {
    const clarification =
      currentLang === "hi"
        ? "क्या आप भुगतान की सुरक्षा जांचने के लिए QR कोड स्कैन करना चाहते हैं, या कोई सवाल पूछना चाहते हैं?"
        : currentLang === "kn"
          ? "ನೀವು ಪಾವತಿಯ ಸುರಕ್ಷತೆ ಪರಿಶೀಲಿಸಲು QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಬಯಸುತ್ತೀರಾ, ಅಥವಾ ಪ್ರಶ್ನೆ ಕೇಳಲು ಬಯಸುತ್ತೀರಾ?"
        : currentLang === "ur"
          ? "کیا آپ ادائیگی کی حفاظت جانچنے کے لیے QR کوڈ اسکین کرنا چاہتے ہیں، یا کوئی سوال پوچھنا چاہتے ہیں؟"
          : "Would you like to scan a QR code to check payment safety, or ask a question about safe payments?";
    return {
      intent: "CLARIFICATION",
      clarificationPrompt: clarification,
    };
  }

  // 10. Default: Ask Saarthi knowledge base query
  return { intent: "ASK_QUESTION", query: text };
}

export class VoiceAssistantSession {
  private state: AssistantState = "idle";
  private recognizer: LiveSpeechRecognizer | null = null;
  private callbacks: AssistantCallbacks;
  private lang: Lang;
  private continuous: boolean = true;
  private lastSpokenText: string = "";
  private isDestroyed: boolean = false;
  private silenceTimer: number | null = null;

  constructor(lang: Lang, callbacks: AssistantCallbacks) {
    this.lang = lang;
    this.callbacks = callbacks;
  }

  public updateLanguage(newLang: Lang) {
    this.lang = newLang;
  }

  public getState(): AssistantState {
    return this.state;
  }

  public isContinuous(): boolean {
    return this.continuous;
  }

  public setContinuous(active: boolean) {
    this.continuous = active;
    this.callbacks.onContinuousLoopChange?.(active);
  }

  private setState(next: AssistantState) {
    if (this.isDestroyed) return;
    this.state = next;
    this.callbacks.onStateChange(next);
  }

  private clearSilenceTimer() {
    if (this.silenceTimer !== null) {
      window.clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /** Start a voice interaction turn */
  public startListening() {
    if (this.isDestroyed) return;
    this.stopSpeaking();
    this.clearSilenceTimer();

    this.recognizer = new LiveSpeechRecognizer();
    this.setState("listening");
    playMicTone("start");

    // Timeout if user stays silent for 8 seconds
    this.silenceTimer = window.setTimeout(() => {
      if (this.state === "listening") {
        this.stopListening();
        const silentPrompt =
          this.lang === "hi"
            ? "मुझे कोई आवाज़ नहीं सुनाई दी। जब आप तैयार हों, तब माइक पर टैप करें।"
            : this.lang === "kn"
              ? "ನನಗೆ ಯಾವುದೇ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ನೀವು ಸಿದ್ಧವಾದಾಗ ಮೈಕ್ ಟ್ಯಾಪ್ ಮಾಡಿ."
            : this.lang === "ur"
              ? "مجھے کوئی آواز نہیں سنائی دی۔ جب آپ تیار ہوں، تب مائیک پر ٹیپ کریں۔"
              : "I didn't hear anything. Tap the microphone when you are ready.";
        void this.speakResponse(silentPrompt, false);
      }
    }, 8500);

    this.recognizer.start(this.lang, {
      onInterim: (interim) => {
        this.clearSilenceTimer();
        this.callbacks.onInterimText(interim);
      },
      onFinal: (finalText) => {
        this.clearSilenceTimer();
        playMicTone("stop");
        if (!finalText.trim()) {
          this.setState("idle");
          return;
        }
        this.callbacks.onTranscript(finalText);
        void this.processUserInput(finalText);
      },
      onError: (err) => {
        this.clearSilenceTimer();
        playMicTone("stop");
        this.setState("error");
        this.callbacks.onError(err);
      },
      onEnd: () => {
        this.clearSilenceTimer();
      },
    });
  }

  public stopListening() {
    this.clearSilenceTimer();
    if (this.recognizer) {
      this.recognizer.stop();
      this.recognizer = null;
    }
    if (this.state === "listening") {
      this.setState("idle");
    }
  }

  public stopSpeaking() {
    stopSpeech();
    if (this.state === "speaking") {
      this.setState("idle");
    }
  }

  /** Cancel everything and return to idle */
  public cancelSession() {
    this.continuous = false;
    this.stopListening();
    this.stopSpeaking();
    this.setState("idle");
    this.callbacks.onContinuousLoopChange?.(false);
  }

  /** Speak text aloud through Sarvam Bulbul v3 with fallback */
  public async speakResponse(text: string, continueAfter: boolean = true): Promise<void> {
    if (this.isDestroyed || !text.trim()) return;
    this.stopListening();
    this.setState("speaking");
    this.lastSpokenText = text;
    this.callbacks.onResponse(text);

    await speakText(text, this.lang, (speaking) => {
      if (speaking) {
        this.setState("speaking");
      }
    });

    if (this.isDestroyed) return;
    this.setState("idle");

    // Continuous voice flow: If continuous listening is enabled, resume listening after speech
    if (continueAfter && this.continuous) {
      window.setTimeout(() => {
        if (!this.isDestroyed && this.state === "idle" && this.continuous) {
          this.startListening();
        }
      }, 400);
    }
  }

  /** Process transcribed user voice text */
  public async processUserInput(text: string): Promise<void> {
    this.setState("processing");
    const parsed = parseVoiceIntent(text, this.lang);

    switch (parsed.intent) {
      case "STOP_EXIT": {
        const exitMsg =
          this.lang === "hi"
            ? "ठीक है। सुरक्षित रहें!"
            : this.lang === "kn"
              ? "ಸರಿ. ಸುರಕ್ಷಿತವಾಗಿರಿ!"
              : "Goodbye! Stay safe.";
        this.continuous = false;
        await this.speakResponse(exitMsg, false);
        this.cancelSession();
        break;
      }

      case "REPEAT": {
        if (this.lastSpokenText) {
          await this.speakResponse(this.lastSpokenText, true);
        } else {
          const nothingMsg =
            this.lang === "hi"
              ? "दोहराने के लिए कुछ नहीं है।"
              : this.lang === "kn"
                ? "ಪುನರಾವರ್ತಿಸಲು ಏನೂ ಇಲ್ಲ."
                : "Nothing to repeat yet.";
          await this.speakResponse(nothingMsg, true);
        }
        break;
      }

      case "CHANGE_LANGUAGE": {
        if (parsed.targetLang) {
          this.updateLanguage(parsed.targetLang);
          this.callbacks.onChangeLanguage(parsed.targetLang);
          const langMeta = getLanguageInfo(parsed.targetLang);
          await this.speakResponse(langMeta.greeting, true);
        }
        break;
      }

      case "SCAN_QR": {
        this.callbacks.onNavigate("scan");
        const scanGuidance =
          this.lang === "hi"
            ? "कैमरा खोला जा रहा है। अपने फोन को QR कोड के सामने रखें। हम सुरक्षा की तुरंत जांच करेंगे।"
            : this.lang === "kn"
              ? "ಕ್ಯಾಮರಾ ತೆರೆಯಲಾಗುತ್ತಿದೆ. ಫೋನ್ ಅನ್ನು QR ಕೋಡ್‌ನ ಮುಂದೆ ಇರಿಸಿ. ನಾವು ತಕ್ಷಣ ಸುರಕ್ಷತೆಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತೇವೆ."
              : "Opening camera. Point your phone at the QR code. I will verify its payment safety immediately.";
        // On scan screen, camera takes over, do not auto-loop mic immediately
        await this.speakResponse(scanGuidance, false);
        break;
      }

      case "NAVIGATE_SOS": {
        this.callbacks.onNavigate("sos");
        const sosMsg =
          this.lang === "hi"
            ? "इमरजेंसी SOS खोला गया है। यदि कोई आप पर दबाव बना रहा है, तो रुकें। बैंक को कॉल करें या 1930 पर संपर्क करें।"
            : this.lang === "kn"
              ? "ತುರ್ತು SOS ತೆರೆಯಲಾಗಿದೆ. ಯಾರಾದರೂ ಒತ್ತಡ ಹೇರುತ್ತಿದ್ದರೆ ನಿಲ್ಲಿ. ಬ್ಯಾಂಕ್ ಅಥವಾ 1930 ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ."
              : "Opening Emergency SOS. If someone is pressuring you to pay or transfer money, stop and call 1930 immediately.";
        await this.speakResponse(sosMsg, false);
        break;
      }

      case "NAVIGATE_STORY": {
        this.callbacks.onNavigate("story");
        const storyMsg =
          this.lang === "hi"
            ? "सुरक्षा कहानी खोली गई है। धोखाधड़ी के पैटर्न समझें।"
            : this.lang === "kn"
              ? "ಸುರಕ್ಷತಾ ಕಥೆ ತೆರೆಯಲಾಗಿದೆ. ವಂಚನೆಗಳಿಂದ ಎಚ್ಚರವಾಗಿರಿ."
              : "Opening interactive safety stories.";
        await this.speakResponse(storyMsg, false);
        break;
      }

      case "NAVIGATE_QUIZ": {
        this.callbacks.onNavigate("quiz");
        const quizMsg =
          this.lang === "hi"
            ? "सुरक्षा क्विज़ शुरू हो रहा है।"
            : this.lang === "kn"
              ? "ಸುರಕ್ಷತಾ ರಸಪ್ರಶ್ನೆ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ."
              : "Starting your safety quiz.";
        await this.speakResponse(quizMsg, false);
        break;
      }

      case "NAVIGATE_LEARN": {
        this.callbacks.onNavigate("learn");
        const learnMsg =
          this.lang === "hi"
            ? "सुरक्षा शिक्षण केंद्र खोला गया है।"
            : this.lang === "kn"
              ? "ಸುರಕ್ಷತಾ ಕಲಿಕಾ ಕೇಂದ್ರ ತೆರೆಯಲಾಗಿದೆ."
            : this.lang === "ur"
              ? "حفاظتی تعلیمی مرکز کھولا گیا ہے۔"
              : "Opening the learning center.";
        await this.speakResponse(learnMsg, false);
        break;
      }

      case "NAVIGATE_HELP": {
        this.callbacks.onNavigate("help");
        const helpMsg =
          this.lang === "hi"
            ? "सहाता केंद्र खोला गया है।"
            : this.lang === "kn"
              ? "ಸಹಾಯ ಕೇಂದ್ರ ತೆರೆಯಲಾಗಿದೆ."
            : this.lang === "ur"
              ? "رہنمائی اور امدادی مرکز کھولا گیا ہے۔"
              : "Opening help and guidance.";
        await this.speakResponse(helpMsg, false);
        break;
      }

      case "NAVIGATE_HOME": {
        this.callbacks.onNavigate("home");
        const homeMsg =
          this.lang === "hi"
            ? "मुखपृष्ठ पर वापस आ गए हैं।"
            : this.lang === "kn"
              ? "ಮುಖಪುಟಕ್ಕೆ ಮರಳಿದ್ದೀರಿ."
            : this.lang === "ur"
              ? "مرکزی صفحہ پر واپس آ گئے ہیں۔"
              : "Back to the home screen.";
        await this.speakResponse(homeMsg, true);
        break;
      }

      case "CLARIFICATION": {
        if (parsed.clarificationPrompt) {
          await this.speakResponse(parsed.clarificationPrompt, true);
        }
        break;
      }

      case "ANALYZE_MESSAGE": {
        try {
          const mlRes = await api.analyzeMessage(parsed.query || text, this.lang);
          let spokenExplanation = mlRes.explanation;
          if (mlRes.safe_next_steps.length > 0) {
            spokenExplanation += ` ${mlRes.safe_next_steps[0]}`;
          }
          await this.speakResponse(spokenExplanation, true);
        } catch {
          const fallback =
            this.lang === "hi"
              ? "संदेश विश्लेषण में असमर्थ। किसी भी अनजान व्यक्ति के साथ अपना पिन या OTP कभी साझा न करें।"
              : this.lang === "kn"
                ? "ಸಂದೇಶ ವಿಶ್ಲೇಷಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಯಾರೊಂದಿಗೂ ನಿಮ್ಮ ಪಿನ್ ಅಥವಾ ಒಟಿಪಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ."
              : this.lang === "ur"
                ? "پیغام کا تجزیہ کرنے میں معذرت۔ کسی بھی انجان شخص کے ساتھ اپنا پن یا OTP کبھی شیئر نہ کریں۔"
                : "Unable to analyze message. Always remember: Never share your UPI PIN or OTP with anyone.";
          await this.speakResponse(fallback, true);
        }
        break;
      }

      case "ASK_QUESTION":
      default: {
        try {
          const askRes = await api.ask(parsed.query || text, this.lang);
          const answerBody = askRes.answer;
          await this.speakResponse(answerBody, true);
        } catch {
          const errFallback =
            this.lang === "hi"
              ? "माफ़ कीजिए, मुझे समझ नहीं आया। क्या आप QR कोड स्कैन करना चाहते हैं?"
              : this.lang === "kn"
                ? "ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. ನೀವು QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಬಯಸುವಿರಾ?"
              : this.lang === "ur"
                ? "معاف کیجیے گا، مجھے سمجھ نہیں آیا۔ کیا آپ کیو آر کوڈ اسکین کرنا چاہتے ہیں؟"
                : "I could not find an answer. Would you like to scan a QR code to check a payment?";
          await this.speakResponse(errFallback, true);
        }
        break;
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.cancelSession();
  }
}
