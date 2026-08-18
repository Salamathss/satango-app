import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { generateSimilarQuestion, SimilarQuestionResponse } from "@/services/aiSimilarQuestion";
import { CheckCircle2, XCircle, Terminal, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { playSuccessSound, playErrorSound } from "@/utils/audio";

interface SolveSimilarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalQuestion: {
    question_text: string;
    options: string[];
    correct_answer: number;
  } | null;
}

const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse pt-4">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-md bg-muted border border-divider flex items-center justify-center">
        <HelpCircle className="w-4 h-4 text-muted-foreground animate-bounce" />
      </div>
      <div className="space-y-1.5 flex-1">
        <div className="h-2.5 bg-muted rounded-sm w-3/4" />
        <div className="h-2 bg-muted rounded-sm w-1/2" />
      </div>
    </div>
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-12 bg-muted rounded-xl w-full" />
    ))}
  </div>
);

export const SolveSimilarDialog = ({
  open,
  onOpenChange,
  originalQuestion,
}: SolveSimilarDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<SimilarQuestionResponse | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!open || !originalQuestion) return;

    const loadQuestion = async () => {
      setLoading(true);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuestion(null);

      try {
        const res = await generateSimilarQuestion({
          question_text: originalQuestion.question_text,
          options: originalQuestion.options,
          correct_answer: originalQuestion.correct_answer,
        });
        setQuestion(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [open, originalQuestion]);

  const handleAnswer = (index: number) => {
    if (showResult || !question) return;
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === question.correct_answer) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } });
      playSuccessSound();
    } else {
      playErrorSound();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto pb-10">
        <SheetHeader className="border-b border-border/50 pb-3">
          <SheetTitle className="text-lg font-black flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            Similar Practice
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <SkeletonLoader />
        ) : question ? (
          <div className="space-y-6 pt-4 animate-spring-in">
            <div className="space-y-2">
              <span className="text-[10px] bg-primary/10 text-primary font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Practice Mode
              </span>
              <h3 className="text-base font-bold leading-snug tracking-tight text-foreground">
                {question.question_text}
              </h3>
            </div>

            <div className="space-y-2.5">
              {question.options.map((option, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrect = i === question.correct_answer;
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={showResult}
                    className={cn(
                      "w-full p-4 rounded-2xl text-left text-xs font-semibold border-2 transition-all min-h-[56px]",
                      !showResult && "bg-card border-border hover:border-primary",
                      showResult && isCorrect && "bg-primary/10 border-primary font-bold",
                      showResult && isSelected && !isCorrect && "bg-destructive/10 border-destructive",
                      showResult && !isSelected && !isCorrect && "opacity-50 border-border bg-card"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center text-xs font-extrabold shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {showResult && (
              <div className="bg-card rounded-2xl p-4 border border-border/50 space-y-2 animate-spring-in">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Explanation
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {question.explanation}
                </p>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="w-full h-10 rounded-xl text-xs font-bold mt-2"
                >
                  Close Practice
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground space-y-2">
            <XCircle className="w-8 h-8 mx-auto text-destructive/40" />
            <p className="text-sm font-bold">Failed to load question</p>
            <p className="text-xs">Please close the panel and try again.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
