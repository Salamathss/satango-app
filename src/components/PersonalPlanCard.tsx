import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPersonalPlan,
  getDiagnosticProgress,
  clearDiagnosticProgress,
  PersonalPlan,
  DiagnosticProgressState,
} from "@/services/personalPlanService";
import {
  Sparkles,
  Target,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Compass,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const PersonalPlanCard = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PersonalPlan | null>(null);
  const [progress, setProgress] = useState<DiagnosticProgressState | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    setPlan(getPersonalPlan());
    setProgress(getDiagnosticProgress());
  }, []);

  const handleStartExam = () => {
    navigate("/diagnostic-mock");
  };

  const handleResetExam = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Вы уверены, что хотите сбросить текущий прогресс теста?")) {
      clearDiagnosticProgress();
      setProgress(null);
    }
  };

  // -------------------------------------------------------------
  // STATE 1: PLAN ALREADY GENERATED (CLEAN LIGHT-GRAY SLEEK THEME)
  // -------------------------------------------------------------
  if (plan) {
    const scoreDiff = plan.targetScore - plan.totalScore;

    return (
      <>
        <div className="w-full p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/70 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400/80 dark:hover:border-zinc-700 text-foreground shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          {/* Subtle Ambient Depth */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-200/40 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800 pb-4 mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  PERSONAL STUDY PLAN
                </span>
                <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  Твой индивидуальный маршрут к SAT
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetailDialog(true)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-mono-tech font-bold text-zinc-800 dark:text-zinc-200 transition active:scale-95"
              >
                Все юниты ({plan.unitStats.length})
              </button>
              <button
                onClick={handleStartExam}
                title="Пересдать тест"
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-foreground transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Diagnostic Scores Grid (Light Gray Modern Tiles) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 relative z-10">
            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xs">
              <span className="text-[10px] font-mono-tech text-zinc-500 dark:text-zinc-400 uppercase block font-semibold">
                Диагностика
              </span>
              <div className="text-2xl sm:text-3xl font-black text-foreground mt-0.5 tracking-tight">
                {plan.totalScore}
                <span className="text-xs text-muted-foreground font-normal"> / 1600</span>
              </div>
              <span className="text-[10px] font-mono-tech text-muted-foreground">
                RW: {plan.rwScore} · Math: {plan.mathScore}
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xs">
              <span className="text-[10px] font-mono-tech text-zinc-500 dark:text-zinc-400 uppercase block font-semibold">
                Целевой балл
              </span>
              <div className="text-2xl sm:text-3xl font-black text-foreground mt-0.5 tracking-tight">
                {plan.targetScore}
              </div>
              <span className="text-[10px] font-mono-tech text-zinc-700 dark:text-zinc-300 font-bold">
                {scoreDiff > 0 ? `+${scoreDiff} б. до цели` : "Цель достигнута! 🎯"}
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xs">
              <span className="text-[10px] font-mono-tech text-zinc-500 dark:text-zinc-400 uppercase block font-semibold">
                Точность
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight">
                {plan.accuracy}%
              </div>
              <span className="text-[10px] font-mono-tech text-muted-foreground">
                {plan.correctTotal} из 98 верно
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xs">
              <span className="text-[10px] font-mono-tech text-zinc-500 dark:text-zinc-400 uppercase block font-semibold">
                График занятий
              </span>
              <div className="text-2xl sm:text-3xl font-black text-foreground mt-0.5 tracking-tight">
                {plan.dailyMinutes}м
                <span className="text-xs text-muted-foreground font-normal font-mono-tech">/день</span>
              </div>
              <span className="text-[10px] font-mono-tech text-muted-foreground">
                Срок: ~{plan.estimatedWeeks} нед.
              </span>
            </div>
          </div>

          {/* Recommended Unit Highlight Box (Sleek Platinum Tint) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-tech uppercase font-bold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-700 px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-600 shadow-xs">
                  РЕКОМЕНДОВАННЫЙ СТАРТ
                </span>
                <span className="text-xs text-muted-foreground">
                  (зона максимального роста)
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-foreground">
                {plan.recommendedUnit.name}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                {plan.recommendedUnit.reason}
              </p>
            </div>

            <button
              onClick={() => navigate(`/unit/${plan.recommendedUnit.id}`)}
              className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-mono-tech text-xs uppercase tracking-wider font-extrabold flex items-center gap-2 transition shrink-0 shadow-sm active:scale-95"
            >
              Начать с этого юнита <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weak areas quick preview */}
          {plan.priorityWeakSpots && plan.priorityWeakSpots.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1 relative z-10">
              <span className="text-[11px] font-mono-tech text-muted-foreground uppercase font-bold">
                Приоритетные темы:
              </span>
              {plan.priorityWeakSpots.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono-tech text-[10px] font-bold"
                >
                  ⚠ {topic}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Plan Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card text-foreground border border-zinc-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground">
                <Compass className="w-5 h-5 text-foreground" />
                Детальный план подготовки к SAT
              </DialogTitle>
              <DialogDescription className="text-xs font-mono-tech text-muted-foreground">
                Результаты мок-теста от {new Date(plan.completedAt).toLocaleDateString()} · 98 вопросов
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-3">
              <div>
                <h4 className="text-xs font-mono-tech uppercase text-muted-foreground tracking-wider mb-2.5 font-bold">
                  Анализ по юнитам курса:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.unitStats.map((u) => (
                    <div
                      key={u.unitId}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        u.unitId === plan.recommendedUnit.id
                          ? "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-600 shadow-xs"
                          : "bg-muted/40 border-border/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl">{u.icon}</span>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate text-foreground">
                            Unit {u.unitId}: {u.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {u.subtitle}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`text-xs font-mono-tech font-bold ${
                            u.accuracy >= 80
                              ? "text-emerald-600 dark:text-emerald-400"
                              : u.accuracy >= 60
                              ? "text-foreground"
                              : "text-rose-500"
                          }`}
                        >
                          {u.accuracy}%
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono-tech">
                          {u.correct}/{u.total}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-border">
                <button
                  onClick={() => {
                    setShowDetailDialog(false);
                    navigate(`/unit/${plan.recommendedUnit.id}`);
                  }}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl font-mono-tech text-xs font-extrabold uppercase tracking-wider transition shadow-sm"
                >
                  Перейти к рекомендованному Unit {plan.recommendedUnit.id}
                </button>
                <button
                  onClick={() => {
                    setShowDetailDialog(false);
                    navigate("/diagnostic-mock");
                  }}
                  className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-xl font-mono-tech text-xs uppercase transition"
                >
                  Пересдать
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: TEST IN PROGRESS (LIGHT GRAY BANNER)
  // -------------------------------------------------------------
  if (progress) {
    const answeredCount = Object.keys(progress.answers || {}).length;
    const percent = Math.round((answeredCount / 98) * 100);

    return (
      <div className="w-full p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/70 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 text-foreground shadow-xs hover:shadow-md relative overflow-hidden transition-all">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-tech text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
                ДИАГНОСТИКА В ПРОЦЕССЕ
              </span>
              <span className="text-xs text-muted-foreground font-mono-tech font-bold">
                Отвечено {answeredCount} из 98 ({percent}%)
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
              Продолжи диагностику и получи личный план
            </h3>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-200 dark:border-zinc-700 mt-2 p-0.5">
              <div
                className="bg-zinc-900 dark:bg-zinc-200 h-full rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleStartExam}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-mono-tech text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 transition shadow-sm active:scale-95"
            >
              Продолжить (вопрос {progress.currentIndex + 1}) <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetExam}
              title="Начать заново"
              className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-muted-foreground hover:text-rose-500 transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: NOT STARTED YET (LIGHT GRAY AIRY INVITATION)
  // -------------------------------------------------------------
  return (
    <div
      onClick={handleStartExam}
      className="w-full p-6 sm:p-7 rounded-3xl cursor-pointer text-left transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/70 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400/80 dark:hover:border-zinc-700 text-foreground shadow-xs hover:shadow-lg group hover:scale-[1.004] active:scale-[0.99]"
    >
      {/* Subtle depth */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-200/30 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Left icon & text */}
        <div className="flex items-start gap-4 flex-1">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <Target className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300 font-bold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-xs">
                ⚡ 100% БЕСПЛАТНО · 98 ВОПРОСОВ
              </span>
              <span className="font-mono-tech text-[10px] uppercase text-zinc-500 dark:text-zinc-400 tracking-wider font-semibold">
                COLLEGE BOARD STANDARDS
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition">
              Построй свой персональный план подготовки к SAT
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl font-medium">
              Пройди диагностический тест (54 RW + 44 Math). Алгоритм определит твои слабые темы, <span className="text-foreground font-bold underline decoration-zinc-400 decoration-1 underline-offset-2">подскажет рекомендованный юнит</span> и составит пошаговый график.
            </p>

            {/* Micro badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1.5 text-[11px] font-mono-tech font-bold text-muted-foreground">
              <span className="flex items-center gap-1 text-foreground/90 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" /> 54 RW + 44 Math
              </span>
              <span className="flex items-center gap-1 text-foreground/90 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" /> Встроенный Desmos
              </span>
              <span className="flex items-center gap-1 text-foreground/90 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" /> Прогноз балла (400–1600)
              </span>
            </div>
          </div>
        </div>

        {/* Right CTA Button */}
        <div className="w-full md:w-auto shrink-0 flex items-center justify-end">
          <button
            type="button"
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-mono-tech text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2.5 transition shadow-sm group-hover:translate-x-1 active:scale-95"
          >
            <span>Пройти мок-тест</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalPlanCard;
