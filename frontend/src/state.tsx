import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import { STRINGS, type Dict } from "./i18n";
import { getLanguageInfo, SUPPORTED_LANGUAGES, type LanguageInfo } from "./lib/languages";
import { speakText, stopSpeech } from "./lib/speech";
import {
  VoiceAssistantSession,
  type AssistantState,
} from "./lib/voiceAssistant";
import type { AnalyzeResult, HealthInfo, Intention, Lang, UILang } from "./types";

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

export type ScreenId =
  | "home"
  | "scan"
  | "result"
  | "ask"
  | "learn"
  | "quiz"
  | "sos"
  | "story"
  | "help"
  | "practice"
  | "roleplay"
  | "jargon"
  | "defender";

export type Route =
  | { screen: "home" }
  | { screen: "scan"; autoStartCamera?: boolean }
  | {
      screen: "result";
      result: AnalyzeResult;
      expectation: { intention: Intention; expectedAmount: number | null };
    }
  | { screen: "ask"; initialQuery?: string; context?: string }
  | { screen: "learn" }
  | { screen: "quiz" }
  | { screen: "sos" }
  | { screen: "story" }
  | { screen: "help" }
  | { screen: "practice" }
  | { screen: "roleplay" }
  | { screen: "jargon" }
  | { screen: "defender" };

interface NavContextValue {
  route: Route;
  canGoBack: boolean;
  go: (route: Route) => void;
  back: () => void;
  home: () => void;
}

/* ------------------------------------------------------------------ */
/* App-wide settings + voice                                           */
/* ------------------------------------------------------------------ */

export interface AppContextValue {
  lang: Lang;
  uiLang: UILang;
  setLang: (lang: Lang) => void;
  activeLangInfo: LanguageInfo;
  hasUiTranslation: boolean;
  t: Dict;
  scale: number;
  setScale: (scale: number) => void;
  voiceOn: boolean;
  setVoiceOn: (on: boolean) => void;
  health: HealthInfo | null;
  isSpeaking: boolean;
  hasLastSpoken: boolean;
  speak: (text: string) => void;
  speakIfOn: (text: string) => void;
  stopSpeaking: () => void;
  repeatLast: () => void;

  // Voice-first assistant continuous flow
  assistantState: AssistantState;
  interimTranscript: string;
  lastTranscript: string;
  lastAssistantResponse: string;
  isContinuousVoice: boolean;
  setIsContinuousVoice: (active: boolean) => void;
  startVoiceSession: () => void;
  stopVoiceSession: () => void;
  cancelVoiceSession: () => void;
  voiceErrorMessage: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);
const NavContext = createContext<NavContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside <AppProvider>");
  return value;
}

export function useNav(): NavContextValue {
  const value = useContext(NavContext);
  if (!value) throw new Error("useNav must be used inside <AppProvider>");
  return value;
}

/* ------------------------------------------------------------------ */

const FONT_SIZES = ["100%", "112%", "125%"];

const ROUTE_SPEECH: Partial<Record<ScreenId, (t: Dict) => string>> = {
  home: (t) => t.app.greeting,
  scan: (t) => `${t.scan.title}. ${t.scan.subtitle}`,
  ask: (t) => `${t.ask.title}. ${t.ask.subtitle}`,
  learn: (t) => `${t.learn.title}. ${t.learn.subtitle}`,
  quiz: (t) => t.quiz.title,
  sos: (t) => `${t.sos.title}. ${t.sos.intro}`,
  story: (t) => `${t.story.title}. ${t.story.subtitle}`,
  help: (t) => `${t.help.title}. ${t.help.subtitle}`,
};

const VALID_LANG_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));

function usePersisted<T>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  });
  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage unavailable (private mode) - keep in-memory value */
      }
    },
    [key],
  );
  return [value, update];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [storedLang, setStoredLang] = usePersisted<string>("saarthi:lang", "en");
  const lang: Lang = VALID_LANG_CODES.has(storedLang as Lang) ? (storedLang as Lang) : "en";
  const activeLangInfo = useMemo(() => getLanguageInfo(lang), [lang]);

  // Active UI language follows the selected language directly
  const uiLang: UILang = lang;
  const t = STRINGS[uiLang] ?? STRINGS.en;
  const hasUiTranslation = true;

  const [rawScale, setScale] = usePersisted<number>("saarthi:scale", 0);
  const scale = rawScale >= 0 && rawScale <= 2 ? rawScale : 0;

  const [voiceOn, setVoiceOn] = usePersisted<boolean>("saarthi:voice", true);
  const [isContinuousVoice, setIsContinuousVoice] = usePersisted<boolean>(
    "saarthi:continuous_voice",
    true,
  );

  const [stack, setStack] = useState<Route[]>([{ screen: "home" }]);
  const route = stack[stack.length - 1];

  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenRef = useRef<string>("");
  const [hasLastSpoken, setHasLastSpoken] = useState(false);

  // Assistant states
  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastAssistantResponse, setLastAssistantResponse] = useState("");
  const [voiceErrorMessage, setVoiceErrorMessage] = useState<string | null>(null);

  const assistantSessionRef = useRef<VoiceAssistantSession | null>(null);

  /* Text size drives rem-based Tailwind sizes. */
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[scale] ?? "100%";
  }, [scale]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  /* Backend status (voice configured?) - failures are tolerated. */
  useEffect(() => {
    let alive = true;
    api
      .health()
      .then((info) => {
        if (alive) setHealth(info);
      })
      .catch(() => {
        /* backend offline - screens show their own error states */
      });
    return () => {
      alive = false;
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      const body = text.trim();
      if (!body) return;
      lastSpokenRef.current = body;
      setHasLastSpoken(true);
      void speakText(body, lang, setIsSpeaking);
    },
    [lang],
  );

  const speakIfOn = useCallback(
    (text: string) => {
      if (voiceOn) speak(text);
    },
    [voiceOn, speak],
  );

  const stopSpeaking = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
    assistantSessionRef.current?.stopSpeaking();
  }, []);

  const repeatLast = useCallback(() => {
    if (lastSpokenRef.current) speak(lastSpokenRef.current);
  }, [speak]);

  const go = useCallback((next: Route) => {
    setStack((current) => [...current, next]);
  }, []);
  const back = useCallback(() => {
    setStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
  }, []);
  const home = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
    assistantSessionRef.current?.cancelSession();
    setStack([{ screen: "home" }]);
  }, []);

  const setLang = useCallback(
    (newLang: Lang) => {
      setStoredLang(newLang);
      assistantSessionRef.current?.updateLanguage(newLang);
    },
    [setStoredLang],
  );

  // Initialize or update the Voice Assistant Session
  useEffect(() => {
    const session = new VoiceAssistantSession(lang, {
      onStateChange: (state) => {
        setAssistantState(state);
        setIsSpeaking(state === "speaking");
      },
      onInterimText: (text) => setInterimTranscript(text),
      onTranscript: (userText) => {
        setLastTranscript(userText);
        setInterimTranscript("");
      },
      onResponse: (response) => {
        setLastAssistantResponse(response);
        lastSpokenRef.current = response;
        setHasLastSpoken(true);
      },
      onError: (errMsg) => {
        setVoiceErrorMessage(errMsg);
      },
      onNavigate: (screen) => {
        if (screen === "home") {
          home();
        } else if (screen === "scan") {
          go({ screen: "scan", autoStartCamera: true });
        } else {
          go({ screen });
        }
      },
      onChangeLanguage: (newLang) => {
        setLang(newLang);
      },
      onContinuousLoopChange: (active) => {
        setIsContinuousVoice(active);
      },
    });

    session.setContinuous(isContinuousVoice);
    assistantSessionRef.current = session;

    return () => {
      session.destroy();
    };
  }, [lang, isContinuousVoice, go, home, setLang, setIsContinuousVoice]);

  const startVoiceSession = useCallback(() => {
    setVoiceErrorMessage(null);
    assistantSessionRef.current?.setContinuous(isContinuousVoice);
    assistantSessionRef.current?.startListening();
  }, [isContinuousVoice]);

  const stopVoiceSession = useCallback(() => {
    assistantSessionRef.current?.stopListening();
  }, []);

  const cancelVoiceSession = useCallback(() => {
    assistantSessionRef.current?.cancelSession();
  }, []);

  /* Voice guidance: announce the screen when it changes (if enabled and assistant not active). */
  useEffect(() => {
    if (!voiceOn) return;
    if (assistantState !== "idle") return;
    const builder = ROUTE_SPEECH[route.screen];
    if (!builder) return;
    const timer = window.setTimeout(() => speak(builder(t)), 200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.screen, lang, voiceOn]);

  const appValue = useMemo<AppContextValue>(
    () => ({
      lang,
      uiLang,
      setLang,
      activeLangInfo,
      hasUiTranslation,
      t,
      scale,
      setScale,
      voiceOn,
      setVoiceOn,
      health,
      isSpeaking,
      hasLastSpoken,
      speak,
      speakIfOn,
      stopSpeaking,
      repeatLast,
      assistantState,
      interimTranscript,
      lastTranscript,
      lastAssistantResponse,
      isContinuousVoice,
      setIsContinuousVoice,
      startVoiceSession,
      stopVoiceSession,
      cancelVoiceSession,
      voiceErrorMessage,
    }),
    [
      lang,
      uiLang,
      setLang,
      activeLangInfo,
      hasUiTranslation,
      t,
      scale,
      setScale,
      voiceOn,
      setVoiceOn,
      health,
      isSpeaking,
      hasLastSpoken,
      speak,
      speakIfOn,
      stopSpeaking,
      repeatLast,
      assistantState,
      interimTranscript,
      lastTranscript,
      lastAssistantResponse,
      isContinuousVoice,
      setIsContinuousVoice,
      startVoiceSession,
      stopVoiceSession,
      cancelVoiceSession,
      voiceErrorMessage,
    ],
  );

  const navValue = useMemo<NavContextValue>(
    () => ({ route, canGoBack: stack.length > 1, go, back, home }),
    [route, stack.length, go, back, home],
  );

  return (
    <AppContext.Provider value={appValue}>
      <NavContext.Provider value={navValue}>{children}</NavContext.Provider>
    </AppContext.Provider>
  );
}
