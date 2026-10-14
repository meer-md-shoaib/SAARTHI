import { useEffect, useState } from "react";
import {
  BookOpen,
  Lightbulb,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { BigButton } from "../components/Button";
import { Card } from "../components/bits";
import { SceneArt } from "../components/illustrations";
import {
  STORY_EPISODES,
  type StoryEpisode,
  type StoryNode,
} from "../data/story";
import { useApp } from "../state";

function playSoundFeedback(type: "success" | "alert") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.18); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(310, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    /* AudioContext not allowed or not supported */
  }
}

export function StoryScreen() {
  const { t, uiLang, speakIfOn, isSpeaking, stopSpeaking } = useApp();

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>("prize");
  const currentEpisode: StoryEpisode =
    STORY_EPISODES.find((ep) => ep.id === selectedEpisodeId) || STORY_EPISODES[0];

  const [nodeId, setNodeId] = useState<string>(currentEpisode.startNode);

  const node: StoryNode | undefined =
    currentEpisode.nodes.find((entry) => entry.id === nodeId) || currentEpisode.nodes[0];

  const endingId = currentEpisode.endingsByNode[nodeId];
  const ending = endingId ? currentEpisode.endings[endingId] : undefined;

  /* Read each scene aloud as the reader advances if voice is enabled. */
  useEffect(() => {
    const text = node?.text[uiLang];
    if (text) {
      speakIfOn(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, selectedEpisodeId]);

  const handleSelectEpisode = (episode: StoryEpisode) => {
    stopSpeaking();
    setSelectedEpisodeId(episode.id);
    setNodeId(episode.startNode);
  };

  const handleOptionClick = (next: string) => {
    try {
      stopSpeaking();
    } catch {
      /* ignore */
    }
    setNodeId(next);
    try {
      const isNextEnding = currentEpisode.endingsByNode[next];
      if (isNextEnding) {
        const kind = currentEpisode.endings[isNextEnding]?.kind;
        playSoundFeedback(kind === "good" ? "success" : "alert");
      } else {
        playSoundFeedback("success");
      }
    } catch {
      /* sound feedback is optional */
    }
  };

  const handleListenAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (node) {
      speakIfOn(node.text[uiLang]);
    }
  };

  const nextEpisodeIndex =
    (STORY_EPISODES.findIndex((ep) => ep.id === selectedEpisodeId) + 1) % STORY_EPISODES.length;
  const nextEpisode = STORY_EPISODES[nextEpisodeIndex];

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-teal-dark">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm font-extrabold uppercase tracking-wide">
            {uiLang === "kn" ? "ಸಂವಾದಾತ್ಮಕ ಕಥೆಗಳ ಆಟ" : uiLang === "hi" ? "इंटरएक्टिव कहानी का खेल" : "Interactive Stories Game"}
          </span>
        </div>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{t.story.title}</h1>
        <p className="mt-1 text-lg text-navy/80">{t.story.subtitle}</p>
      </header>

      {/* Episode selection cards */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-navy/70">
          {uiLang === "kn" ? "ಕಥೆಯ ಸನ್ನಿವೇಶ ಆಯ್ಕೆಮಾಡಿ:" : uiLang === "hi" ? "कहानी का प्रसंग चुनें:" : "Choose a Scam Scenario:"}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STORY_EPISODES.map((ep) => {
            const isCurrent = ep.id === selectedEpisodeId;
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => handleSelectEpisode(ep)}
                className={`flex flex-col items-start rounded-2xl border-2 p-3 text-left transition-all ${
                  isCurrent
                    ? "border-teal bg-teal-soft shadow-soft"
                    : "border-navy/15 bg-paper hover:border-navy/35 hover:bg-cream/40"
                }`}
              >
                <span className="text-2xl">{ep.icon}</span>
                <span className="mt-1.5 line-clamp-1 text-sm font-extrabold text-navy">
                  {ep.title[uiLang]}
                </span>
                <span className="line-clamp-1 text-xs text-navy/70">{ep.character}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current scene card */}
      {node ? (
        <Card className="overflow-hidden border-2 border-navy/10 shadow-soft">
          <div className="flex items-center justify-between border-b border-navy/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentEpisode.icon}</span>
              <span className="font-extrabold text-navy sm:text-lg">
                {currentEpisode.title[uiLang]}
              </span>
            </div>
            <button
              type="button"
              onClick={handleListenAloud}
              aria-label={isSpeaking ? "Stop Voice" : "Listen in natural voice"}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all sm:text-sm ${
                isSpeaking
                  ? "animate-pulse bg-coral text-white shadow-soft"
                  : "border border-teal bg-teal-soft text-teal-dark hover:bg-teal hover:text-white"
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                  <span>{uiLang === "kn" ? "ನಿಲ್ಲಿಸಿ" : uiLang === "hi" ? "रोकें" : "Stop"}</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  <span>{uiLang === "kn" ? "ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ" : uiLang === "hi" ? "आवाज़ में सुनें" : "Listen Aloud"}</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-4">
            <SceneArt kind={node.art} className="w-full" />
            <p className="mt-4 text-lg font-medium leading-relaxed sm:text-xl">{node.text[uiLang]}</p>
          </div>
        </Card>
      ) : null}

      {/* Ending evaluation or Next Choices */}
      {ending ? (
        <Card
          className={`space-y-4 border-2 shadow-soft ${
            ending.kind === "good" ? "border-teal bg-teal-soft/30" : "border-coral bg-coral-soft/30"
          }`}
        >
          <div className="flex items-start gap-3">
            {ending.kind === "good" ? (
              <ShieldCheck className="h-10 w-10 shrink-0 text-teal-dark" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-10 w-10 shrink-0 text-coral-dark" aria-hidden="true" />
            )}
            <div>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide ${
                  ending.kind === "good" ? "bg-teal text-white" : "bg-coral text-white"
                }`}
              >
                {ending.kind === "good" ? t.story.goodBadge : t.story.badBadge}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{ending.title[uiLang]}</h2>
            </div>
          </div>

          <p className="text-lg leading-relaxed text-navy/90">{ending.text[uiLang]}</p>

          {/* Golden Rule box */}
          <div className="flex items-start gap-3 rounded-2xl border border-sun/60 bg-sun/20 p-4">
            <Lightbulb className="h-6 w-6 shrink-0 text-navy" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-navy/70">
                {uiLang === "kn" ? "ಮುಖ್ಯ ಪಾಠ (ಗೋಲ್ಡನ್ ರೂಲ್)" : uiLang === "hi" ? "मूल सीख (गोल्डन रूल)" : "Golden Rule Takeaway"}
              </p>
              <p className="mt-0.5 font-bold text-navy sm:text-base">
                {ending.goldenRule ? ending.goldenRule[uiLang] : currentEpisode.goldenRule[uiLang]}
              </p>
            </div>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <BigButton
              full
              variant="outline"
              onClick={() => {
                stopSpeaking();
                setNodeId(currentEpisode.startNode);
              }}
              icon={<RotateCcw className="h-5 w-5" />}
            >
              {t.story.restart}
            </BigButton>

            <BigButton
              full
              variant="teal"
              onClick={() => handleSelectEpisode(nextEpisode)}
              icon={<Sparkles className="h-5 w-5" />}
            >
              {uiLang === "kn"
                ? `ಮುಂದಿನ ಕಥೆ: ${nextEpisode.title[uiLang]}`
                : uiLang === "hi"
                  ? `अगली कहानी: ${nextEpisode.title[uiLang]}`
                  : `Next: ${nextEpisode.title[uiLang]}`}
            </BigButton>
          </div>
        </Card>
      ) : node ? (
        <div className="space-y-3">
          <p className="text-sm font-bold text-navy/70">
            {uiLang === "kn" ? "ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?" : uiLang === "hi" ? "आप क्या करेंगे?" : "What would you do?"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {node.options.map((option) => (
              <BigButton
                key={option.next}
                full
                variant="outline"
                onClick={() => handleOptionClick(option.next)}
              >
                {option.label[uiLang]}
              </BigButton>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
