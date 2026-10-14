import { useEffect, useState } from "react";
import { RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { BigButton } from "../components/Button";
import { Card } from "../components/bits";
import { SceneArt } from "../components/illustrations";
import {
  STORY_ENDINGS,
  STORY_ENDINGS_BY_NODE,
  STORY_NODES,
  STORY_START,
} from "../data/story";
import { useApp } from "../state";

export function StoryScreen() {
  const { t, lang, speakIfOn } = useApp();
  const [nodeId, setNodeId] = useState<string>(STORY_START);

  const node = STORY_NODES.find((entry) => entry.id === nodeId);
  const endingId = STORY_ENDINGS_BY_NODE[nodeId];
  const ending = endingId ? STORY_ENDINGS[endingId] : undefined;

  /* Read each scene aloud as the reader advances. */
  useEffect(() => {
    const text = node?.text[lang];
    if (text) speakIfOn(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  if (!node) return null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">{t.story.title}</h1>
        <p className="mt-1 text-lg text-navy/80">{t.story.subtitle}</p>
      </header>

      <Card className="overflow-hidden">
        <SceneArt kind={node.art} className="w-full" />
        <p className="mt-4 text-lg leading-relaxed">{node.text[lang]}</p>
      </Card>

      {ending ? (
        <Card
          className={
            ending.kind === "good" ? "border-2 border-teal" : "border-2 border-coral"
          }
        >
          <div className="flex items-center gap-3">
            {ending.kind === "good" ? (
              <ShieldCheck className="h-10 w-10 shrink-0 text-teal-dark" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-10 w-10 shrink-0 text-coral-dark" aria-hidden="true" />
            )}
            <div>
              <p className="text-sm font-bold text-navy/70">
                {ending.kind === "good" ? t.story.goodBadge : t.story.badBadge}
              </p>
              <h2 className="text-2xl font-extrabold">{ending.title[lang]}</h2>
            </div>
          </div>
          <p className="mt-3 text-lg leading-relaxed">{ending.text[lang]}</p>
          <div className="mt-5">
            <BigButton
              full
              variant="teal"
              onClick={() => setNodeId(STORY_START)}
              icon={<RotateCcw className="h-6 w-6" />}
            >
              {t.story.restart}
            </BigButton>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {node.options.map((option) => (
            <BigButton key={option.next} full variant="outline" onClick={() => setNodeId(option.next)}>
              {option.label[lang]}
            </BigButton>
          ))}
        </div>
      )}
    </div>
  );
}
