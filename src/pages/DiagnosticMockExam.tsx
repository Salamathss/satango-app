import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DIAGNOSTIC_98_QUESTIONS,
  DiagnosticQuestion,
} from "@/data/diagnosticMock98";
import {
  generatePersonalPlan,
  savePersonalPlan,
  saveDiagnosticProgress,
  getDiagnosticProgress,
  clearDiagnosticProgress,
  PersonalPlan,
  DiagnosticProgressState,
} from "@/services/personalPlanService";
import { DesmosCalculator } from "@/components/DesmosCalculator";
import { MathText } from "@/components/MathText";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  Bookmark,
  EyeOff,
  Calculator,
  BookOpen,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  X,
  Target,
  FileText,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUserErrors } from "@/hooks/useUserErrors";

// Standard timing per module in Digital SAT:
// RW Mod 1: 32 min, RW Mod 2: 32 min, Math Mod 1: 35 min, Math Mod 2: 35 min
const MODULE_DURATIONS: Record<string, number> = {
  "reading_writing_1": 32 * 60,
  "reading_writing_2": 32 * 60,
  "math_1": 35 * 60,
  "math_2": 35 * 60,
};

export default function DiagnosticMockExam() {
  const navigate = useNavigate();
  const { logMultipleErrors } = useUserErrors();

  // Load existing progress if available
  const initialProgress = useMemo(() => getDiagnosticProgress(), []);

  const [currentIndex, setCurrentIndex] = useState<number>(
    initialProgress?.currentIndex ?? 0
  );
  const [answers, setAnswers] = useState<Record<string, number>>(
    initialProgress?.answers ?? {}
  );
  const [flagged, setFlagged] = useState<Record<string, boolean>>(
    initialProgress?.flagged ?? {}
  );
  const [struck, setStruck] = useState<Record<string, Record<number, boolean>>>(
    initialProgress?.struck ?? {}
  );

  const [isDesmosOpen, setIsDesmosOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);

  // Timing state
  const currentQ = DIAGNOSTIC_98_QUESTIONS[currentIndex] || DIAGNOSTIC_98_QUESTIONS[0];
  const moduleKey = `${currentQ.section}_${currentQ.module}`;
  const [timeLeft, setTimeLeft] = useState<number>(
    initialProgress?.timeLeftSeconds ?? (MODULE_DURATIONS[moduleKey] || 32 * 60)
  );

  // Completion / Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planResult, setPlanResult] = useState<PersonalPlan | null>(null);

  // Auto-save progress
  useEffect(() => {
    if (planResult) return;
    saveDiagnosticProgress({
      currentIndex,
      currentSection: currentQ.section,
      currentModule: currentQ.module,
      answers,
      flagged,
      struck,
      timeLeftSeconds: timeLeft,
      startedAt: initialProgress?.startedAt ?? new Date().toISOString(),
      isPaused: isTimerPaused,
    });
  }, [currentIndex, answers, flagged, struck, timeLeft, isTimerPaused, currentQ, planResult, initialProgress]);

  // Timer countdown
  useEffect(() => {
    if (isTimerPaused || planResult) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning("Время модуля истекло! Переходим дальше.");
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerPaused, planResult]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = (optIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIndex,
    }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  const toggleStrike = (optIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setStruck((prev) => {
      const qStruck = prev[currentQ.id] || {};
      return {
        ...prev,
        [currentQ.id]: {
          ...qStruck,
          [optIdx]: !qStruck[optIdx],
        },
      };
    });
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < DIAGNOSTIC_98_QUESTIONS.length - 1) {
      const nextIdx = currentIndex + 1;
      const nextQ = DIAGNOSTIC_98_QUESTIONS[nextIdx];

      // If switching module, update timer
      if (nextQ.section !== currentQ.section || nextQ.module !== currentQ.module) {
        const nextKey = `${nextQ.section}_${nextQ.module}`;
        setTimeLeft(MODULE_DURATIONS[nextKey] || 32 * 60);
        toast.info(`Начало: ${nextQ.section === "reading_writing" ? "Reading & Writing" : "Math"} — Module ${nextQ.module}`);
      }

      setCurrentIndex(nextIdx);
    } else {
      setIsReviewModalOpen(true);
    }
  };

  const handleFinishExam = () => {
    setIsSubmitting(true);
    setIsReviewModalOpen(false);

    // Auto-save all mistakes to Mistake Vault
    const wrongQuestions: any[] = [];
    for (const q of DIAGNOSTIC_98_QUESTIONS) {
      const ans = answers[q.id];
      if (ans === undefined || ans !== q.correct_answer) {
        wrongQuestions.push({
          questionId: q.id,
          question_text: q.question_text,
          topic: q.domain || "General SAT",
          category: q.section,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          source: "diagnostic",
        });
      }
    }
    if (wrongQuestions.length > 0) {
      logMultipleErrors(wrongQuestions);
    }

    setTimeout(() => {
      const generatedPlan = generatePersonalPlan(answers, 1450);
      savePersonalPlan(generatedPlan);
      clearDiagnosticProgress();
      setPlanResult(generatedPlan);
      setIsSubmitting(false);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
    }, 600);
  };

  const answeredCount = Object.keys(answers).length;
  const isAnswered = answers[currentQ.id] !== undefined;
  const isFlagged = Boolean(flagged[currentQ.id]);

  // -------------------------------------------------------------
  // RENDER: RESULTS & PERSONAL STUDY PLAN SCREEN
  // -------------------------------------------------------------
  if (planResult) {
    return (
      <div className="min-h-screen bg-[#11100f] text-neutral-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-amber-500/30">
        <div className="max-w-4xl mx-auto space-y-6 animate-spring-in">
          {/* Top Back to Dashboard */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-xs font-mono-tech uppercase text-neutral-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" /> В дешборд
            </button>
            <span className="font-mono-tech text-xs text-amber-400 font-bold uppercase tracking-widest">
              DIAGNOSTIC ANALYSIS COMPLETE
            </span>
          </div>

          {/* Hero Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-neutral-900 via-[#1c1a18] to-[#251e16] border border-amber-500/40 shadow-2xl relative overflow-hidden text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 text-2xl shadow-lg">
              🎯
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Диагностический мок-тест завершен!
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto leading-relaxed">
              Мы оценили твои ответы на 98 вопросов по алгоритму College Board, определили точность по каждому из 9 модулей и построили индивидуальный план.
            </p>

            {/* Score Big Numbers */}
            <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto pt-4">
              <div className="bg-neutral-950/80 border border-amber-500/30 p-4 rounded-2xl">
                <span className="text-[10px] font-mono-tech text-neutral-400 uppercase block">
                  Общий балл
                </span>
                <span className="text-3xl font-black text-amber-400">
                  {planResult.totalScore}
                </span>
                <span className="text-[10px] text-neutral-500 block">/ 1600</span>
              </div>
              <div className="bg-neutral-950/80 border border-white/10 p-4 rounded-2xl">
                <span className="text-[10px] font-mono-tech text-neutral-400 uppercase block">
                  Reading & Writing
                </span>
                <span className="text-3xl font-black text-white">
                  {planResult.rwScore}
                </span>
                <span className="text-[10px] text-neutral-500 block">/ 800</span>
              </div>
              <div className="bg-neutral-950/80 border border-white/10 p-4 rounded-2xl">
                <span className="text-[10px] font-mono-tech text-neutral-400 uppercase block">
                  Math Section
                </span>
                <span className="text-3xl font-black text-white">
                  {planResult.mathScore}
                </span>
                <span className="text-[10px] text-neutral-500 block">/ 800</span>
              </div>
            </div>
          </div>

          {/* Recommended Starting Unit - The Golden Ticket */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-2 border-amber-500/50 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-mono-tech text-[10px] uppercase font-black">
                ШАГ №1
              </span>
              <span className="font-mono-tech text-xs uppercase text-amber-400 font-bold tracking-wider">
                РЕКОМЕНДОВАННЫЙ СТАРТОВЫЙ ЮНИТ
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {planResult.recommendedUnit.name}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
              {planResult.recommendedUnit.reason}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate(`/unit/${planResult.recommendedUnit.id}`)}
                className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono-tech text-xs uppercase tracking-wider font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition"
              >
                Начать обучение с Unit {planResult.recommendedUnit.id} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Unit-by-Unit Diagnostic Breakdown */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-4">
            <h3 className="text-sm font-mono-tech uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" /> Твоя готовность по юнитам SATango:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {planResult.unitStats.map((u) => (
                <div
                  key={u.unitId}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    u.unitId === planResult.recommendedUnit.id
                      ? "bg-amber-500/10 border-amber-500/40 shadow"
                      : "bg-neutral-950/60 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{u.icon}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">
                        Unit {u.unitId}: {u.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        {u.subtitle}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono-tech text-xs font-black ${
                        u.accuracy >= 80
                          ? "text-emerald-400"
                          : u.accuracy >= 60
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {u.accuracy}%
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {u.correct}/{u.total} верно
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Road Milestones */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-4">
            <h3 className="text-sm font-mono-tech uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" /> Твоя дорожная карта подготовки (~{planResult.estimatedWeeks} недель, {planResult.dailyMinutes} мин/день):
            </h3>
            <div className="space-y-2.5">
              {planResult.milestones.map((m) => (
                <div
                  key={m.week}
                  className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 flex items-start gap-3.5"
                >
                  <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 font-mono-tech text-xs font-black text-amber-400 shrink-0">
                    Неделя {m.week}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white">
                      {m.title}
                    </h4>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final Action Button */}
          <div className="pt-2 text-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto px-8 py-4 bg-white text-neutral-950 rounded-2xl font-mono-tech text-xs uppercase tracking-wider font-extrabold hover:bg-neutral-100 transition shadow-xl"
            >
              Сохранить и перейти в дешборд →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: TESTING INTERFACE (BLUEBOOK STYLE DIGITAL SAT)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#141312] text-neutral-100 flex flex-col justify-between font-sans selection:bg-amber-500/30 select-none">
      {/* 1. TOP STATUS BAR */}
      <header className="h-14 border-b border-white/10 bg-[#171615] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
        {/* Left section/module info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm("Прогресс сохранен в браузере! Вы можете вернуться в любое время. Выйти в дешборд?")) {
                navigate("/dashboard");
              }
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline font-mono-tech">Выход</span>
          </button>

          <div className="border-l border-white/10 pl-3">
            <div className="text-[10px] font-mono-tech uppercase tracking-wider text-amber-400 font-bold">
              {currentQ.section === "reading_writing" ? "Reading & Writing" : "Math"}
            </div>
            <div className="text-xs font-extrabold text-white">
              Module {currentQ.module} · Вопрос {currentQ.number}
            </div>
          </div>
        </div>

        {/* Center Timer */}
        <div className="flex items-center gap-2">
          {!hideTimer ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-neutral-900 border border-white/15 text-xs font-mono-tech font-bold text-white shadow-inner">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          ) : (
            <div className="text-xs text-neutral-500 font-mono-tech italic">
              Таймер скрыт
            </div>
          )}

          <button
            onClick={() => setHideTimer(!hideTimer)}
            className="text-[10px] font-mono-tech uppercase text-neutral-400 hover:text-white px-2 py-1 rounded border border-white/10"
          >
            {hideTimer ? "Показать" : "Скрыть"}
          </button>

          <button
            onClick={() => setIsTimerPaused(!isTimerPaused)}
            title={isTimerPaused ? "Возобновить таймер" : "Поставить на паузу"}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition"
          >
            {isTimerPaused ? (
              <Play className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        </div>

        {/* Right Tools (Desmos, Formulas, Flag) */}
        <div className="flex items-center gap-2">
          {currentQ.section === "math" && (
            <>
              <button
                onClick={() => setIsDesmosOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-mono-tech text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Desmos</span>
              </button>

              <button
                onClick={() => setIsReferenceOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-neutral-300 font-mono-tech text-xs flex items-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Формулы</span>
              </button>
            </>
          )}

          <button
            onClick={toggleFlag}
            className={`px-2.5 py-1 rounded-lg border font-mono-tech text-xs flex items-center gap-1.5 transition ${
              isFlagged
                ? "bg-red-500/20 border-red-500/40 text-red-300"
                : "bg-white/5 border-white/15 text-neutral-400 hover:text-white"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isFlagged ? "fill-red-400" : ""}`} />
            <span className="hidden sm:inline">Флажок</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN TEST CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start overflow-y-auto">
        {/* Left Column: Passage / Question Context */}
        <div className="bg-[#171615] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md h-full min-h-[300px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider">
            <span>Контекст / Задание</span>
            <span className="text-amber-400/80 font-bold">{currentQ.domain}</span>
          </div>

          {currentQ.passage ? (
            <div className="text-sm sm:text-base text-neutral-200 leading-relaxed font-serif whitespace-pre-line">
              <MathText text={currentQ.passage} />
            </div>
          ) : (
            <div className="text-sm sm:text-base text-neutral-200 leading-relaxed font-sans">
              <MathText text={currentQ.question_text} />
            </div>
          )}
        </div>

        {/* Right Column: Question Prompt & Options */}
        <div className="bg-[#171615] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-md">
          {currentQ.passage && (
            <div className="text-sm font-semibold text-white border-b border-white/10 pb-3 leading-snug">
              <MathText text={currentQ.question_text} />
            </div>
          )}

          {/* Multiple choice options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = answers[currentQ.id] === idx;
              const isStruck = Boolean(struck[currentQ.id]?.[idx]);

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group relative ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 shadow-md text-white font-medium"
                      : "bg-neutral-900/80 hover:bg-neutral-900 border-white/10 text-neutral-300"
                  } ${isStruck ? "opacity-35 line-through" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg font-mono-tech text-xs font-black flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-amber-500 text-neutral-950 border-amber-400"
                          : "bg-white/5 border-white/15 text-neutral-400 group-hover:text-white"
                      }`}
                    >
                      {letter}
                    </div>
                    <span className="text-xs sm:text-sm leading-snug"><MathText text={opt} /></span>
                  </div>

                  {/* Option Strikethrough elimination button */}
                  <button
                    type="button"
                    onClick={(e) => toggleStrike(idx, e)}
                    title="Вычеркнуть вариант"
                    className={`p-1 rounded text-[10px] font-mono-tech uppercase transition ${
                      isStruck
                        ? "text-amber-400 bg-amber-500/10"
                        : "text-neutral-500 hover:text-neutral-300 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {isStruck ? "Восстановить" : "Зачеркнуть"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 3. BOTTOM NAVIGATION BAR */}
      <footer className="h-16 border-t border-white/10 bg-[#171615] px-4 sm:px-6 flex items-center justify-between gap-4 sticky bottom-0 z-30">
        {/* Left Question Indicator & Module Review Grid trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 font-mono-tech text-xs text-white flex items-center gap-2 transition"
          >
            <span>Вопрос {currentIndex + 1} из 98</span>
            <span className="text-[10px] text-amber-400">· Сетка вопросов</span>
          </button>
          <span className="text-xs text-neutral-500 font-mono-tech hidden sm:inline">
            (Отвечено: {answeredCount}/98)
          </span>
        </div>

        {/* Right Prev / Next buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-xl border border-white/15 text-xs font-mono-tech uppercase text-neutral-300 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Назад
          </button>

          {currentIndex < DIAGNOSTIC_98_QUESTIONS.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-mono-tech text-xs uppercase font-extrabold tracking-wider transition flex items-center gap-1.5"
            >
              Далее <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-mono-tech text-xs uppercase font-black tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              Завершить тест <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>

      {/* MODAL: Question Review Grid */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#171615] border border-white/15 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              Обзор ответов мок-теста
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs font-mono-tech">
              Всего вопросов: 98 · Отвечено: {answeredCount} · Без ответа: {98 - answeredCount}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 my-4">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-tech text-neutral-400 border-b border-white/10 pb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500/30 border border-amber-500 inline-block" /> Отвечено
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-neutral-900 border border-white/20 inline-block" /> Нет ответа
              </span>
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-red-400 fill-red-400" /> С флажком
              </span>
            </div>

            {/* Grid of 98 items */}
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2">
              {DIAGNOSTIC_98_QUESTIONS.map((q, idx) => {
                const answered = answers[q.id] !== undefined;
                const isFl = Boolean(flagged[q.id]);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsReviewModalOpen(false);
                    }}
                    className={`h-9 rounded-lg font-mono-tech text-xs font-bold relative flex items-center justify-center border transition ${
                      isCurrent
                        ? "ring-2 ring-white border-transparent"
                        : ""
                    } ${
                      answered
                        ? "bg-amber-500/20 border-amber-500 text-amber-300"
                        : "bg-neutral-900 border-white/15 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {idx + 1}
                    {isFl && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-neutral-300 rounded-xl font-mono-tech text-xs uppercase transition"
            >
              Вернуться к тесту
            </button>
            <button
              onClick={handleFinishExam}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-mono-tech text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? "Формируем личный план..." : "Завершить и построить план"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Desmos Graphing Calculator Component */}
      <DesmosCalculator
        isOpen={isDesmosOpen}
        onClose={() => setIsDesmosOpen(false)}
      />

      {/* Reference Formulas Dialog */}
      <Dialog open={isReferenceOpen} onOpenChange={setIsReferenceOpen}>
        <DialogContent className="max-w-2xl bg-[#171615] border border-white/15 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              Digital SAT Math Reference Formulas
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-neutral-950 rounded-xl border border-white/10 space-y-3 text-xs font-mono-tech leading-relaxed text-neutral-300">
            <div>• Circle: Area = πr², Circumference = 2πr (360° or 2π radians)</div>
            <div>• Rectangle: Area = ℓw</div>
            <div>• Triangle: Area = ½bh, Angles sum to 180°</div>
            <div>• Right Triangle: a² + b² = c² (Pythagorean Theorem)</div>
            <div>• Special 30°-60°-90°: Sides are x, x√3, 2x</div>
            <div>• Special 45°-45°-90°: Sides are s, s, s√2</div>
            <div>• Rectangular Solid: Volume = ℓwh</div>
            <div>• Cylinder: Volume = πr²h</div>
            <div>• Sphere: Volume = (4/3)πr³</div>
            <div>• Cone: Volume = (1/3)πr²h</div>
            <div>• Pyramid: Volume = (1/3)ℓwh</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
