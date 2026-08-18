import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SAT_MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { ArrowLeft, Clock, Heart, Trophy, XCircle, Zap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getFallbackQuestions } from "@/data/mockSatQuestions";

const JUMP_QUESTION_COUNT = 18;
const JUMP_TIME_SECONDS = 15 * 60;
const JUMP_MAX_HEARTS = 2;
const PASS_THRESHOLD = 0.75;

const JumpTestInner = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const modNum = Math.max(1, Math.min(9, parseInt(moduleId || "1", 10) || 1));
  const mod = SAT_MODULES.find((m) => m.id === modNum) ?? SAT_MODULES[0];

  const [phase, setPhase] = useState<"warning" | "test" | "result">("warning");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [hearts, setHearts] = useState(JUMP_MAX_HEARTS);
  const [timeLeft, setTimeLeft] = useState(JUMP_TIME_SECONDS);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [testDone, setTestDone] = useState(false);
  const [passed, setPassed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["jump-test-questions", modNum],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .lte("module", modNum)
          .gte("module", Math.max(1, modNum - 2))
          .order("difficulty", { ascending: false })
          .limit(50);
        if (error || !data || data.length === 0) {
          console.warn("Supabase fetch failed or empty, using local mock questions fallback.");
          return getFallbackQuestions(modNum, null, JUMP_QUESTION_COUNT);
        }
        const shuffled = [...data];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, JUMP_QUESTION_COUNT);
      } catch (err) {
        console.warn("Exception in queryFn, using local mock questions fallback:", err);
        return getFallbackQuestions(modNum, null, JUMP_QUESTION_COUNT);
      }
    },
    enabled: phase === "test",
  });

  useEffect(() => {
    const list = (questions && questions.length > 0)
      ? questions
      : (phase === "test" && !isLoading ? getFallbackQuestions(modNum, null, JUMP_QUESTION_COUNT) : []);
    
    if (list.length === 0) return;

    const shuffled = list.map((q: any) => {
      const options = [...(q?.options as string[] || [])];
      const correctText = options[q?.correct_answer ?? 0];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      const newCorrectIndex = options.indexOf(correctText);
      return { ...q, options, correct_answer: newCorrectIndex !== -1 ? newCorrectIndex : 0 };
    });
    setShuffledQuestions(shuffled);
  }, [questions, phase, isLoading, modNum]);

  const finishTest = useCallback(
    async (didPass: boolean, finalCorrect: number, finalTotal: number) => {
      setTestDone(true);
      setPassed(didPass);
      if (!user) return;

      try {
        if (didPass) {
          const safeTotal = Math.max(10, finalTotal);
          const safeCorrect = Math.min(finalCorrect, safeTotal);
          const { data, error } = await (supabase as any).rpc("mp_pass_jump_test", {
            _module: modNum,
            _score_correct: safeCorrect,
            _score_total: safeTotal,
          });
          if (error) {
            console.error("mp_pass_jump_test error", error);
            toast.error("Sync issue. Retrying from dashboard.");
          } else if (!(data as any)?.ok) {
            toast.error("Could not unlock module.");
          } else {
            toast.success(`🏆 ${mod.name} Unlocked!`);
          }
        } else {
          await (supabase as any).rpc("mp_fail_jump_test", { _module: modNum });
          toast.error("Jump Test Failed. Try again in 24 hours or use gems.");
        }
      } catch (e) {
        console.error("finishTest exception", e);
      } finally {
        await Promise.allSettled([
          queryClient.invalidateQueries({ queryKey: ["module-progress"] }),
          queryClient.invalidateQueries({ queryKey: ["all-level-progress"] }),
          queryClient.invalidateQueries({ queryKey: ["user-progress"] }),
          refreshProfile(),
        ]);

        if (didPass) {
          setTransitioning(true);
          setTimeout(() => navigate("/", { replace: true }), 1800);
        }
      }
    },
    [user, modNum, mod, queryClient, refreshProfile, navigate]
  );

  useEffect(() => {
    if (phase !== "test" || testDone) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          finishTest(false, score.correct, score.total);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, testDone, finishTest, score.correct, score.total]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleAnswer = (answerIndex: number) => {
    if (showResult || !shuffledQuestions.length) return;
    const question = shuffledQuestions[currentIndex];
    if (!question) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === question.correct_answer;
    if (isCorrect) {
      setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      setScore((prev) => ({ ...prev, total: prev.total + 1 }));
      const newHearts = hearts - 1;
      setHearts(newHearts);
      if (newHearts <= 0) {
        setTimeout(
          () => finishTest(false, score.correct, score.total + 1),
          1000
        );
      }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= shuffledQuestions.length) {
      const finalCorrect = score.correct;
      const finalTotal = score.total;
      const ratio = finalTotal > 0 ? finalCorrect / finalTotal : 0;
      finishTest(ratio >= PASS_THRESHOLD, finalCorrect, finalTotal);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  if (phase === "warning") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <AlertTriangle className="w-16 h-16 text-accent mx-auto" />
          <h1 className="text-2xl font-extrabold" style={{ lineHeight: "1.15" }}>
            Jump Test — {mod.name}
          </h1>
          <div className="bg-card border border-divider rounded-lg p-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              This is a <span className="font-bold text-foreground">high-stakes challenge</span>.
              Prove your mastery to skip ahead.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="border border-divider rounded-md p-2">
                <p className="text-lg font-black font-mono-tech">{JUMP_QUESTION_COUNT}</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Questions</p>
              </div>
              <div className="border border-divider rounded-md p-2">
                <p className="text-lg font-black font-mono-tech">15m</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Time</p>
              </div>
              <div className="border border-divider rounded-md p-2">
                <p className="text-lg font-black flex items-center justify-center gap-0.5 font-mono-tech">
                  {JUMP_MAX_HEARTS} <Heart className="w-4 h-4 text-heart" fill="currentColor" />
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Hearts</p>
              </div>
            </div>
            <p className="text-xs text-heart font-semibold">
              ⚠️ Fail → 24h cooldown or 300 gems to retry
            </p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => setPhase("test")} className="w-full h-12 font-bold text-base gap-2">
              <Zap className="w-5 h-5" />
              Start Jump Test
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full font-semibold">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (testDone) {
    const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-6 animate-scale-in">
          {passed ? (
            <>
              <Trophy className="w-16 h-16 text-accent mx-auto animate-bounce" />
              <h1 className="text-3xl font-extrabold" style={{ lineHeight: "1.1" }}>
                {mod.name} Unlocked! 🎉
              </h1>
              <p className="text-muted-foreground text-sm">
                {transitioning
                  ? `Initializing study roadmap…`
                  : `${mod.name} and all previous units are now unlocked.`}
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-heart mx-auto" />
              <h1 className="text-3xl font-extrabold" style={{ lineHeight: "1.1" }}>
                Not Quite Yet
              </h1>
              <p className="text-muted-foreground">
                Keep practicing! You can retry in 24 hours.
              </p>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-divider bg-card rounded-lg p-4">
              <p className="text-3xl font-black text-primary font-mono-tech">
                {score.correct}/{score.total}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Correct</p>
            </div>
            <div className="border border-divider bg-card rounded-lg p-4">
              <p className="text-3xl font-black font-mono-tech">{accuracy}%</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Accuracy</p>
            </div>
          </div>
          <Button onClick={() => navigate("/", { replace: true })} className="w-full h-12 font-bold text-base">
            {passed && transitioning ? "Loading…" : "Back to Dashboard"}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || shuffledQuestions.length === 0) {
    if (!isLoading && shuffledQuestions.length === 0) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="max-w-sm w-full text-center space-y-4">
            <Zap className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Failed to load questions</h2>
            <p className="text-muted-foreground text-sm">We couldn't retrieve the challenge questions. Please return to the map.</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Back to Roadmap
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-semibold text-muted-foreground">Loading Jump Test...</p>
        </div>
      </div>
    );
  }

  const question = shuffledQuestions[currentIndex];
  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Button onClick={() => navigate("/", { replace: true })}>Back to Dashboard</Button>
      </div>
    );
  }
  const progressPercent = ((currentIndex + 1) / shuffledQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto py-4 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <span className="font-extrabold text-sm">Jump Test — {mod.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: JUMP_MAX_HEARTS }).map((_, i) => (
                <Heart
                  key={i}
                  className={cn(
                    "w-5 h-5 transition-all",
                    i < hearts ? "text-heart" : "text-muted-foreground/30"
                  )}
                  fill={i < hearts ? "currentColor" : "none"}
                />
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm font-bold border border-divider bg-card px-2.5 py-1 rounded-md font-mono-tech">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={timeLeft <= 60 ? "text-heart" : ""}>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground text-center font-semibold font-mono-tech">
          Question {currentIndex + 1} of {shuffledQuestions.length}
        </p>

        <div className="bg-card border border-divider rounded-lg p-5">
          <p className="font-bold text-base leading-relaxed">{question?.question_text || "Challenge Question"}</p>
        </div>

        <div className="space-y-2">
          {(question?.options as string[] || []).map((option: string, idx: number) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === question?.correct_answer;
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={showResult}
                className={cn(
                  "w-full p-4 rounded-lg text-left font-semibold text-sm transition-all active:scale-[0.97]",
                  "border",
                  !showResult && "bg-card border-divider hover:border-foreground/40",
                  showResult && isCorrect && "bg-primary/10 border-primary text-primary",
                  showResult && isSelected && !isCorrect && "bg-heart/10 border-heart text-heart"
                )}
              >
                <span className="font-bold mr-2 text-muted-foreground">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {showResult && hearts > 0 && (
          <Button onClick={handleNext} className="w-full h-12 font-bold text-base">
            {currentIndex + 1 >= shuffledQuestions.length ? "See Results" : "Next Question"}
          </Button>
        )}
      </div>
    </div>
  );
};

const JumpTest = () => (
  <ErrorBoundary>
    <JumpTestInner />
  </ErrorBoundary>
);

export default JumpTest;
