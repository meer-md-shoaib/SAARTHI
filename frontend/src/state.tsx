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
import { speakText, stopSpeech } from "./lib/speech";
import type { AnalyzeResult, HealthInfo, Intention, Lang } from "./types";

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
  | "help";

export type Route =
  | { screen: "home" }
  | { screen: "scan" }
  | {
      screen: "result";
      result: AnalyzeResult;
      expectation: { intention: Intention; expectedAmount: number | null };
    }
  | { screen: "ask" }
  | { screen: "learn" }
  | { screen: "quiz" }
  | { screen: "sos" }
  | { screen: "story" }
  | { screen: "help" };

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

interface AppContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
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
  const [storedLang, setLang] = usePersisted<Lang>("saarthi:lang", "en");
  const lang: Lang = storedLang in STRINGS ? storedLang : "en";
  const t = STRINGS[lang];

  const [rawScale, setScale] = usePersisted<number>("saarthi:scale", 0);
  const scale = rawScale >= 0 && rawScale <= 2 ? rawScale : 0;

  const [voiceOn, setVoiceOn] = usePersisted<boolean>("saarthi:voice", true);

  const [stack, setStack] = useState<Route[]>([{ screen: "home" }]);
  const route = stack[stack.length - 1];

  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenRef = useRef<string>("");
  const [hasLastSpoken, setHasLastSpoken] = useState(false);

  /* Text size drives rem-based Tailwind sizes. */
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[scale] ?? "100%";
  }, [scale]);

  useEffect(() => {
    document.documentElement.lang = lang;
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
  }, []);

  const repeatLast = useCallback(() => {
    if (lastSpokenRef.current) speak(lastSpokenRef.current);
  }, [speak]);

  /* Voice guidance: announce the screen when it changes (if enabled). */
  useEffect(() => {
    if (!voiceOn) return;
    const builder = ROUTE_SPEECH[route.screen];
    if (!builder) return;
    const timer = window.setTimeout(() => speak(builder(t)), 150);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.screen, lang, voiceOn]);

  const go = useCallback((next: Route) => {
    setStack((current) => [...current, next]);
  }, []);
  const back = useCallback(() => {
    setStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
  }, []);
  const home = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
    setStack([{ screen: "home" }]);
  }, []);

  const appValue = useMemo<AppContextValue>(
    () => ({
      lang,
      setLang,
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
    }),
    [lang, setLang, t, scale, setScale, voiceOn, setVoiceOn, health, isSpeaking, hasLastSpoken, speak, speakIfOn, stopSpeaking, repeatLast],
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
