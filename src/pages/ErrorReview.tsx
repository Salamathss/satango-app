import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Gem,
  Sparkles,
  Lightbulb,
  ShieldAlert,
  Layers,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserErrors, ERROR_REVIEW_BONUS } from "@/hooks/useUserErrors";
import AITutorDialog from "@/components/AITutorDialog";
import { SolveSimilarDialog } from "@/components/SolveSimilarDialog";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DIAGNOSTIC_98_QUESTIONS } from "@/data/diagnosticMock98";
import { getLocalMistakes } from "@/services/mistakeVaultService";
import { toast } from "sonner";
import confetti from "canvas-confetti";

/**
 * ErrorReview — "Mistake Vault / Карцер" Pro review zone.
 * Automatically loads questions logged from Quizzes, Mock Exams, and Diagnostic Tests.
 * No hearts are deducted in this mode.
 */
export const ErrorReviewInner = () => {
  const navigate = useNavigate();
  const { errors, pendingCount, clearError, grantQueueCompletionBonus, isLoading } = useUserErrors();

  const [filterCategory, setFilterCategory] = useState<"all" | "math" | "reading_writing">("all");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [shuffled, setShuffled] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);

  const questionIds = useMemo(() => errors.map((e) => e.question_id), [errors]);

  const { data: dbQuestions = [] } = useQuery({
    queryKey: ["error-review-questions", questionIds.join(",")],
    queryFn: async () => {
      if (questionIds.length === 0) return [];
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .in("id", questionIds);
      if (error) {
        console.error("Failed to fetch questions from DB:", error);
        return [];
      }
      return data || [];
    },
    enabled: questionIds.length > 0,
  });

  // Combine DB questions, Diagnostic 98 questions, and local mistake vault entries
  const allResolvedQuestions = useMemo(() => {
    const localVault = getLocalMistakes();
    const result: any[] = [];

    for (const qId of questionIds) {
      // 1. Check DB questions
      const fromDb = dbQuestions.find((q: any) => q.id === qId);
      if (fromDb) {
        result.push(fromDb);
        continue;
      }
      // 2. Check diagnostic 98 dataset
      const fromDiag = DIAGNOSTIC_98_QUESTIONS.find((q) => q.id === qId);
      if (fromDiag) {
        result.push({
          id: fromDiag.id,
          question_text: fromDiag.passage ? `${fromDiag.passage}\n\n${fromDiag.question_text}` : fromDiag.question_text,
          options: fromDiag.options,
          correct_answer: fromDiag.correct_answer,
          explanation: fromDiag.explanation,
          category: fromDiag.section,
          topic: fromDiag.topic,
          difficulty: fromDiag.difficulty === "hard" ? 3 : fromDiag.difficulty === "medium" ? 2 : 1,
        });
        continue;
      }
      // 3. Check local vault
      const fromLocal = localVault.find((l) => l.question_id === qId);
      if (fromLocal && fromLocal.question_text && fromLocal.options) {
        result.push({
          id: fromLocal.question_id,
          question_text: fromLocal.question_text,
          options: fromLocal.options,
          correct_answer: fromLocal.correct_answer ?? 0,
          explanation: fromLocal.explanation,
          category: fromLocal.category || "math",
          topic: fromLocal.topic || "general",
          difficulty: 2,
        });
      }
    }
    return result;
  }, [questionIds, dbQuestions]);

  // Apply category filter
  const filteredQuestions = useMemo(() => {
    if (filterCategory === "all") return allResolvedQuestions;
    return allResolvedQuestions.filter((q) => q.category === filterCategory);
  }, [allResolvedQuestions, filterCategory]);

  useEffect(() => {
    if (!filteredQuestions.length) {
      setShuffled([]);
      return;
    }
    const sh = filteredQuestions.map((q: any) => {
      const opts = [...(q.options as string[])];
      const correctText = opts[q.correct_answer];
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      return { ...q, options: opts, correct_answer: opts.indexOf(correctText) };
    });
    setShuffled(sh);
    setIndex(0);
    setSelected(null);
    setShowResult(false);
  }, [filteredQuestions]);

  // Defensive clamp
  useEffect(() => {
    if (shuffled.length > 0 && index >= shuffled.length) {
      setIndex(0);
      setSelected(null);
      setShowResult(false);
    }
  }, [shuffled, index]);

  // Empty state
  if (!isLoading && pendingCount === 0 && !completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm animate-spring-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-3xl">
            ✨
          </div>
          <h1 className="text-2xl font-black tracking-tight">Mistake Vault is Clean</h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            All mistakes from tests and diagnostic sessions have been cleared. Flawless accuracy!
          </p>
          <Button
            onClick={() => navigate("/")}
            className="w-full h-12 rounded-2xl font-bold uppercase tracking-wider text-xs font-mono-tech"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Completion state
  if (completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-5 max-w-sm animate-spring-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 mx-auto flex items-center justify-center text-3xl">
            🏆
          </div>
          <h1 className="text-2xl font-black tracking-tight">Vault Drill Cleared</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            You successfully corrected your logged mistakes.
          </p>
          <div className="bg-card rounded-3xl p-5 border border-amber-500/30 shadow-md flex items-center justify-center gap-2">
            <Gem className="w-6 h-6 text-amber-500 fill-amber-500/40" />
            <p className="text-2xl font-black text-amber-500">+{ERROR_REVIEW_BONUS}</p>
            <span className="text-xs text-muted-foreground font-semibold">Gems Bonus</span>
          </div>
          <Button
            onClick={() => navigate("/")}
            className="w-full h-12 rounded-2xl font-black uppercase text-xs tracking-wider"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!shuffled.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="font-mono-tech text-xs text-muted-foreground">Loading Mistake Vault…</p>
        </div>
      </div>
    );
  }

  const question = shuffled[index];
  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="font-mono-tech text-xs text-muted-foreground">Updating review set…</p>
        </div>
      </div>
    );
  }

  const options = question.options as string[];
  const progressPercent = ((index + 1) / shuffled.length) * 100;

  const handleAnswer = async (i: number) => {
    if (showResult) return;
    setSelected(i);
    setShowResult(true);
    if (i === question.correct_answer) {
      await clearError(question.id);
      toast.success("Correct! Mistake removed from vault 🎯");
    }
  };

  const handleNext = async () => {
    if (index + 1 >= shuffled.length) {
      if (!bonusClaimed) {
        try {
          await grantQueueCompletionBonus();
          setBonusClaimed(true);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          toast.success(`+${ERROR_REVIEW_BONUS} Gems — Vault drill completed!`);
        } catch (e) {
          console.error("Bonus grant error", e);
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
    <div className="min-h-screen bg-background flex flex-col safe-top font-sans">
      {/* Top progress bar */}
      <div className="h-1.5 bg-muted">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Top Bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/60">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-2xl bg-muted/80 flex items-center justify-center tap-feedback hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Header Title & Counter */}
        <div className="flex items-center gap-2">
          <span className="font-mono-tech text-[10px] uppercase tracking-widest font-extrabold bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3" />
            MISTAKE VAULT
          </span>
          <span className="font-mono-tech text-xs text-muted-foreground font-bold">
            {index + 1} / {shuffled.length}
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="px-4 py-2 bg-muted/30 border-b border-border/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="font-mono-tech text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {(["all", "math", "reading_writing"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={cn(
              "px-3 py-1 rounded-xl text-[11px] font-mono-tech font-bold uppercase transition",
              filterCategory === cat
                ? "bg-foreground text-background shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground border border-border/60"
            )}
          >
            {cat === "all" ? "All Mistakes" : cat === "math" ? "Math" : "Reading & Writing"}
          </button>
        ))}
      </div>

      {/* Main Question Scroll Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-40 max-w-2xl mx-auto w-full space-y-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>🛡️ No hearts lost. Answer correctly to resolve.</span>
          {question.topic && (
            <span className="font-mono-tech text-[10px] uppercase bg-muted px-2 py-0.5 rounded border">
              {question.topic}
            </span>
          )}
        </div>

        <div className="space-y-5">
          <h2 className="text-lg sm:text-xl font-black leading-snug tracking-tight text-foreground whitespace-pre-line">
            {question.question_text}
          </h2>

          <div className="space-y-2.5">
            {options.map((option, i) => {
              const isSelected = selected === i;
              const isCorrect = i === question.correct_answer;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left font-semibold text-sm transition-all active:scale-[0.99] border-2 tap-feedback min-h-[58px]",
                    !showResult && "bg-card border-border/80 hover:border-amber-500/50 shadow-sm",
                    showResult && isCorrect && "bg-emerald-500/10 border-emerald-500 text-foreground",
                    showResult && isSelected && !isCorrect && "bg-red-500/10 border-red-500 text-foreground",
                    showResult && !isSelected && !isCorrect && "opacity-50 border-border bg-card"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-muted/90 flex items-center justify-center font-mono-tech text-xs font-black shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="space-y-3 pt-2 animate-spring-in">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-bold rounded-xl text-xs"
                  onClick={() => setShowTutor(true)}
                >
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Socratic AI Coach
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-bold rounded-xl text-xs border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                  onClick={() => setShowSimilar(true)}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Solve Similar Pattern
                </Button>
              </div>

              {question.explanation && (
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/70 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground block mb-1">Explanation:</span>
                  {question.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      {showResult && (
        <div className="fixed inset-x-0 bottom-0 px-4 pt-3 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent safe-bottom border-t border-border/40">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleNext}
              className="w-full h-13 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all active:scale-[0.98]"
            >
              {index + 1 >= shuffled.length ? "Finish Vault Drill" : "Next Mistake"}
            </Button>
          </div>
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
