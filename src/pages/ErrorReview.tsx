import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, Gem, Sparkles, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserErrors, ERROR_REVIEW_BONUS } from "@/hooks/useUserErrors";
import AITutorDialog from "@/components/AITutorDialog";
import { SolveSimilarDialog } from "@/components/SolveSimilarDialog";
import ErrorBoundary from "@/components/ErrorBoundary";
import { toast } from "sonner";

/**
 * ErrorReview — "Карцер" review zone.
 * Loads questions logged in user_errors; clearing them all triggers
 * the +50 Gems completion bonus via useGameEconomy.
 * No hearts are deducted in this mode.
 */
export const ErrorReviewInner = () => {
  const navigate = useNavigate();
  const { errors, pendingCount, clearError, grantQueueCompletionBonus, isLoading } = useUserErrors();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [shuffled, setShuffled] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);

  const questionIds = errors.map((e) => e.question_id);

  const { data: questions } = useQuery({
    queryKey: ["error-review-questions", questionIds.join(",")],
    queryFn: async () => {
      if (questionIds.length === 0) return [];
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .in("id", questionIds);
      if (error) throw error;
      return data || [];
    },
    enabled: questionIds.length > 0,
  });

  useEffect(() => {
    if (!questions) return;
    const sh = questions.map((q: any) => {
      const opts = [...(q.options as string[])];
      const correctText = opts[q.correct_answer];
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      return { ...q, options: opts, correct_answer: opts.indexOf(correctText) };
    });
    setShuffled(sh);
    // Reset review cursor whenever the underlying question set refetches
    // so `shuffled[index]` never reads past the new (possibly smaller) array.
    setIndex(0);
    setSelected(null);
    setShowResult(false);
  }, [questions]);

  // Defensive clamp: if `shuffled` shrinks for any other reason, keep index in bounds.
  useEffect(() => {
    if (shuffled.length > 0 && index >= shuffled.length) {
      setIndex(0);
      setSelected(null);
      setShowResult(false);
    }
  }, [shuffled, index]);

  // Empty state / loaded state
  if (!isLoading && pendingCount === 0 && !completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <span className="text-6xl block">✨</span>
          <h1 className="text-2xl font-extrabold tracking-tight">Clean Slate</h1>
          <p className="text-sm text-muted-foreground">No mistakes pending review. Keep up the great work.</p>
          <Button onClick={() => navigate("/")} className="w-full h-12 rounded-2xl font-bold">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-5 max-w-sm animate-spring-in">
          <span className="text-6xl block">🏆</span>
          <h1 className="text-2xl font-extrabold tracking-tight">Карцер Cleared</h1>
          <p className="text-sm text-muted-foreground">You corrected every logged mistake.</p>
          <div className="bg-card rounded-3xl p-5 border border-border/60 flex items-center justify-center gap-2">
            <Gem className="w-6 h-6 text-gem" />
            <p className="text-2xl font-black text-gem">+{ERROR_REVIEW_BONUS}</p>
            <span className="text-sm text-muted-foreground font-semibold">Completion bonus</span>
          </div>
          <Button onClick={() => navigate("/")} className="w-full h-12 rounded-2xl font-bold">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!shuffled.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <span className="text-4xl block mb-2">📚</span>
          <p className="font-semibold text-muted-foreground">Loading your mistakes…</p>
        </div>
      </div>
    );
  }

  const question = shuffled[index];
  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <span className="text-4xl block mb-2">📚</span>
          <p className="font-semibold text-muted-foreground">Updating your review…</p>
        </div>
      </div>
    );
  }
  const options = question.options as string[];
  const progress = ((index + 1) / shuffled.length) * 100;

  const handleAnswer = async (i: number) => {
    if (showResult) return;
    setSelected(i);
    setShowResult(true);
    if (i === question.correct_answer) {
      await clearError(question.id);
    }
  };

  const handleNext = async () => {
    if (index + 1 >= shuffled.length) {
      if (!bonusClaimed) {
        // Re-check remaining errors directly from DB (scoped to user via RLS)
        const { data } = await supabase
          .from("user_errors" as any)
          .select("id")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "");
        if (!data || data.length === 0) {
          try {
            await grantQueueCompletionBonus();
            setBonusClaimed(true);
            toast.success(`+${ERROR_REVIEW_BONUS} Gems — Карцер cleared!`);
          } catch (e) {
            console.error("Bonus grant failed", e);
            toast.error("Could not award completion bonus. Please refresh.");
          }
        }
      }
      setCompleted(true);
      return;
    }
    setIndex((p) => p + 1);
    setSelected(null);
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      <div className="h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center tap-feedback"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="text-xs font-bold bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Карцер
          </span>
          <span className="text-muted-foreground text-xs">{index + 1}/{shuffled.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-40">
        <p className="text-xs text-muted-foreground font-semibold mb-4">
          No hearts lost. Answer correctly to clear from your error log.
        </p>
        <div className="space-y-5">
          <h2 className="text-xl font-bold leading-snug tracking-tight">{question.question_text}</h2>
          <div className="space-y-3">
            {options.map((option, i) => {
              const isSelected = selected === i;
              const isCorrect = i === question.correct_answer;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-3xl text-left font-semibold text-[15px] transition-all active:scale-[0.98] border-2 tap-feedback min-h-[64px]",
                    !showResult && "bg-card border-border hover:border-primary",
                    showResult && isCorrect && "bg-primary/10 border-primary animate-correct-glow",
                    showResult && isSelected && !isCorrect && "bg-destructive/10 border-destructive",
                    showResult && !isSelected && !isCorrect && "opacity-50 border-border bg-card"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-2xl bg-muted flex items-center justify-center text-sm font-extrabold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrect && <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-destructive shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="space-y-3 animate-spring-in">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-semibold rounded-2xl"
                  onClick={() => setShowTutor(true)}
                >
                  <Lightbulb className="w-4 h-4" />
                  Ask AI Tutor
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-semibold rounded-2xl border-amber-300 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800"
                  onClick={() => setShowSimilar(true)}
                >
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/25" />
                  Solve Similar
                </Button>
              </div>
              {question.explanation && (
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showResult && (
        <div className="fixed inset-x-0 bottom-0 px-4 pt-3 pb-6 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
          <Button
            onClick={handleNext}
            className="w-full h-14 rounded-3xl font-extrabold text-base tap-feedback active:scale-[0.97]"
          >
            {index + 1 >= shuffled.length ? "Finish Review" : "Next"}
          </Button>
        </div>
      )}

      <AITutorDialog
        open={showTutor}
        onOpenChange={setShowTutor}
        question={question}
        userSelectedAnswer={selected}
        userLevel={question.difficulty}
      />

      <SolveSimilarDialog
        open={showSimilar}
        onOpenChange={setShowSimilar}
        originalQuestion={question}
      />
    </div>
  );
};

const ErrorReview = () => (
  <ErrorBoundary>
    <ErrorReviewInner />
  </ErrorBoundary>
);

export default ErrorReview;
