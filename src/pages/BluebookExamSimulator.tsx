// src/pages/BluebookExamSimulator.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DIAGNOSTIC_98_QUESTIONS,
  DiagnosticQuestion,
} from "@/data/diagnosticMock98";
import { BluebookReferenceSheet } from "@/components/bluebook/BluebookReferenceSheet";
import { DesmosCalculator } from "@/components/DesmosCalculator";
import { BluebookScoreReport } from "@/components/bluebook/BluebookScoreReport";
import { MathText } from "@/components/MathText";
import {
  Clock,
  Bookmark,
  Eye,
  EyeOff,
  Calculator,
  BookOpen,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Strikethrough,
  Grid,
  FileText,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface ModuleConfig {
  section: "reading_writing" | "math";
  module: 1 | 2;
  title: string;
  durationSeconds: number;
  questions: DiagnosticQuestion[];
}

export const BluebookExamSimulator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const testId = searchParams.get("testId") || searchParams.get("test") || "diag-98";

  const testTitle = useMemo(() => {
    if (testId === "diag-98" || testId === "full-1") return "Digital SAT Practice Test #1 (Full Exam)";
    if (testId === "full-2") return "Digital SAT Practice Test #2 (Full Exam)";
    if (testId === "sec-math-core" || testId === "math-1") return "Math Section Mock — Module 1 Core";
    if (testId === "sec-math-hard" || testId === "math-2") return "Math Section Mock — Module 2 Advanced";
    if (testId === "sec-rw-core" || testId === "rw-1") return "Reading & Writing Mock — Module 1";
    if (testId === "sec-rw-hard" || testId === "rw-2") return "Reading & Writing Mock — Module 2 Advanced";
    return "Digital SAT Official Practice Test";
  }, [testId]);

  // Build modules based on testId
  const modules: ModuleConfig[] = useMemo(() => {
    const rwM1 = DIAGNOSTIC_98_QUESTIONS.filter(
      (q) => q.section === "reading_writing" && q.module === 1
    );
    const rwM2 = DIAGNOSTIC_98_QUESTIONS.filter(
      (q) => q.section === "reading_writing" && q.module === 2
    );
    const mathM1 = DIAGNOSTIC_98_QUESTIONS.filter(
      (q) => q.section === "math" && q.module === 1
    );
    const mathM2 = DIAGNOSTIC_98_QUESTIONS.filter(
      (q) => q.section === "math" && q.module === 2
    );

    if (testId === "sec-math-core") {
      return [
        {
          section: "math",
          module: 1,
          title: "Section 2: Math — Module 1 Core",
          durationSeconds: 35 * 60,
          questions: mathM1,
        },
      ];
    }
    if (testId === "sec-math-hard") {
      return [
        {
          section: "math",
          module: 2,
          title: "Section 2: Math — Module 2 Advanced",
          durationSeconds: 35 * 60,
          questions: mathM2,
        },
      ];
    }
    if (testId === "sec-rw-core") {
      return [
        {
          section: "reading_writing",
          module: 1,
          title: "Section 1: Reading and Writing — Module 1",
          durationSeconds: 32 * 60,
          questions: rwM1,
        },
      ];
    }
    if (testId === "sec-rw-advanced") {
      return [
        {
          section: "reading_writing",
          module: 2,
          title: "Section 1: Reading and Writing — Module 2",
          durationSeconds: 32 * 60,
          questions: rwM2,
        },
      ];
    }

    // Default: Full 98-question exam (4 modules)
    return [
      {
        section: "reading_writing",
        module: 1,
        title: "Section 1: Reading and Writing — Module 1",
        durationSeconds: 32 * 60,
        questions: rwM1,
      },
      {
        section: "reading_writing",
        module: 2,
        title: "Section 1: Reading and Writing — Module 2",
        durationSeconds: 32 * 60,
        questions: rwM2,
      },
      {
        section: "math",
        module: 1,
        title: "Section 2: Math — Module 1",
        durationSeconds: 35 * 60,
        questions: mathM1,
      },
      {
        section: "math",
        module: 2,
        title: "Section 2: Math — Module 2",
        durationSeconds: 35 * 60,
        questions: mathM2,
      },
    ];
  }, [testId]);

  // Current state
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const currentModule = modules[currentModuleIndex] || modules[0];
  const [questionIndex, setQuestionIndex] = useState(0);
  const currentQuestion = currentModule.questions[questionIndex] || currentModule.questions[0];

  // User input & review state
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [eliminated, setEliminated] = useState<Record<string, Record<number, boolean>>>({});
  const [isEliminatorMode, setIsEliminatorMode] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(currentModule.durationSeconds);
  const [isTimerHidden, setIsTimerHidden] = useState(false);

  // Modals & overlay states
  const [isReviewGridOpen, setIsReviewGridOpen] = useState(false);
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isSectionReviewScreen, setIsSectionReviewScreen] = useState(false);
  const [isBreakScreen, setIsBreakScreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Storage key for saving progress
  const storageKey = `satango_bluebook_${testId}`;

  // Restore progress on mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.marked) setMarked(parsed.marked);
        if (parsed.eliminated) setEliminated(parsed.eliminated);
        if (parsed.questionTimes) setQuestionTimes(parsed.questionTimes);
        if (parsed.currentModuleIndex !== undefined)
          setCurrentModuleIndex(parsed.currentModuleIndex);
        if (parsed.questionIndex !== undefined)
          setQuestionIndex(parsed.questionIndex);
        if (parsed.timeLeft !== undefined) setTimeLeft(parsed.timeLeft);
      }
    } catch {}
  }, [storageKey]);

  // Save progress
  const saveProgress = useCallback(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          currentModuleIndex,
          questionIndex,
          answers,
          marked,
          eliminated,
          questionTimes,
          timeLeft,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {}
  }, [storageKey, currentModuleIndex, questionIndex, answers, marked, eliminated, questionTimes, timeLeft]);

  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Countdown timer interval
  useEffect(() => {
    if (isCompleted || isBreakScreen || isExitConfirmOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto advance to review screen or next module
          setIsSectionReviewScreen(true);
          return 0;
        }
        return prev - 1;
      });

      if (currentQuestion?.id) {
        setQuestionTimes((prev) => ({
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1,
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, isBreakScreen, isExitConfirmOpen, currentQuestion?.id]);

  // Force show timer when under 5 minutes (300 seconds)
  const isTimeCritical = timeLeft > 0 && timeLeft < 300;
  useEffect(() => {
    if (isTimeCritical && isTimerHidden) {
      setIsTimerHidden(false);
    }
  }, [isTimeCritical, isTimerHidden]);

  // Format timer MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Answer handler
  const handleSelectOption = (optIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optIndex,
    }));
  };

  // SPR input handler
  const handleSprInput = (val: string) => {
    // Only allow numbers, '.', and '/'
    const sanitized = val.replace(/[^0-9./-]/g, "");
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: sanitized,
    }));
  };

  // Toggle mark for review
  const handleToggleMark = () => {
    setMarked((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  // Toggle option eliminator strike
  const handleToggleEliminate = (optIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEliminated((prev) => {
      const qElim = prev[currentQuestion.id] || {};
      return {
        ...prev,
        [currentQuestion.id]: {
          ...qElim,
          [optIndex]: !qElim[optIndex],
        },
      };
    });
  };

  // Navigation handlers
  const handleNext = () => {
    if (questionIndex < currentModule.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      // Last question of module -> go to Section Review Screen
      setIsSectionReviewScreen(true);
    }
  };

  const handleBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    setQuestionIndex(idx);
    setIsReviewGridOpen(false);
    setIsSectionReviewScreen(false);
  };

  // Submit current module and advance
  const handleSubmitModule = () => {
    setIsSectionReviewScreen(false);

    // If there is another module in the exam
    if (currentModuleIndex < modules.length - 1) {
      const nextIndex = currentModuleIndex + 1;
      const nextMod = modules[nextIndex];

      // If transitioning from Reading/Writing to Math in full test, trigger 10-minute break
      if (
        currentModule.section === "reading_writing" &&
        nextMod.section === "math"
      ) {
        setIsBreakScreen(true);
      } else {
        setCurrentModuleIndex(nextIndex);
        setQuestionIndex(0);
        setTimeLeft(nextMod.durationSeconds);
      }
    } else {
      // Completed all modules!
      handleFinishExam();
    }
  };

  const handleFinishExam = () => {
    setIsCompleted(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Final score calculation
  const examResults = useMemo(() => {
    let correctRW = 0;
    let totalRW = 0;
    let correctMath = 0;
    let totalMath = 0;

    modules.forEach((mod) => {
      mod.questions.forEach((q) => {
        const userAns = answers[q.id];
        const isCorrect = userAns !== undefined && Number(userAns) === q.correct_answer;

        if (q.section === "reading_writing") {
          totalRW++;
          if (isCorrect) correctRW++;
        } else {
          totalMath++;
          if (isCorrect) correctMath++;
        }
      });
    });

    const rwRatio = totalRW > 0 ? correctRW / totalRW : 0;
    const mathRatio = totalMath > 0 ? correctMath / totalMath : 0;
    const rwScore = totalRW > 0 ? Math.min(800, Math.max(200, Math.round(200 + rwRatio * 600))) : 0;
    const mathScore = totalMath > 0 ? Math.min(800, Math.max(200, Math.round(200 + mathRatio * 600))) : 0;
    const totalScore = rwScore + mathScore;

    return {
      correctRW,
      totalRW,
      correctMath,
      totalMath,
      rwScore,
      mathScore,
      totalScore,
      totalCorrect: correctRW + correctMath,
      totalQuestions: totalRW + totalMath,
    };
  }, [modules, answers]);

  // Clean exit handler
  const handleConfirmExit = () => {
    saveProgress();
    navigate("/mocks");
  };

  // =========================================================================
  // RENDER: Final Exam Summary & Completion Screen
  // =========================================================================
  if (isCompleted) {
    return (
      <BluebookScoreReport
        testTitle={testTitle}
        totalScore={examResults.totalScore}
        rwScore={examResults.rwScore}
        mathScore={examResults.mathScore}
        totalCorrect={examResults.totalCorrect}
        totalQuestions={examResults.totalQuestions}
        correctRW={examResults.correctRW}
        totalRW={examResults.totalRW}
        correctMath={examResults.correctMath}
        totalMath={examResults.totalMath}
        modules={modules}
        answers={answers}
        questionTimes={questionTimes}
        onRetake={() => {
          localStorage.removeItem(storageKey);
          window.location.reload();
        }}
        onExit={() => navigate("/mocks")}
      />
    );
  }

  // =========================================================================
  // RENDER: 10-Minute Break Screen
  // =========================================================================
  if (isBreakScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white text-slate-800 flex flex-col font-sans items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 border border-neutral-200 rounded-lg bg-neutral-50/60 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-700">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Официальный 10-минутный перерыв
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Вы завершили Section 1 (Reading & Writing). Сделайте перерыв, отдохните или перейдите сразу к Section 2 (Math).
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setIsBreakScreen(false);
                const nextIndex = currentModuleIndex + 1;
                setCurrentModuleIndex(nextIndex);
                setQuestionIndex(0);
                setTimeLeft(modules[nextIndex].durationSeconds);
              }}
              className="w-full h-10 px-4 rounded-md bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-mono-tech text-xs font-semibold motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
            >
              Продолжить к Section 2
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Module Review Screen (Before final submission of the module)
  // =========================================================================
  if (isSectionReviewScreen) {
    const unansweredCount = currentModule.questions.filter(
      (q) => answers[q.id] === undefined || answers[q.id] === ""
    ).length;

    return (
      <div className="fixed inset-0 z-50 bg-white text-slate-800 flex flex-col font-sans overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-neutral-200 bg-neutral-50 px-6 flex items-center justify-between shrink-0">
          <span className="text-sm font-semibold text-slate-800 font-mono-tech">
            {currentModule.title}: Review Screen
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-xs font-bold text-slate-800">
              {formatTime(timeLeft)}
            </span>
          </div>
        </header>

        {/* Review body */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-4xl w-full mx-auto space-y-6">
          <div className="border-b border-neutral-200 pb-4 space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Проверьте ответы перед сдачей модуля
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Нажмите на номер любого вопроса, чтобы вернуться к нему и отредактировать ответ.
            </p>
          </div>

          {unansweredCount > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Внимание: у вас осталось <strong>{unansweredCount}</strong> неотвеченных вопросов в этом модуле.
              </span>
            </div>
          )}

          {/* Grid of questions */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
            {currentModule.questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "";
              const isMarked = !!marked[q.id];

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleJumpToQuestion(idx)}
                  className={cn(
                    "h-12 rounded border flex flex-col items-center justify-center relative font-mono-tech text-xs font-bold motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 active:bg-neutral-200",
                    isAnswered
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-800 border-neutral-300 hover:bg-neutral-100"
                  )}
                >
                  {isMarked && (
                    <Bookmark
                      className="w-3 h-3 text-sky-400 fill-sky-400 absolute top-1 right-1"
                    />
                  )}
                  <span>{idx + 1}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-tech text-slate-500 border-t border-neutral-200 pt-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-900 inline-block" />
              <span>Отвечен</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-neutral-300 bg-white inline-block" />
              <span>Пропущен</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
              <span>Помечен для проверки</span>
            </div>
          </div>
        </main>

        {/* Bottom Bar */}
        <footer className="h-14 border-t border-neutral-200 bg-neutral-50 px-6 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setIsSectionReviewScreen(false)}
            className="h-9 px-4 rounded-md border border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200 text-xs font-mono-tech font-semibold text-slate-800 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
          >
            ← Вернуться к вопросам
          </button>

          <button
            type="button"
            onClick={handleSubmitModule}
            className="h-9 px-5 rounded-md bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white text-xs font-mono-tech font-semibold motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
          >
            {currentModuleIndex < modules.length - 1
              ? "Сдать модуль и перейти далее →"
              : "Завершить экзамен →"}
          </button>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Fullscreen College Board Bluebook Exam Workspace
  // =========================================================================
  const isAnsweredCurrent =
    answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== "";
  const isMarkedCurrent = !!marked[currentQuestion.id];
  const qEliminated = eliminated[currentQuestion.id] || {};

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-800 flex flex-col font-sans overflow-hidden select-none">
      {/* 1. TOP BAR */}
      <header className="h-14 border-b border-neutral-200 bg-neutral-50 px-4 sm:px-6 flex items-center justify-between shrink-0">
        {/* Left: Section name & Directions */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
            {currentModule.title}
          </span>
          <button
            type="button"
            onClick={() => setIsDirectionsOpen(true)}
            className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 shrink-0"
          >
            Directions
          </button>
        </div>

        {/* Center: Countdown Timer with Hide/Show */}
        <div className="flex items-center gap-2">
          {!isTimerHidden ? (
            <span
              className={cn(
                "font-mono-tech text-sm sm:text-base font-bold tabular-nums",
                isTimeCritical ? "text-rose-600" : "text-slate-900"
              )}
            >
              {formatTime(timeLeft)}
            </span>
          ) : (
            <span className="font-mono-tech text-xs text-slate-400">••:••</span>
          )}

          {!isTimeCritical && (
            <button
              type="button"
              onClick={() => setIsTimerHidden((prev) => !prev)}
              title={isTimerHidden ? "Show timer" : "Hide timer"}
              className="text-xs text-slate-500 hover:text-slate-800 p-1 rounded motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
            >
              {isTimerHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Right: Tools & Exit */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Reference button (for Math) */}
          {currentModule.section === "math" && (
            <button
              type="button"
              onClick={() => setIsReferenceOpen(true)}
              className="h-8 px-2.5 rounded border border-neutral-300 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-xs font-mono-tech font-semibold text-slate-800 flex items-center gap-1.5 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Reference</span>
            </button>
          )}

          {/* Calculator button (for Math) */}
          {currentModule.section === "math" && (
            <button
              type="button"
              onClick={() => setIsCalculatorOpen(true)}
              className="h-8 px-2.5 rounded border border-neutral-300 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-xs font-mono-tech font-semibold text-slate-800 flex items-center gap-1.5 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
            >
              <Calculator className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Calculator</span>
            </button>
          )}

          {/* Exit test button */}
          <button
            type="button"
            onClick={() => setIsExitConfirmOpen(true)}
            title="Exit Exam"
            className="h-8 px-2.5 rounded border border-neutral-300 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-xs font-mono-tech text-slate-600 hover:text-slate-900 flex items-center gap-1 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* 2. WORKSPACE */}
      <main className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
        {/* Left Column: Passage / Stimulus for Reading & Writing */}
        {currentModule.section === "reading_writing" ? (
          <>
            <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-6 sm:p-8 border-b md:border-b-0 md:border-r border-neutral-200 bg-white text-slate-800 leading-relaxed text-[15px]">
              <div className="max-w-prose space-y-4">
                {currentQuestion.passage ? (
                  <p className="whitespace-pre-line leading-relaxed font-serif text-slate-900">
                    <MathText text={currentQuestion.passage} />
                  </p>
                ) : (
                  <p className="italic text-slate-500 font-sans text-xs">
                    No passage text required for this question.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Question & Choices */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-6 sm:p-8 bg-white flex flex-col justify-between">
              <div className="space-y-4 max-w-xl">
                {/* Question Header: Question Number, Mark for Review, Eliminator Toggle */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <span className="font-bold text-sm font-mono-tech text-slate-900">
                    Question {questionIndex + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    {/* Option Eliminator toggle */}
                    <button
                      type="button"
                      onClick={() => setIsEliminatorMode((prev) => !prev)}
                      title="Option Eliminator Tool"
                      className={cn(
                        "h-7 px-2 rounded text-xs font-mono-tech flex items-center gap-1 border motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400",
                        isEliminatorMode
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-neutral-300 text-slate-600 hover:bg-neutral-100"
                      )}
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Eliminate</span>
                    </button>

                    {/* Mark for review */}
                    <button
                      type="button"
                      onClick={handleToggleMark}
                      className={cn(
                        "h-7 px-2 rounded text-xs font-mono-tech flex items-center gap-1 border motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400",
                        isMarkedCurrent
                          ? "bg-sky-50 border-sky-300 text-sky-800 font-semibold"
                          : "border-neutral-300 text-slate-600 hover:bg-neutral-100"
                      )}
                    >
                      <Bookmark
                        className={cn(
                          "w-3.5 h-3.5",
                          isMarkedCurrent ? "fill-sky-500 text-sky-500" : "text-slate-500"
                        )}
                      />
                      <span>Mark for Review</span>
                    </button>
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="text-sm font-medium text-slate-900 leading-normal">
                  <MathText text={currentQuestion.question_text} />
                </div>

                {/* Multiple Choices */}
                <div className="space-y-2.5 pt-2">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const letters = ["A", "B", "C", "D"];
                    const letter = letters[oIdx] || String(oIdx);
                    const isSelected = answers[currentQuestion.id] === oIdx;
                    const isStruck = !!qEliminated[oIdx];

                    return (
                      <div
                        key={oIdx}
                        onClick={() => {
                          if (isEliminatorMode) {
                            handleToggleEliminate(oIdx, { stopPropagation: () => {} } as any);
                          } else if (!isStruck) {
                            handleSelectOption(oIdx);
                          }
                        }}
                        className={cn(
                          "group relative p-3 rounded-lg border text-sm flex items-start gap-3 cursor-pointer motion-safe:transition-colors duration-150",
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-800 border-neutral-300 hover:bg-neutral-50",
                          isStruck && "opacity-40 line-through bg-neutral-100"
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5",
                            isSelected
                              ? "bg-white text-slate-900 border-white"
                              : "border-neutral-400 text-slate-700 group-hover:border-slate-800"
                          )}
                        >
                          {letter}
                        </div>
                        <span className="flex-1 leading-relaxed">
                          <MathText text={opt} />
                        </span>

                        {/* Strikethrough manual button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleEliminate(oIdx, e)}
                          title="Eliminate option"
                          className={cn(
                            "opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-800 motion-safe:transition-opacity",
                            isSelected && "text-slate-300 hover:text-white"
                          )}
                        >
                          <Strikethrough className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Math Layout */
          <div className="w-full h-full overflow-y-auto p-6 sm:p-10 max-w-3xl mx-auto flex flex-col justify-between">
            <div className="space-y-5">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <span className="font-bold text-sm font-mono-tech text-slate-900">
                  Question {questionIndex + 1}
                </span>

                <div className="flex items-center gap-3">
                  {currentQuestion.options && currentQuestion.options.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsEliminatorMode((prev) => !prev)}
                      className={cn(
                        "h-7 px-2 rounded text-xs font-mono-tech flex items-center gap-1 border motion-safe:transition-colors",
                        isEliminatorMode
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-neutral-300 text-slate-600 hover:bg-neutral-100"
                      )}
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Eliminate</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleMark}
                    className={cn(
                      "h-7 px-2 rounded text-xs font-mono-tech flex items-center gap-1 border motion-safe:transition-colors",
                      isMarkedCurrent
                        ? "bg-sky-50 border-sky-300 text-sky-800 font-semibold"
                        : "border-neutral-300 text-slate-600 hover:bg-neutral-100"
                    )}
                  >
                    <Bookmark
                      className={cn(
                        "w-3.5 h-3.5",
                        isMarkedCurrent ? "fill-sky-500 text-sky-500" : "text-slate-500"
                      )}
                    />
                    <span>Mark for Review</span>
                  </button>
                </div>
              </div>

              {/* Math Question Text */}
              <div className="text-base font-medium text-slate-900 leading-relaxed font-sans">
                <MathText text={currentQuestion.question_text} />
              </div>

              {/* Multiple Choice Options or Student-Produced Response */}
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <div className="space-y-2.5 pt-2">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const letters = ["A", "B", "C", "D"];
                    const letter = letters[oIdx] || String(oIdx);
                    const isSelected = answers[currentQuestion.id] === oIdx;
                    const isStruck = !!qEliminated[oIdx];

                    return (
                      <div
                        key={oIdx}
                        onClick={() => {
                          if (isEliminatorMode) {
                            handleToggleEliminate(oIdx, { stopPropagation: () => {} } as any);
                          } else if (!isStruck) {
                            handleSelectOption(oIdx);
                          }
                        }}
                        className={cn(
                          "group relative p-3 rounded-lg border text-sm flex items-start gap-3 cursor-pointer motion-safe:transition-colors duration-150",
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-800 border-neutral-300 hover:bg-neutral-50",
                          isStruck && "opacity-40 line-through bg-neutral-100"
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5",
                            isSelected
                              ? "bg-white text-slate-900 border-white"
                              : "border-neutral-400 text-slate-700 group-hover:border-slate-800"
                          )}
                        >
                          {letter}
                        </div>
                        <span className="flex-1 leading-relaxed">
                          <MathText text={opt} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Student-Produced Response Input */
                <div className="pt-4 space-y-2">
                  <label className="text-xs font-mono-tech text-slate-600 block">
                    Student-Produced Response: Enter your answer below
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 3.5 or 7/2"
                    value={String(answers[currentQuestion.id] || "")}
                    onChange={(e) => handleSprInput(e.target.value)}
                    maxLength={7}
                    className="w-full sm:w-64 h-11 px-3.5 rounded border border-neutral-300 font-mono-tech text-base text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                  <p className="text-[11px] text-slate-500 font-sans">
                    Use only numbers, a decimal point (.), or a division slash (/).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. BOTTOM BAR */}
      <footer className="h-14 border-t border-neutral-200 bg-neutral-50 px-4 sm:px-6 flex items-center justify-between shrink-0">
        {/* Left: Question counter */}
        <div className="flex items-center gap-2">
          <span className="font-mono-tech text-xs text-slate-700 font-semibold">
            Question {questionIndex + 1} of {currentModule.questions.length}
          </span>
        </div>

        {/* Center: Review Grid Button */}
        <div>
          <button
            type="button"
            onClick={() => setIsReviewGridOpen(true)}
            className="h-9 px-4 rounded border border-neutral-300 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-xs font-mono-tech font-bold text-slate-800 flex items-center gap-1.5 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
          >
            <Grid className="w-3.5 h-3.5 text-slate-600" />
            <span>Review</span>
          </button>
        </div>

        {/* Right: Back & Next Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={questionIndex === 0}
            className="h-9 px-3 sm:px-4 rounded border border-neutral-300 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-xs font-mono-tech font-semibold text-slate-800 disabled:opacity-40 disabled:pointer-events-none motion-safe:transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="h-9 px-4 sm:px-5 rounded bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-mono-tech font-semibold motion-safe:transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
          >
            <span>{questionIndex < currentModule.questions.length - 1 ? "Next" : "Review Module"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

      {/* MODAL 1: Question Review Grid Popover */}
      {isReviewGridOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-lg border border-neutral-300 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="font-bold text-sm text-slate-900 font-mono-tech">
                {currentModule.title}: Question Navigator
              </span>
              <button
                type="button"
                onClick={() => setIsReviewGridOpen(false)}
                className="w-7 h-7 rounded hover:bg-neutral-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2.5 max-h-[50vh] overflow-y-auto p-1">
              {currentModule.questions.map((q, idx) => {
                const isAns = answers[q.id] !== undefined && answers[q.id] !== "";
                const isMrk = !!marked[q.id];
                const isCurr = idx === questionIndex;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleJumpToQuestion(idx)}
                    className={cn(
                      "h-10 rounded border flex flex-col items-center justify-center relative font-mono-tech text-xs font-bold motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400",
                      isCurr && "ring-2 ring-slate-800",
                      isAns
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-800 border-neutral-300 hover:bg-neutral-100"
                    )}
                  >
                    {isMrk && (
                      <Bookmark className="w-2.5 h-2.5 text-sky-400 fill-sky-400 absolute top-0.5 right-0.5" />
                    )}
                    <span>{idx + 1}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-xs font-mono-tech text-slate-600">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-900 inline-block" />
                  Answered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded border border-neutral-300 inline-block" />
                  Unanswered
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-sky-500 fill-sky-500" />
                  Marked
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Directions Modal */}
      {isDirectionsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg border border-neutral-300 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="font-bold text-sm text-slate-900 font-mono-tech">
                {currentModule.section === "reading_writing"
                  ? "Reading and Writing Directions"
                  : "Math Directions"}
              </span>
              <button
                type="button"
                onClick={() => setIsDirectionsOpen(false)}
                className="w-7 h-7 rounded hover:bg-neutral-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-2.5 font-sans leading-relaxed">
              {currentModule.section === "reading_writing" ? (
                <>
                  <p>
                    The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or other graphic.
                  </p>
                  <p>
                    Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).
                  </p>
                  <p>
                    All questions in this section are multiple-choice with four options. There is only one correct answer to each question.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    The questions in this section address a number of important math skills.
                  </p>
                  <p>
                    Use of an approved calculator is permitted for all questions. A built-in graphing calculator is available by clicking Calculator in the top right.
                  </p>
                  <p>
                    Unless a question specifies otherwise, the domain of any function f is the set of all real numbers x for which f(x) is a real number.
                  </p>
                </>
              )}
            </div>

            <div className="border-t border-neutral-200 pt-3 text-right">
              <button
                type="button"
                onClick={() => setIsDirectionsOpen(false)}
                className="h-8 px-4 rounded bg-slate-900 text-white font-mono-tech text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Exit Confirmation */}
      {isExitConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg border border-neutral-300 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              Покинуть симулятор экзамена?
            </h3>
            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              Ваш текущий прогресс и таймер будут сохранены локально. Вы сможете вернуться и продолжить тест в любое удобное время.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsExitConfirmOpen(false)}
                className="h-8 px-3.5 rounded border border-neutral-300 hover:bg-neutral-100 text-xs font-mono-tech font-semibold text-slate-800"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono-tech font-semibold"
              >
                Сохранить и выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Sheet Dialog */}
      <BluebookReferenceSheet
        isOpen={isReferenceOpen}
        onClose={() => setIsReferenceOpen(false)}
      />

      {/* Desmos Graphing Calculator Dialog */}
      <DesmosCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
};

export default BluebookExamSimulator;
