import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "./components/AppShell";
import { AppProvider, useNav } from "./state";
import { AskScreen } from "./screens/AskScreen";
import { HelpScreen } from "./screens/HelpScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { JargonScreen } from "./screens/JargonScreen";
import { LearnScreen } from "./screens/LearnScreen";
import { PracticeScreen } from "./screens/PracticeScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { ScamRoleplayScreen } from "./screens/ScamRoleplayScreen";
import { ScanScreen } from "./screens/ScanScreen";
import { SosScreen } from "./screens/SosScreen";
import { StoryScreen } from "./screens/StoryScreen";

function CurrentScreen() {
  const { route } = useNav();
  switch (route.screen) {
    case "home":
      return <HomeScreen />;
    case "scan":
      return <ScanScreen />;
    case "result":
      return <ResultScreen />;
    case "ask":
      return <AskScreen />;
    case "learn":
      return <LearnScreen />;
    case "quiz":
      return <QuizScreen />;
    case "sos":
      return <SosScreen />;
    case "story":
      return <StoryScreen />;
    case "help":
      return <HelpScreen />;
    case "practice":
      return <PracticeScreen />;
    case "roleplay":
      return <ScamRoleplayScreen />;
    case "jargon":
      return <JargonScreen />;
    default:
      return null;
  }
}

function AnimatedScreens() {
  const { route } = useNav();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={route.screen}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <CurrentScreen />
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell>
        <AnimatedScreens />
      </AppShell>
    </AppProvider>
  );
}
