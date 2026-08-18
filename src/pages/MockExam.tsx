import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import MockExamReport from "@/components/MockExamReport";

interface ExamConfig {
  totalQuestions: number;
  duration: number; // seconds
  categories: string[];
  label: string;
}

const EXAM_CONFIGS: Record<string, ExamConfig> = {
  full: { totalQuestions: 98, duration: 134 * 60, categories: ["reading_writing", "math"], label: "Full SAT Exam" },
  rw: { totalQuestions: 54, duration: 64 * 60, categories: ["reading_writing"], label: "Reading & Writing" },
  math: { totalQuestions: 44, duration: 70 * 60, categories: ["math"], label: "Math Section" },
};

interface ExamAnswer {
  questionId: string;
  questionText: string;
  topic: string;
  category: string;
  difficulty: number;
  options: string[];
  correctAnswer: number;
  selectedAnswer: number | null;
  isCorrect: boolean;
  timeSpent: number;
}

const MockExam = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const examType = searchParams.get("type") || "full";
  const config = EXAM_CONFIGS[examType] || EXAM_CONFIGS.full;

  const [phase, setPhase] = useState<"exam" | "scoring" | "report">("exam");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [report, setReport] = useState<any>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [adaptiveApplied, setAdaptiveApplied] = useState(false);

  const shuffleArr = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Fetch ALL questions filtered by category — we partition by difficulty for adaptive Module 2
  const { data: questionPool, isLoading } = useQuery({
    queryKey: ["mock-exam-pool", examType],
    queryFn: async () => {
      let all: any[] = [];
      for (const cat of config.categories) {
        const { data } = await supabase
          .from("questions")
          .select("*")
          .eq("category", cat)
          .limit(500);
        if (data) all = all.concat(data);
      }
      return all;
    },
    enabled: phase === "exam",
  });

  // Build initial Module 1 (first half) — balanced/medium difficulty
  useEffect(() => {
    if (!questionPool || questionPool.length === 0) return;
    const half = Math.ceil(config.totalQuestions / 2);
    // Module 1 = mostly medium (difficulty 1-2), shuffled
    const mediumPool = questionPool.filter((q: any) => q.difficulty <= 2);
    const fallback = mediumPool.length >= half ? mediumPool : questionPool;
    const module1 = shuffleArr(fallback).slice(0, half);
    // Reserve a placeholder for Module 2; will be filled adaptively
    const module2Placeholder = shuffleArr(questionPool).slice(0, config.totalQuestions - half);
    const initial = [...module1, ...module2Placeholder].map((q: any) => {
      const opts = [...(q.options as string[])];
      const correctText = opts[q.correct_answer];
      const shuffled = shuffleArr(opts);
      return { ...q, options: shuffled, correct_answer: shuffled.indexOf(correctText) };
    });
    setShuffledQuestions(initial);
    setQuestionStartTime(Date.now());
  }, [questionPool]);

  // Timer
  useEffect(() => {
    if (phase !== "exam") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          finishExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const question = shuffledQuestions[currentIndex];
    const isCorrect = answerIndex === question.correct_answer;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

    setAnswers((prev) => [...prev, {
      questionId: question.id,
      questionText: question.question_text,
      topic: question.topic,
      category: question.category,
      difficulty: question.difficulty,
      options: question.options,
      correctAnswer: question.correct_answer,
      selectedAnswer: answerIndex,
      isCorrect,
      timeSpent,
    }]);
  };

  const handleNext = () => {
    const half = Math.ceil(config.totalQuestions / 2);
    const nextIndex = currentIndex + 1;

    // Adaptive Module 2 swap: when crossing from Module 1 → 2, replace the rest of the exam
    // with a Hard / Standard / Easier pool based on Module 1 accuracy.
    if (!adaptiveApplied && nextIndex === half && questionPool && questionPool.length > 0) {
      const mod1Answers = answers.slice(0, half);
      const correct = mod1Answers.filter((a) => a.isCorrect).length;
      const accuracy = mod1Answers.length > 0 ? correct / mod1Answers.length : 0;
      const usedIds = new Set(shuffledQuestions.slice(0, half).map((q: any) => q.id));
      const targetDifficulty = accuracy > 0.7 ? 3 : accuracy < 0.4 ? 1 : 2;
      const pool = questionPool.filter(
        (q: any) => !usedIds.has(q.id) && q.difficulty === targetDifficulty
      );
      const fallback = pool.length >= config.totalQuestions - half
        ? pool
        : questionPool.filter((q: any) => !usedIds.has(q.id));
      const newMod2 = shuffleArr(fallback).slice(0, config.totalQuestions - half).map((q: any) => {
        const opts = [...(q.options as string[])];
        const correctText = opts[q.correct_answer];
        const sh = shuffleArr(opts);
        return { ...q, options: sh, correct_answer: sh.indexOf(correctText) };
      });
      setShuffledQuestions((prev) => [...prev.slice(0, half), ...newMod2]);
      setAdaptiveApplied(true);
      toast(accuracy > 0.7 ? "🔥 Module 2: Hard mode unlocked" : "📘 Module 2 calibrated to your level");
    }

    if (nextIndex >= shuffledQuestions.length) {
      finishExam();
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuestionStartTime(Date.now());
    }
  };

  const finishExam = useCallback(async () => {
    setPhase("scoring");

    const finalAnswers = [...answers];
    for (let i = finalAnswers.length; i < shuffledQuestions.length; i++) {
      const q = shuffledQuestions[i];
      finalAnswers.push({
        questionId: q.id,
        questionText: q.question_text,
        topic: q.topic,
        category: q.category,
        difficulty: q.difficulty,
        options: q.options,
        correctAnswer: q.correct_answer,
        selectedAnswer: null,
        isCorrect: false,
        timeSpent: 0,
      });
    }

    // Compute pacing & weakest topics locally so the premium report always has them
    const pacing: Record<string, { totalTime: number; count: number; avg: number }> = {};
    const topicAgg: Record<string, { correct: number; total: number }> = {};
    for (const a of finalAnswers) {
      const cat = a.category || "general";
      pacing[cat] = pacing[cat] || { totalTime: 0, count: 0, avg: 0 };
      if (a.timeSpent > 0) {
        pacing[cat].totalTime += a.timeSpent;
        pacing[cat].count += 1;
      }
      const topic = a.topic || "general";
      topicAgg[topic] = topicAgg[topic] || { correct: 0, total: 0 };
      topicAgg[topic].total += 1;
      if (a.isCorrect) topicAgg[topic].correct += 1;
    }
    for (const k of Object.keys(pacing)) {
      pacing[k].avg = pacing[k].count > 0 ? Math.round(pacing[k].totalTime / pacing[k].count) : 0;
    }
    const weakSpots = Object.entries(topicAgg)
      .filter(([, v]) => v.total >= 2)
      .map(([topic, v]) => ({
        topic,
        accuracy: Math.round((v.correct / v.total) * 100),
        missed: v.total - v.correct,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 2);

    try {
      const { data, error } = await supabase.functions.invoke("mock-exam-score", {
        body: {
          answers: finalAnswers,
          totalTime: config.duration - timeLeft,
          examType,
        },
      });

      if (error) throw error;
      setReport({ ...data, pacing, weakSpots, examType });
      setPhase("report");
    } catch (e) {
      console.error("Scoring error:", e);
      const correct = finalAnswers.filter((a) => a.isCorrect).length;
      const total = finalAnswers.length;
      // Apple-style fallback: still scale Math & R&W independently onto 200-800
      const scaleSection = (cat: string) => {
        const sec = finalAnswers.filter((a) => a.category === cat);
        if (sec.length === 0) return 0;
        const acc = sec.filter((a) => a.isCorrect).length / sec.length;
        return Math.round(200 + acc * 600);
      };
      const rw = scaleSection("reading_writing");
      const math = scaleSection("math");
      const sectionScores = examType === "full" ? { rw, math } : undefined;
      const estimated = examType === "full"
        ? rw + math
        : examType === "rw" ? rw : math;
      setReport({
        estimatedScore: estimated || Math.round(200 + (correct / total) * 600),
        sectionScores,
        correctCount: correct,
        totalCount: total,
        weakAreas: weakSpots.map((w) => w.topic),
        studyPlan: ["Review incorrect answers and retry"],
        topicBreakdown: {},
        pacing,
        weakSpots,
        examType,
      });
      setPhase("report");
      toast.error("AI analysis unavailable. Showing premium diagnostics.");
    }
  }, [answers, shuffledQuestions, timeLeft, config, examType]);

  // Scoring screen
  if (phase === "scoring") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 animate-pulse">
          <Loader2 className="w-12 h-12 text-gem mx-auto animate-spin" />
          <h2 className="text-xl font-extrabold">AI is analyzing your results...</h2>
          <p className="text-sm text-muted-foreground">Generating your {config.label} report</p>
        </div>
      </div>
    );
  }

  // Report screen
  if (phase === "report" && report) {
    return <MockExamReport report={report} examType={examType} onBack={() => navigate("/exam-center")} />;
  }

  // Loading
  if (isLoading || shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <span className="text-4xl block mb-2">📝</span>
          <p className="font-semibold text-muted-foreground">Loading {config.label}...</p>
        </div>
      </div>
    );
  }

  // Exam view
  const question = shuffledQuestions[currentIndex];
  const options = question.options as string[];
  const progressPercent = ((currentIndex + 1) / shuffledQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto py-4 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground">{config.label}</span>
          <div className="flex items-center gap-3 text-sm font-bold">
            <div className={cn(
              "flex items-center gap-1",
              timeLeft < 300 ? "text-destructive animate-pulse" : "text-secondary"
            )}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <span className="text-muted-foreground">{currentIndex + 1}/{shuffledQuestions.length}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gem rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Question */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {question.category === "math" ? "Math" : "Reading & Writing"}
            </span>
            <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              D{question.difficulty}
            </span>
          </div>
          <h2 className="text-lg font-bold leading-relaxed">{question.question_text}</h2>
          <div className="space-y-2">
            {options.map((option: string, i: number) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === question.correct_answer;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-xl text-left font-semibold text-sm transition-all active:scale-[0.97] border-2",
                    !showResult && "bg-card border-border hover:border-primary hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)]",
                    showResult && isCorrect && "bg-primary/10 border-primary",
                    showResult && isSelected && !isCorrect && "bg-destructive/10 border-destructive",
                    showResult && !isSelected && !isCorrect && "opacity-50 border-border bg-card"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next button */}
        {showResult && (
          <div className="animate-bounce-in">
            <Button onClick={handleNext} className="w-full h-12 font-bold text-base">
              {currentIndex + 1 >= shuffledQuestions.length ? "Finish Exam" : "Next Question"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockExam;
