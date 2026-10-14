import { useState } from "react";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";
import { BigButton } from "../components/Button";
import { Banner, Card, ProgressBar } from "../components/bits";
import { SceneArt } from "../components/illustrations";
import { QUIZ_QUESTIONS } from "../data/quiz";
import { useApp } from "../state";

export function QuizScreen() {
  const { t, uiLang } = useApp();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const total = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[index];
  const answered = selected !== null;
  const isCorrect = answered && selected === question.correctId;

  const select = (optionId: string) => {
    if (answered) return;
    setSelected(optionId);
    if (optionId === question.correctId) setScore((value) => value + 1);
  };

  const next = () => {
    if (index + 1 >= total) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setSelected(null);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const verdict =
      score >= total - 1
        ? t.quiz.scoreHigh
        : score >= Math.ceil(total / 2)
          ? t.quiz.scoreMid
          : t.quiz.scoreLow;
    return (
      <div className="space-y-5">
        <Card className="flex flex-col items-center text-center">
          <PartyPopper className="h-16 w-16 text-teal" aria-hidden="true" />
          <h1 className="mt-3 text-3xl font-extrabold">{t.quiz.scoreTitle}</h1>
          <p className="mt-2 text-xl font-bold">{t.quiz.scoreMessage(score, total)}</p>
          <p className="mt-2 text-lg text-navy/85">{verdict}</p>
          <div className="mt-6 w-full max-w-md">
            <BigButton
              full
              variant="teal"
              onClick={restart}
              icon={<RotateCcw className="h-6 w-6" />}
            >
              {t.quiz.retry}
            </BigButton>
          </div>
        </Card>
      </div>
    );
  }

  const chosenLabel = question.options.find((option) => option.id === selected)?.label[uiLang] ?? "";

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold">{t.quiz.title}</h1>
        <ProgressBar
          value={(index + (answered ? 1 : 0)) / total}
          label={t.quiz.progress(index + 1, total)}
        />
        <p className="text-base font-bold text-navy/75">{t.quiz.progress(index + 1, total)}</p>
      </header>

      <Card className="overflow-hidden">
        <SceneArt kind={question.art} className="w-full" />
        <p className="mt-4 text-lg leading-relaxed">{question.scene[uiLang]}</p>
        <h2 className="mt-3 text-xl font-extrabold">{question.question[uiLang]}</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => {
            const chosen = selected === option.id;
            const correctOption = option.id === question.correctId;
            const variant = !answered
              ? "outline"
              : correctOption
                ? "teal"
                : chosen
                  ? "coral"
                  : "outline";
            return (
              <BigButton
                key={option.id}
                full
                variant={variant}
                disabled={answered && !correctOption && !chosen}
                onClick={() => select(option.id)}
                icon={
                  answered && correctOption ? (
                    <Check className="h-6 w-6" />
                  ) : answered && chosen ? (
                    <X className="h-6 w-6" />
                  ) : undefined
                }
              >
                {option.label[uiLang]}
              </BigButton>
            );
          })}
        </div>
      </Card>

      {answered ? (
        <div className="space-y-4">
          <Banner
            tone={isCorrect ? "success" : "danger"}
            title={isCorrect ? t.quiz.correct : t.quiz.wrong}
          >
            <p className="font-bold">{t.quiz.chose(chosenLabel)}</p>
          </Banner>
          <Card>
            <h3 className="text-lg font-extrabold">{t.quiz.whyLabel}</h3>
            <p className="mt-1 text-lg text-navy/90">{question.explanation[uiLang]}</p>
            <h3 className="mt-4 text-lg font-extrabold">{t.quiz.actionLabel}</h3>
            <p className="mt-1 text-lg text-navy/90">{question.action[uiLang]}</p>
          </Card>
          <BigButton full variant="navy" onClick={next}>
            {index + 1 >= total ? t.quiz.seeScore : t.quiz.next}
          </BigButton>
        </div>
      ) : null}
    </div>
  );
}
