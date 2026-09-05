import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SAT_TOPICS } from "@/lib/topics";
import { SAT_MODULES } from "@/lib/modules";
import { getUnitLevels } from "@/lib/unitLevels";
import { cn } from "@/lib/utils";
import { ArrowLeft, Clock, Zap, Gem, CheckCircle2, XCircle, Lightbulb, Timer, Heart, RefreshCw, Shield, EyeOff, Highlighter, Sparkles } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { playSuccessSound, playErrorSound } from "@/utils/audio";
import AITutorDialog from "@/components/AITutorDialog";
import { SolveSimilarDialog } from "@/components/SolveSimilarDialog";
import DifficultyIndicator from "@/components/DifficultyIndicator";
import HeartsDisplay from "@/components/HeartsDisplay";
import TheorySlides from "@/components/TheorySlides";
import { useHearts } from "@/hooks/useHearts";
import GemAnimation from "@/components/GemAnimation";
import WatchVideoHeart from "@/components/WatchVideoHeart";
import UnitMasteryModal from "@/components/UnitMasteryModal";
import { useUserErrors } from "@/hooks/useUserErrors";
import { getFallbackQuestions } from "@/data/mockSatQuestions";
import { DesmosCalculator } from "@/components/DesmosCalculator";

type Difficulty = "easy" | "medium" | "hard";
const DIFFICULTY_MAP: Record<number, Difficulty> = { 1: "easy", 2: "medium", 3: "hard" };
const XP_MULTIPLIER: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 40 };
const GEM_MULTIPLIER: Record<Difficulty, number> = { easy: 5, medium: 7, hard: 10 };

const Quiz = () => {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hearts, maxHearts, canPlay, loseHeart, refillWithGems, gemRefillCost, gems } = useHearts();
  const { logError } = useUserErrors();

  const category = searchParams.get("category") || "math";
  const moduleParam = searchParams.get("module");
  const levelParam = searchParams.get("level");
  const levelType = searchParams.get("type"); // "theory" | "practice" | "boss"
  const theoryTopicParam = searchParams.get("topic");
  const isReview = searchParams.get("review") === "true";
  const moduleNum = moduleParam ? parseInt(moduleParam) : null;
  const levelNum = levelParam ? parseInt(levelParam) : null;
  const currentModule = moduleNum ? SAT_MODULES.find((m) => m.id === moduleNum) : null;
  const currentLevel = moduleNum && levelNum ? getUnitLevels(moduleNum).find(l => l.id === levelNum) : null;
  const topic = SAT_TOPICS.find((t) => t.id === topicId);

  const isBossLevel = levelType === "boss";

  const [phase, setPhase] = useState<"select" | "theory" | "quiz">(levelType === "theory" ? "theory" : "select");
  const [mode, setMode] = useState<"casual" | "focus">("casual");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [xpEarned, setXpEarned] = useState(0);
  const [gemsEarned, setGemsEarned] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showAITutor, setShowAITutor] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showMasteryModal, setShowMasteryModal] = useState(false);
  const [unitMastered, setUnitMastered] = useState(false);
  // Boss level: collect wrong answers for post-quiz AI review
  const [bossWrongAnswers, setBossWrongAnswers] = useState<Array<{ question: any; userAnswer: number }>>([]);
  const [bossReviewIndex, setBossReviewIndex] = useState(0);
  const [struckOptions, setStruckOptions] = useState<Record<number, boolean>>({});
  const [highlights, setHighlights] = useState<string[]>([]);
  const [showSimilar, setShowSimilar] = useState(false);

  // Adaptive difficulty state
  const [difficultyAnchor, setDifficultyAnchor] = useState(1);
  const [difficultyChanged, setDifficultyChanged] = useState<"up" | "down" | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [incorrectStreak, setIncorrectStreak] = useState(0);

  const difficulty = DIFFICULTY_MAP[difficultyAnchor] || "easy";
  const questionCount = isBossLevel ? 15 : (mode === "casual" ? 12 : 15);

  // Review mode: reduced rewards, no heart loss
  const effectivePracticeMode = isPracticeMode || isReview;
  const [sessionAnswers, setSessionAnswers] = useState<Array<{ question: any; isCorrect: boolean }>>([]);

  useEffect(() => {
    if (!user || phase !== "quiz") return;
    (async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("difficulty_anchor, current_streak")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setDifficultyAnchor(data.difficulty_anchor || 1);
        setCorrectStreak(data.current_streak || 0);
      }
    })();
  }, [user, phase]);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", topicId, mode, phase, moduleNum, isBossLevel],
    queryFn: async () => {
      try {
        if (moduleNum) {
          let query = supabase
            .from("questions")
            .select("*")
            .eq("module", moduleNum);

          // Boss levels: only difficulty 3
          if (isBossLevel) {
            query = query.eq("difficulty", 3);
          }

          const { data, error } = await query.limit(questionCount * 2);
          if (error) throw error;

          let combined = data || [];
          // If boss level didn't get enough hard questions, fetch any
          if (isBossLevel && combined.length < questionCount) {
            const { data: fallback } = await supabase
              .from("questions")
              .select("*")
              .eq("module", moduleNum)
              .limit(questionCount);
            combined = fallback || combined;
          }
          for (let i = combined.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combined[i], combined[j]] = [combined[j], combined[i]];
          }
          return combined.slice(0, questionCount);
        }

        // Legacy topic-based fetching
        const easyCount = Math.round(questionCount * 0.2);
        const hardCount = Math.round(questionCount * 0.2);
        const mediumCount = questionCount - easyCount - hardCount;

        const fetchByDifficulty = async (diff: number, limit: number) => {
          const { data } = await supabase
            .from("questions")
            .select("*")
            .eq("topic", topicId!)
            .eq("category", category)
            .eq("difficulty", diff)
            .limit(limit);
          return data || [];
        };

        const [easy, medium, hard] = await Promise.all([
          fetchByDifficulty(1, easyCount),
          fetchByDifficulty(2, mediumCount),
          fetchByDifficulty(3, hardCount),
        ]);

        let combined = [...easy, ...medium, ...hard];

        if (combined.length < questionCount) {
          const { data: fallback } = await supabase
            .from("questions")
            .select("*")
            .eq("topic", topicId!)
            .eq("category", category)
            .limit(questionCount);
          combined = fallback || combined;
        }

        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        return combined.slice(0, questionCount);
      } catch (err) {
        console.warn("Exception fetching quiz questions, falling back to local SAT questions:", err);
        return getFallbackQuestions(moduleNum, topicId, questionCount);
      }
    },
    enabled: phase === "quiz" && (!!topicId || !!moduleNum),
  });

  useEffect(() => {
    const list = (questions && questions.length > 0)
      ? questions
      : (phase === "quiz" && !isLoading ? getFallbackQuestions(moduleNum, topicId, questionCount) : []);

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
  }, [questions, phase, isLoading, moduleNum, topicId, questionCount]);

  // Reset strikethrough and highlights on question change
  useEffect(() => {
    setStruckOptions({});
    setHighlights([]);
  }, [currentIndex]);

  const handleHighlight = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    const selection = window.getSelection();
    if (!selection) return;
    const selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
      if (!highlights.includes(selectedText)) {
        setHighlights((prev) => [...prev, selectedText]);
      }
      selection.removeAllRanges();
    } else {
      toast.info("Highlight text by selecting words in the question first!");
    }
  };

  const renderQuestionText = (text: string) => {
    if (!text) return "Practice Question";
    if (highlights.length === 0) return text;

    let result = text;
    const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);

    sortedHighlights.forEach((hl) => {
      const escapedHl = hl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedHl})`, 'gi');
      result = result.replace(regex, `<mark class="bg-yellow-200 dark:bg-yellow-500/30 text-inherit px-0.5 rounded">$1</mark>`);
    });

    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  useEffect(() => {
    if (!difficultyChanged) return;
    const timer = setTimeout(() => setDifficultyChanged(null), 2500);
    return () => clearTimeout(timer);
  }, [difficultyChanged]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleAnswerSubmission = (isCorrect: boolean) => {
    // Skip adaptive difficulty for boss levels
    if (isBossLevel) return;

    const newCorrectStreak = isCorrect ? correctStreak + 1 : 0;
    const newIncorrectStreak = isCorrect ? 0 : incorrectStreak + 1;
    setCorrectStreak(newCorrectStreak);
    setIncorrectStreak(newIncorrectStreak);

    if (newCorrectStreak >= 3 && difficultyAnchor < 3) {
      const newAnchor = difficultyAnchor + 1;
      setDifficultyAnchor(newAnchor);
      setDifficultyChanged("up");
      setCorrectStreak(0);
      toast.success("🚀 Level Up!", {
        description: `Difficulty increased to ${DIFFICULTY_MAP[newAnchor]?.charAt(0).toUpperCase()}${DIFFICULTY_MAP[newAnchor]?.slice(1)}. You're on fire!`,
      });
    }

    if (newIncorrectStreak >= 2 && difficultyAnchor > 1) {
      const newAnchor = difficultyAnchor - 1;
      setDifficultyAnchor(newAnchor);
      setDifficultyChanged("down");
      setIncorrectStreak(0);
      toast("🛡️ Support Mode", {
        description: "We've adjusted the difficulty to help you build confidence.",
      });
    }

    if (user) {
      (supabase as any).rpc("up_set_difficulty", {
        _anchor: difficultyAnchor,
        _correct_streak: isCorrect ? newCorrectStreak : 0,
      });
    }
  };

  const handleAnswer = async (answerIndex: number) => {
    if (showResult || !shuffledQuestions.length) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const question = shuffledQuestions[currentIndex];
    if (!question) return;
    const isCorrect = answerIndex === question.correct_answer;

    // Review mode: reduced rewards
    const reviewMultiplier = isReview ? 0.13 : 1; // ~2 gems/xp

    if (isCorrect) {
      const xp = effectivePracticeMode
        ? (isReview ? 2 : 0)
        : (mode === "casual" ? XP_MULTIPLIER[difficulty] : XP_MULTIPLIER[difficulty] * 2);
      const gemReward = effectivePracticeMode
        ? (isReview ? 2 : 0)
        : (mode === "casual" ? GEM_MULTIPLIER[difficulty] : 0);
      setXpEarned((prev) => prev + xp);
      setGemsEarned((prev) => prev + gemReward);
      setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      // Visual and audio feedback for correct answer
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      playSuccessSound();
    } else {
      setScore((prev) => ({ ...prev, total: prev.total + 1 }));

      // Log to user_errors so the question shows up in "Карцер" (skip review mode itself)
      if (!isReview && question?.id) {
        logError(question.id);
      }

      // Boss level: no AI tutor during quiz, collect for post-review
      if (isBossLevel) {
        setBossWrongAnswers(prev => [...prev, { question, userAnswer: answerIndex }]);
      } else {
        setCurrentQuestion(question);
        setShowAITutor(true);
      }

      // No heart loss in practice/review mode
      if (!effectivePracticeMode) await loseHeart();
      // Audio feedback for incorrect answer
      playErrorSound();
    }

    handleAnswerSubmission(isCorrect);
    setSessionAnswers((prev) => [...prev, { question, isCorrect }]);

    if (user) {
      await (supabase as any).rpc("ua_record_answer", {
        _question_id: question.id,
        _selected_answer: answerIndex,
        _mode: isReview ? "casual" : mode,
      });
    }
  };

  const handleNext = () => {
    if (!shuffledQuestions.length) return;

    if (hearts <= 0 && !effectivePracticeMode) {
      setQuizDone(true);
      toast("💔 Out of Hearts!", { description: "Wait for hearts to regenerate or use gems to refill." });
      return;
    }

    if (currentIndex + 1 >= shuffledQuestions.length) {
      finishQuiz();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const finishQuiz = useCallback(async () => {
    setQuizDone(true);
    if (!user) return;

    const isPerfect = score.total > 0 && score.correct === score.total;

    // Practice mode: restore 1 heart if perfect (no XP/gems flow)
    if (isPracticeMode && isPerfect) {
      await (supabase as any).rpc("up_restore_heart");
      toast.success("Perfect practice! +1 Heart restored 💖");
    }

    // Persist adaptive difficulty
    await (supabase as any).rpc("up_set_difficulty", {
      _anchor: difficultyAnchor,
      _correct_streak: correctStreak,
    });

    // Award XP/gems through server-validated complete_level RPC.
    // Mode mapping: review → 'review'; practice → no level write; boss → 'boss'; theory handled elsewhere.
    let firstTime = false;
    if (!isPracticeMode && moduleNum && levelNum) {
      const mode = isReview ? "review" : isBossLevel ? "boss" : "standard";
      const { data: rpcData } = await (supabase as any).rpc("complete_level", {
        _unit_id: moduleNum,
        _level_id: levelNum,
        _score_correct: score.correct,
        _score_total: score.total,
        _mode: mode,
      });
      firstTime = (rpcData as any)?.first_time === true;
      if (isPerfect && !isReview) {
        toast.success("🌟 Perfect Lesson! Double gems earned!");
      }
      if (mode === "boss" && firstTime) {
        toast.success("👑 Boss Level Conquered! +100 XP, +100 Gems!");
      }
    }

    if (!effectivePracticeMode) {
      const tagMap: Record<string, { correct: number; total: number; category: string }> = {};

      for (const item of sessionAnswers) {
        const t = item.question?.topic || topicId || "general";
        const c = item.question?.category || category;
        if (!tagMap[t]) tagMap[t] = { correct: 0, total: 0, category: c };
        tagMap[t].total += 1;
        if (item.isCorrect) tagMap[t].correct += 1;
      }

      for (const [tName, stat] of Object.entries(tagMap)) {
        await (supabase as any).rpc("tp_record_progress", {
          _topic: tName,
          _category: stat.category,
          _correct: stat.correct,
          _total: stat.total,
          _difficulty: difficulty,
        });
      }

      if (Object.keys(tagMap).length === 0 && topicId) {
        await (supabase as any).rpc("tp_record_progress", {
          _topic: topicId,
          _category: category,
          _correct: score.correct,
          _total: score.total,
          _difficulty: difficulty,
        });
      }
    }

    // Module progression bookkeeping — server validates completion via level_progress
    if (moduleNum && levelNum && !isReview) {
      const unitLevels = getUnitLevels(moduleNum);
      const { data: allLevelProgress } = await supabase
        .from("level_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("unit_id", moduleNum);
      const completedLevels = allLevelProgress?.filter((lp: any) => lp.is_completed).length || 0;
      const totalCompleted = completedLevels + (allLevelProgress?.some((lp: any) => lp.level_id === levelNum && lp.is_completed) ? 0 : 1);
      if (totalCompleted >= unitLevels.length) {
        await (supabase as any).rpc("mp_complete_module", { _module: moduleNum });
        setUnitMastered(true);
        setShowMasteryModal(true);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    queryClient.invalidateQueries({ queryKey: ["topic-progress"] });
    queryClient.invalidateQueries({ queryKey: ["module-progress"] });
    queryClient.invalidateQueries({ queryKey: ["level-progress"] });
  }, [user, xpEarned, gemsEarned, score, topicId, category, difficulty, difficultyAnchor, correctStreak, queryClient, moduleNum, levelNum, isPracticeMode, isReview, isBossLevel, effectivePracticeMode, sessionAnswers]);

  // Focus mode timer: Initialize
  useEffect(() => {
    if (mode === "focus" && phase === "quiz" && !quizDone) {
      setTimeLeft(20 * 60);
    }
  }, [mode, phase, quizDone]);

  // Focus mode timer: Tick & Auto-submit
  useEffect(() => {
    if (mode !== "focus" || phase !== "quiz" || quizDone || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          finishQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, phase, quizDone, timeLeft, finishQuiz]);

  // Show toast warning at exactly 5 minutes (300 seconds)
  useEffect(() => {
    if (mode === "focus" && timeLeft === 300) {
      toast.warning("⏳ Only 5 minutes remaining!", {
        description: "Your answers will be automatically submitted when time runs out.",
        duration: 10000,
      });
    }
  }, [timeLeft, mode]);

  const startMode = (selectedMode: "casual" | "focus") => {
    if (!canPlay && !isReview) {
      toast("💔 No Hearts Left!", {
        description: `Hearts regenerate every 30 min, or use ${gemRefillCost} gems to refill.`,
      });
      return;
    }
    setMode(selectedMode);
    setPhase("theory");
  };

  // Auto-start for boss & review from unit detail
  useEffect(() => {
    if ((isBossLevel || isReview) && phase === "select") {
      if (isBossLevel) {
        setMode("focus");
        setPhase("quiz");
      } else if (isReview) {
        setMode("casual");
        setPhase("quiz");
      }
    }
  }, [isBossLevel, isReview, phase]);

  const heartsWarning = hearts <= 2 && hearts > 0 && !effectivePracticeMode
    ? `⚠️ Be careful! You only have ${hearts} heart${hearts === 1 ? "" : "s"} left. Take your time.`
    : null;

  // Mode selection screen
  if (phase === "select") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-lg mx-auto py-8 px-4 space-y-6">
          <button onClick={() => navigate(moduleNum ? `/unit/${moduleNum}` : "/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back</span>
          </button>

          <div className="text-center space-y-2">
            <span className="text-4xl">{currentModule?.icon || topic?.icon}</span>
            <h1 className="text-2xl font-extrabold" style={{ lineHeight: "1.15" }}>
              {currentModule ? currentModule.name : topic?.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {currentModule ? currentModule.subtitle : "Choose your practice mode"}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="bg-card rounded-2xl px-5 py-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] flex items-center gap-3">
              <HeartsDisplay hearts={hearts} maxHearts={maxHearts} />
              {!canPlay && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs font-bold"
                  onClick={async () => {
                    const success = await refillWithGems();
                    if (success) toast.success("Hearts refilled! 💖");
                    else toast.error(`Need ${gemRefillCost} gems to refill.`);
                  }}
                >
                  <Gem className="w-3 h-3 text-gem" />
                  Refill ({gemRefillCost})
                </Button>
              )}
              <WatchVideoHeart hearts={hearts} maxHearts={maxHearts} />
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startMode("casual")}
              disabled={!canPlay}
              className={cn(
                "w-full p-5 rounded-2xl bg-card border-2 border-primary shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.15)] transition-all active:scale-[0.97] text-left",
                !canPlay && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-primary" />
                <h3 className="font-extrabold text-lg">Casual Mode</h3>
              </div>
              <p className="text-sm text-muted-foreground">12-question practice. Earn XP & Gems!</p>
              <div className="flex gap-3 mt-3">
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">Adaptive XP</span>
                <span className="text-xs font-bold bg-gem/10 text-gem px-2 py-1 rounded-full">+ Gems</span>
              </div>
            </button>

            <button
              onClick={() => startMode("focus")}
              disabled={!canPlay}
              className={cn(
                "w-full p-5 rounded-2xl bg-card border-2 border-secondary shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.15)] transition-all active:scale-[0.97] text-left",
                !canPlay && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Timer className="w-6 h-6 text-secondary" />
                <h3 className="font-extrabold text-lg">Focus Mode</h3>
              </div>
              <p className="text-sm text-muted-foreground">20-minute timed module with 15 questions & AI explanations.</p>
              <div className="flex gap-3 mt-3">
                <span className="text-xs font-bold bg-secondary/10 text-secondary px-2 py-1 rounded-full">2× XP</span>
                <span className="text-xs font-bold bg-secondary/10 text-secondary px-2 py-1 rounded-full">AI Tutor</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsPracticeMode(true);
                setMode("casual");
                setPhase("quiz");
              }}
              className="w-full p-5 rounded-2xl bg-card border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-all active:scale-[0.97] text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw className="w-6 h-6 text-muted-foreground" />
                <h3 className="font-extrabold text-lg text-muted-foreground">Practice Mode</h3>
              </div>
              <p className="text-sm text-muted-foreground">Review old topics. No hearts used, no gems earned.</p>
              <div className="flex gap-3 mt-3">
                <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-1 rounded-full">0 Hearts</span>
                <span className="text-xs font-bold bg-destructive/10 text-destructive px-2 py-1 rounded-full">Perfect = +1 ❤️</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Theory slides phase
  if (phase === "theory") {
    const theoryId = theoryTopicParam || currentLevel?.theoryTopic || topicId || "";
    const theoryName = currentLevel?.name || topic?.name || "";
    const theoryIcon = currentModule?.icon || topic?.icon || "📚";

    const handleTheoryComplete = async () => {
      if (levelType === "theory" && user && moduleNum && levelNum) {
        await (supabase as any).rpc("complete_level", {
          _unit_id: moduleNum,
          _level_id: levelNum,
          _score_correct: 0,
          _score_total: 0,
          _mode: "theory",
        });

        queryClient.invalidateQueries({ queryKey: ["level-progress"] });
        queryClient.invalidateQueries({ queryKey: ["user-progress"] });
        navigate(`/unit/${moduleNum}`);
        return;
      }
      setPhase("quiz");
    };

    return (
      <TheorySlides
        topicId={theoryId}
        topicName={theoryName}
        topicIcon={theoryIcon}
        onComplete={handleTheoryComplete}
      />
    );
  }

  // Quiz done screen
  if (quizDone) {
    const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const isPerfect = score.total > 0 && score.correct === score.total;
    const bossFirstTime = isBossLevel && !isReview;
    const displayXP = xpEarned + (isReview ? 0 : (levelNum ? (isBossLevel ? 100 : 20) : 0));
    const displayGems = (isPerfect && !effectivePracticeMode ? gemsEarned * 2 : gemsEarned) + (isReview ? 0 : (levelNum ? (isBossLevel ? 100 : 15) : 0));

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-6 animate-bounce-in">
          <span className="text-6xl block">
            {isBossLevel ? "👑" : isPerfect ? "🌟" : "🎉"}
          </span>
          <h1 className="text-3xl font-extrabold" style={{ lineHeight: "1.1" }}>
            {isReview ? "Review Complete!" : isBossLevel ? "Boss Defeated!" : isPerfect ? "Perfect Score!" : currentLevel ? "Level Complete!" : "Quiz Complete!"}
          </h1>
          {currentLevel && (
            <p className="text-sm text-muted-foreground font-semibold">{currentLevel.name}</p>
          )}
          {isReview && (
            <p className="text-xs text-muted-foreground">Review mode: reduced rewards, no heart loss</p>
          )}
          {isPerfect && !effectivePracticeMode && (
            <p className="text-sm font-bold text-gem">🌟 Perfect Lesson Bonus: Double Gems!</p>
          )}
          {bossFirstTime && (
            <p className="text-sm font-bold text-accent">👑 Boss Bonus: +100 XP, +100 Gems!</p>
          )}
          {isPracticeMode && isPerfect && (
            <p className="text-sm font-bold text-destructive">💖 Perfect practice! +1 Heart restored</p>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
              <p className="text-2xl font-black text-primary">{accuracy}%</p>
              <p className="text-xs text-muted-foreground font-semibold">Accuracy</p>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
              <p className="text-2xl font-black text-xp">+{displayXP}</p>
              <p className="text-xs text-muted-foreground font-semibold">XP</p>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
              <Gem className="w-5 h-5 text-gem mx-auto mb-0.5" />
              <p className="text-2xl font-black text-gem">+{displayGems}</p>
              <p className="text-xs text-muted-foreground font-semibold">Gems</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
            <HeartsDisplay hearts={hearts} maxHearts={maxHearts} />
            <p className="text-xs text-muted-foreground font-semibold mt-2">Hearts Remaining</p>
          </div>

          {/* Boss level: post-quiz AI review of wrong answers */}
          {isBossLevel && bossWrongAnswers.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
              <p className="text-sm font-bold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-accent" />
                Review Your Mistakes ({bossReviewIndex + 1}/{bossWrongAnswers.length})
              </p>
              <p className="text-xs text-muted-foreground text-left">
                {bossWrongAnswers[bossReviewIndex]?.question.question_text}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-semibold flex-1"
                  onClick={() => {
                    setCurrentQuestion(bossWrongAnswers[bossReviewIndex].question);
                    setSelectedAnswer(bossWrongAnswers[bossReviewIndex].userAnswer);
                    setShowAITutor(true);
                  }}
                >
                  <Lightbulb className="w-4 h-4" />
                  Ask AI Tutor
                </Button>
                {bossReviewIndex < bossWrongAnswers.length - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBossReviewIndex(i => i + 1)}
                  >
                    Next →
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {moduleNum && (
              <Button onClick={() => navigate(`/unit/${moduleNum}`)} className="w-full h-12 font-bold text-base">
                Back to Unit
              </Button>
            )}
            <Button onClick={() => navigate("/")} variant={moduleNum ? "outline" : "default"} className="w-full h-12 font-bold text-base">
              Back to Dashboard
            </Button>
          </div>
        </div>

        {currentModule && (
          <UnitMasteryModal
            open={showMasteryModal}
            onClose={() => setShowMasteryModal(false)}
            unitName={currentModule.name}
            unitIcon={currentModule.icon}
            colorAccent={currentModule.colorAccent}
          />
        )}
      </div>
    );
  }

  // Loading
  // Loading
  if (isLoading && shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <span className="text-4xl block mb-2">📚</span>
          <p className="font-semibold text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <span className="text-4xl block">📝</span>
          <h2 className="text-xl font-extrabold">No questions yet</h2>
          <p className="text-muted-foreground text-sm">Questions for this topic are coming soon!</p>
          <Button onClick={() => navigate("/")} variant="outline">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const question = shuffledQuestions[currentIndex];
  const options = (question?.options as string[] || []);
  const progress = ((currentIndex + 1) / shuffledQuestions.length) * 100;

  const lastWrong = showResult && selectedAnswer !== null && selectedAnswer !== question?.correct_answer;
  const lastRight = showResult && selectedAnswer === question?.correct_answer;

  return (
    <div className={cn("min-h-screen bg-background flex flex-col safe-top", lastWrong && "animate-shake")}>
      {/* Slim progress bar at very top */}
      <div className="h-1 bg-muted">
        <div
          className={cn("h-full transition-all duration-500", isBossLevel ? "bg-destructive" : "bg-primary")}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(moduleNum ? `/unit/${moduleNum}` : "/")}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center tap-feedback"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm font-bold">
          <button
            onMouseDown={(e) => handleHighlight(e)}
            className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs font-extrabold transition-all flex items-center gap-1 shadow-sm active:scale-95 mr-1"
          >
            <Highlighter className="w-3.5 h-3.5" /> Highlight
          </button>
          {(category === "math" || (question && question.category === "math")) && (
            <button
              onClick={() => setIsDesmosOpen(true)}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 text-xs font-extrabold transition-all flex items-center gap-1 shadow-sm active:scale-95 mr-1"
            >
              <span>🧮</span> Calculator
            </button>
          )}
          {isBossLevel && (
            <span className="text-xs font-bold bg-destructive/10 text-destructive px-2 py-1 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" /> Boss
            </span>
          )}
          {isReview && (
            <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-1 rounded-full">Review</span>
          )}
          <HeartsDisplay hearts={hearts} maxHearts={maxHearts} compact />
          {mode === "focus" && (
            <div className="flex items-center gap-1 text-secondary">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
          <span className="text-muted-foreground text-xs">{currentIndex + 1}/{shuffledQuestions.length}</span>
        </div>
      </div>

      {/* Scrollable question area */}
      <div className="flex-1 overflow-y-auto px-4 pb-40">
        {heartsWarning && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-2.5 text-sm font-semibold text-destructive animate-spring-in mb-4">
            {heartsWarning}
          </div>
        )}

        {mode === "focus" && timeLeft <= 300 && timeLeft > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2.5 text-sm font-semibold text-amber-600 dark:text-amber-400 animate-spring-in mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Only {formatTime(timeLeft)} remaining!</span>
            </span>
          </div>
        )}

        <div className="space-y-5">
          <h2 className="text-xl font-bold leading-snug tracking-tight">{renderQuestionText(question?.question_text)}</h2>
          <div className="space-y-3">
            {options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === question?.correct_answer;
              const isStruck = struckOptions[i];
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (isStruck) return;
                    handleAnswer(i);
                  }}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-3xl text-left font-semibold text-[15px] transition-all duration-300 active:scale-[0.98] border-2 tap-feedback relative group",
                    "min-h-[64px]",
                    isStruck && "opacity-30 line-through",
                    !showResult && !isStruck && "bg-card border-border hover:border-primary",
                    showResult && isCorrect && "bg-primary/10 border-primary animate-correct-glow scale-105",
                    showResult && isSelected && !isCorrect && "bg-destructive/10 border-destructive animate-shake",
                    showResult && !isSelected && !isCorrect && "opacity-50 border-border bg-card"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-2xl bg-muted flex items-center justify-center text-sm font-extrabold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{option}</span>
                    
                    {!showResult && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStruckOptions((prev) => ({
                            ...prev,
                            [i]: !prev[i],
                          }));
                        }}
                        className={cn(
                          "pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          isStruck ? "text-destructive opacity-100 bg-destructive/10" : "text-muted-foreground/45 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        )}
                        title="Strike option"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}

                    {showResult && isCorrect && <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-destructive shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="space-y-3 animate-spring-in">
              {lastWrong && (
                <div className="bg-card rounded-3xl p-4 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-destructive text-sm font-bold">
                    {!effectivePracticeMode && <><Heart className="w-4 h-4" /><span>−1 Heart</span></>}
                    {effectivePracticeMode && <span>Incorrect</span>}
                  </div>
                  {isBossLevel ? (
                    <p className="text-xs text-muted-foreground">Explanations available after the test.</p>
                  ) : (
                    <>
                      {question?.explanation && <p className="text-sm text-muted-foreground">{question.explanation}</p>}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 font-semibold rounded-2xl"
                          onClick={() => { setCurrentQuestion(question); setShowAITutor(true); }}
                        >
                          <Lightbulb className="w-4 h-4" />
                          Ask AI Tutor
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 font-semibold rounded-2xl border-amber-300 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800"
                          onClick={() => { setCurrentQuestion(question); setShowSimilar(true); }}
                        >
                          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/25" />
                          Solve Similar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {lastRight && (
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  {isReview ? (
                    <span>+2 XP, +2 Gems (Review)</span>
                  ) : (
                    <>
                      <span>+{mode === "casual" ? XP_MULTIPLIER[difficulty] : XP_MULTIPLIER[difficulty] * 2} XP</span>
                      {mode === "casual" && <><Gem className="w-4 h-4 text-gem ml-2" /><span className="text-gem">+{GEM_MULTIPLIER[difficulty]}</span></>}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom action button */}
      {showResult && (
        <div className="fixed inset-x-0 bottom-0 px-4 pt-3 pb-6 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
          <Button
            onClick={handleNext}
            className="w-full h-14 rounded-3xl font-extrabold text-base tap-feedback active:scale-[0.97]"
          >
            {currentIndex + 1 >= shuffledQuestions.length ? "Finish" : "Next Question"}
          </Button>
        </div>
      )}

      <AITutorDialog
        open={showAITutor}
        onOpenChange={setShowAITutor}
        question={currentQuestion}
        userSelectedAnswer={selectedAnswer}
        userLevel={difficultyAnchor}
      />

      <DesmosCalculator
        isOpen={isDesmosOpen}
        onClose={() => setIsDesmosOpen(false)}
      />

      <SolveSimilarDialog
        open={showSimilar}
        onOpenChange={setShowSimilar}
        originalQuestion={currentQuestion}
      />
    </div>
  );
};

export default Quiz;
