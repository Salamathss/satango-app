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
  BookOpen,
  Calculator,
  Trophy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  // STATE 1: PLAN ALREADY GENERATED
  // -------------------------------------------------------------
  if (plan) {
    const scoreDiff = plan.targetScore - plan.totalScore;

    return (
      <>
        <div className="w-full p-6 sm:p-7 rounded-3xl bg-card border border-border/80 text-foreground shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/[0.06] dark:bg-amber-400/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-500/[0.05] dark:bg-violet-400/[0.04] rounded-full blur-3xl pointer-events-none" />

          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
                className="px-3.5 py-1.5 rounded-xl bg-card hover:bg-muted/70 border border-border text-xs font-mono-tech font-extrabold text-foreground transition active:scale-95 shadow-2xs"
              >
                Все юниты ({plan.unitStats.length})
              </button>
              <button
                onClick={handleStartExam}
                title="Пересдать тест"
                className="p-2 rounded-xl bg-card hover:bg-muted/70 border border-border text-muted-foreground hover:text-foreground transition active:scale-95 shadow-2xs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Diagnostic Scores Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 relative z-10">
            <div className="bg-muted/40 border border-border/70 p-3.5 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-mono-tech text-violet-700 dark:text-violet-400 uppercase block font-extrabold">
                Диагностика
              </span>
              <div className="text-2xl sm:text-3xl font-black text-foreground mt-0.5 tracking-tight">
                {plan.totalScore}
                <span className="text-xs text-muted-foreground font-normal"> / 1600</span>
              </div>
              <span className="text-[10px] font-mono-tech text-muted-foreground font-semibold">
                RW: {plan.rwScore} · Math: {plan.mathScore}
              </span>
            </div>

            <div className="bg-muted/40 border border-border/70 p-3.5 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-mono-tech text-amber-700 dark:text-amber-400 uppercase block font-extrabold">
                Целевой балл
              </span>
              <div className="text-2xl sm:text-3xl font-black text-foreground mt-0.5 tracking-tight">
                {plan.targetScore}
              </div>
              <span className="text-[10px] font-mono-tech text-amber-700 dark:text-amber-300 font-extrabold">
                {scoreDiff > 0 ? `+${scoreDiff} б. до цели` : "Цель достигнута! 🎯"}
              </span>
            </div>

            <div className="bg-muted/40 border border-border/70 p-3.5 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-mono-tech text-emerald-700 dark:text-emerald-400 uppercase block font-extrabold">
                Точность
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight">
                {plan.accuracy}%
              </div>
              <span className="text-[10px] font-mono-tech text-muted-foreground font-semibold">
                {plan.correctTotal} из 98 верно
              </span>
            </div>

            <div className="bg-muted/40 border border-border/70 p-3.5 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-mono-tech text-sky-700 dark:text-sky-400 uppercase block font-extrabold">
                График занятий
              </span>
              <div className="text-2xl sm:text-3xl font-black text-foreground mt-0.5 tracking-tight">
                {plan.dailyMinutes}м
                <span className="text-xs text-muted-foreground font-normal font-mono-tech">/день</span>
              </div>
              <span className="text-[10px] font-mono-tech text-muted-foreground font-semibold">
                Срок: ~{plan.estimatedWeeks} нед.
              </span>
            </div>
          </div>

          {/* Recommended Unit Highlight Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/30 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-tech uppercase font-black text-amber-800 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                  РЕКОМЕНДОВАННЫЙ СТАРТ
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  (зона максимального роста)
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-foreground">
                {plan.recommendedUnit.name}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl font-medium">
                {plan.recommendedUnit.reason}
              </p>
            </div>

            <button
              onClick={() => navigate(`/unit/${plan.recommendedUnit.id}`)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-mono-tech text-xs uppercase tracking-wider font-black flex items-center gap-2 transition shrink-0 shadow-md shadow-amber-500/20 active:scale-95 tap-feedback"
            >
              Начать с этого юнита <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weak areas quick preview */}
          {plan.priorityWeakSpots && plan.priorityWeakSpots.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1 relative z-10">
              <span className="text-[11px] font-mono-tech text-muted-foreground uppercase font-extrabold">
                Приоритетные темы:
              </span>
              {plan.priorityWeakSpots.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-mono-tech text-[10px] font-extrabold"
                >
                  ⚠ {topic}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Plan Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card text-foreground border border-border/80 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground">
                <Compass className="w-5 h-5 text-amber-500" />
                Детальный план подготовки к SAT
              </DialogTitle>
              <DialogDescription className="text-xs font-mono-tech text-muted-foreground font-semibold">
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
                      className={cn(
                        "p-3 rounded-xl border flex items-center justify-between",
                        u.unitId === plan.recommendedUnit.id
                          ? "bg-amber-500/10 border-amber-500/30 shadow-xs"
                          : "bg-muted/40 border-border/70"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl">{u.icon}</span>
                        <div className="truncate">
                          <div className="text-xs font-extrabold truncate text-foreground">
                            Unit {u.unitId}: {u.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate font-medium">
                            {u.subtitle}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={cn(
                            "text-xs font-mono-tech font-black",
                            u.accuracy >= 80
                              ? "text-emerald-600 dark:text-emerald-400"
                              : u.accuracy >= 60
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-500"
                          )}
                        >
                          {u.accuracy}%
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono-tech font-semibold">
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 rounded-xl font-mono-tech text-xs font-black uppercase tracking-wider transition shadow-md shadow-amber-500/20 active:scale-95 tap-feedback"
                >
                  Перейти к рекомендованному Unit {plan.recommendedUnit.id}
                </button>
                <button
                  onClick={() => {
                    setShowDetailDialog(false);
                    navigate("/diagnostic-mock");
                  }}
                  className="px-4 py-2.5 bg-card hover:bg-muted/70 border border-border text-foreground rounded-xl font-mono-tech text-xs font-bold uppercase transition"
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
  // STATE 2: TEST IN PROGRESS
  // -------------------------------------------------------------
  if (progress) {
    const answeredCount = Object.keys(progress.answers || {}).length;
    const percent = Math.round((answeredCount / 98) * 100);

    return (
      <div className="w-full p-6 sm:p-7 rounded-3xl bg-card border border-border/80 text-foreground shadow-sm hover:shadow-md relative overflow-hidden transition-all">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-tech text-[10px] uppercase font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                ДИАГНОСТИКА В ПРОЦЕССЕ
              </span>
              <span className="text-xs text-muted-foreground font-mono-tech font-bold">
                Отвечено {answeredCount} из 98 ({percent}%)
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
              Продолжи диагностику и получи личный план
            </h3>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden border border-border/70 mt-2 p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleStartExam}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-mono-tech text-xs uppercase tracking-wider font-black flex items-center justify-center gap-2 transition shadow-sm active:scale-95 tap-feedback"
            >
              <span>Продолжить (вопрос {progress.currentIndex + 1})</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={handleResetExam}
              title="Начать заново"
              className="p-3 rounded-2xl bg-card border border-border text-muted-foreground hover:text-rose-500 transition active:scale-95 shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: NOT STARTED YET (CALM, BALANCED & REFINED INVITATION)
  // -------------------------------------------------------------
  return (
    <div
      onClick={handleStartExam}
      className="w-full p-6 sm:p-7 rounded-3xl cursor-pointer text-left transition-all duration-200 relative overflow-hidden bg-card hover:bg-card/95 border border-border/80 hover:border-foreground/30 text-foreground shadow-sm hover:shadow-md group active:scale-[0.99] tap-feedback"
    >
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Left icon & text */}
        <div className="flex items-start gap-4 flex-1">
          {/* Elegant Dark/Obsidian Emblem with Gold Compass */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-foreground text-background dark:bg-card dark:text-foreground border border-border/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <Compass className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 dark:text-amber-400 stroke-[2.2]" />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-tech text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25 shadow-2xs">
                ⚡ 100% БЕСПЛАТНО · 98 ВОПРОСОВ
              </span>
              <span className="font-mono-tech text-[10px] uppercase text-muted-foreground tracking-wider font-bold">
                COLLEGE BOARD STANDARDS
              </span>
            </div>

            {/* Title: Deep, sharp, comfortable text-foreground */}
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
              Построй свой персональный план подготовки к SAT
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl font-medium">
              Пройди диагностический тест (54 RW + 44 Math). Алгоритм определит твои слабые темы, <span className="text-foreground font-bold underline decoration-border decoration-1 underline-offset-2">подскажет рекомендованный юнит</span> и составит пошаговый график.
            </p>

            {/* Micro badges: balanced, soft icons without overpowering */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 text-[11px] font-mono-tech font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground bg-muted/50 px-3 py-1 rounded-xl border border-border/60 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5 text-violet-500" /> 54 RW + 44 Math
              </span>
              <span className="flex items-center gap-1.5 text-foreground bg-muted/50 px-3 py-1 rounded-xl border border-border/60 shadow-2xs">
                <Calculator className="w-3.5 h-3.5 text-sky-500" /> Встроенный Desmos
              </span>
              <span className="flex items-center gap-1.5 text-foreground bg-muted/50 px-3 py-1 rounded-xl border border-border/60 shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> Прогноз балла (400–1600)
              </span>
            </div>
          </div>
        </div>

        {/* Right CTA Button: Sleek high-contrast dark button with subtle gold spark */}
        <div className="w-full md:w-auto shrink-0 flex items-center justify-end">
          <button
            type="button"
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-mono-tech text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md group-hover:translate-x-0.5 active:scale-95 tap-feedback"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Пройти мок-тест</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalPlanCard;
