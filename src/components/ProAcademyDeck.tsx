import { useState } from "react";
import {
  Sparkles,
  Brain,
  ShieldCheck,
  Clock,
  Infinity as InfinityIcon,
  Check,
  ArrowRight,
  Target,
  Zap,
  CheckCircle2,
  Lock,
  ChevronRight,
  Layers,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePremium } from "@/hooks/usePremium";

interface ProAcademyDeckProps {
  onSelectPlan: (plan: "1month" | "3month") => void;
}

export const ProAcademyDeck = ({ onSelectPlan }: ProAcademyDeckProps) => {
  const { isPremium } = usePremium();
  const [activeFeature, setActiveFeature] = useState<"ai" | "vault" | "telemetry" | "hearts">("ai");
  const [selectedPlan, setSelectedPlan] = useState<"1month" | "3month">("3month");
  const [aiStep, setAiStep] = useState<1 | 2 | 3>(1);

  const features = [
    {
      id: "ai" as const,
      name: "Socratic AI Coach",
      tag: "SOCRATIC INTEL",
      subtitle: "Пошаговый разбор",
      icon: Brain,
      theme: {
        accent: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-500/10 dark:bg-violet-500/15",
        border: "border-violet-500/30 dark:border-violet-400/30",
        activeBorder: "border-violet-600 dark:border-violet-400",
        activeRing: "ring-2 ring-violet-500/25",
        pill: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
        gradient: "from-violet-500/10 via-card to-card",
      },
      headline: "Разбирает ловушки SAT, развивая логику.",
      desc: "ИИ-коуч не выдаёт готовый ответ, а ведёт по шагам рассуждений и учит видеть дистракторы College Board, формируя непоколебимую интуицию.",
    },
    {
      id: "vault" as const,
      name: "Mistake Vault Pro",
      tag: "AUTO RECOVERY",
      subtitle: "Банк ошибок 9 модулей",
      icon: ShieldCheck,
      theme: {
        accent: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-500/10 dark:bg-rose-500/15",
        border: "border-rose-500/30 dark:border-rose-400/30",
        activeBorder: "border-rose-600 dark:border-rose-400",
        activeRing: "ring-2 ring-rose-500/25",
        pill: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
        gradient: "from-rose-500/10 via-card to-card",
      },
      headline: "Банк ошибок со всех 9 модулей и мок-тестов.",
      desc: "Каждая неверно решённая задача автоматически сохраняется в персональный банк для точечной отработки без потери жизней, пока навык не закрепится.",
    },
    {
      id: "telemetry" as const,
      name: "Pacing & Time Engine",
      tag: "SPEED BENCHMARK",
      subtitle: "Контроль темпа 71с",
      icon: Clock,
      theme: {
        accent: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10 dark:bg-amber-500/15",
        border: "border-amber-500/30 dark:border-amber-400/30",
        activeBorder: "border-amber-600 dark:border-amber-400",
        activeRing: "ring-2 ring-amber-500/25",
        pill: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        gradient: "from-amber-500/10 via-card to-card",
      },
      headline: "Аналитика темпа относительно стандарта SAT 71с.",
      desc: "Точный подсчёт секунд на вопрос по каждой теме. Ты заранее знаешь, на каких типах задач опережаешь время, а где теряешь драгоценные минуты перед вторым модулем.",
    },
    {
      id: "hearts" as const,
      name: "Infinite Hearts & Armor",
      tag: "UNRESTRICTED",
      subtitle: "Без пауз и таймеров",
      icon: InfinityIcon,
      theme: {
        accent: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
        border: "border-emerald-500/30 dark:border-emerald-400/30",
        activeBorder: "border-emerald-600 dark:border-emerald-400",
        activeRing: "ring-2 ring-emerald-500/25",
        pill: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        gradient: "from-emerald-500/10 via-card to-card",
      },
      headline: "Бесконечные жизни и броня стриков.",
      desc: "Занимайся в любое удобное время без 4-часовых таймеров на восстановление жизней и со встроенной защитой серии занятий при форс-мажорах.",
    },
  ];

  const currentFeature = features.find((f) => f.id === activeFeature) || features[0];

  const socraticDialogues: Record<1 | 2 | 3, { stepLabel: string; prompt: string; coachText: string; hint: string }> = {
    1: {
      stepLabel: "Шаг 1: Анализ контекста",
      prompt: "Ученик: «Почему вариант C неверен в вопросе 14? Вроде бы по смыслу подходит...»",
      coachText:
        "AI Coach: «Обрати внимание на связующее слово 'however' в 4-й строке. Вариант C предполагает причинно-следственную связь, тогда как текст указывает лишь на контраст. Что это говорит о замысле автора?»",
      hint: "Подсказка: Ищи ключевой контраст, а не причину",
    },
    2: {
      stepLabel: "Шаг 2: Распознавание ловушки College Board",
      prompt: "Ученик: «Точно! Автор противопоставляет старую гипотезу новым данным экспериментов.»",
      coachText:
        "AI Coach: «Именно! Вариант C — классический дистрактор 'False Cause'. Теперь взгляни на варианты B и D: какой из них точно передает смену научной парадигмы?»",
      hint: "Дистрактор College Board: Ложная причинно-следственная связь",
    },
    3: {
      stepLabel: "Шаг 3: Фиксация правильного ответа",
      prompt: "Ученик: «Вариант B! 'Challenges previous assumptions'.»",
      coachText:
        "AI Coach: «Блестяще! Правило Digital SAT: если в тексте контраст — в правильном ответе всегда должен быть маркер смены позиции. +10 XP за самостоятельное рассуждение! ✨»",
      hint: "Интуиция закреплена: правило контраста запомнено",
    },
  };

  return (
    <div className="space-y-4 font-sans">
      {/* SECTION LABEL */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-extrabold">
            // SATANGO PLUS ARSENAL
          </span>
        </div>
        <span className="font-mono-tech text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          PRO SPECIFICATION 2026
        </span>
      </div>

      {/* HERO BENTO CONTAINER WITH WARM AMBIENT GLOW */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/80 shadow-md p-5 sm:p-7 space-y-6 transition-all">
        {/* Soft Ambient Radial Lights (Warm & Elegant, non-distracting) */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/[0.08] dark:bg-amber-400/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-500/[0.06] dark:bg-violet-400/[0.05] rounded-full blur-3xl pointer-events-none" />

        {/* TOP BANNER ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-neutral-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Sparkles className="w-6 h-6 fill-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                  ALL-ACCESS PASS
                </span>
                {isPremium ? (
                  <span className="font-mono-tech text-[10px] uppercase text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    АКТИВНА
                  </span>
                ) : (
                  <span className="font-mono-tech text-[10px] uppercase text-muted-foreground font-bold">
                    PREMIUM
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5 tracking-tight">
                Satango Plus Membership
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/30 px-3.5 py-1.5 rounded-xl shrink-0 shadow-xs">
            <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="font-mono-tech text-xs text-foreground font-extrabold">
              Цель: 1500+ SAT
            </span>
          </div>
        </div>

        {/* 4 FEATURE SELECTOR TABS (COLOR CODED & HIGH CONTRAST) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 relative z-10">
          {features.map((f) => {
            const Icon = f.icon;
            const isActive = f.id === activeFeature;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setActiveFeature(f.id);
                  if (f.id === "ai") setAiStep(1);
                }}
                className={cn(
                  "p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between gap-3 group tap-feedback",
                  isActive
                    ? cn(
                        "bg-card shadow-md scale-[1.02] border-2",
                        f.theme.activeBorder,
                        f.theme.activeRing
                      )
                    : "bg-card/60 hover:bg-card border-border/70 hover:border-border hover:shadow-xs"
                )}
              >
                {/* Active indicator dot or badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 shadow-xs",
                      f.theme.bg,
                      f.theme.border,
                      f.theme.accent,
                      isActive && "scale-105 shadow-sm"
                    )}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.4} />
                  </div>

                  {isActive ? (
                    <span className={cn("w-2 h-2 rounded-full animate-ping", f.theme.accent.split(" ")[0].replace("text-", "bg-"))} />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-muted-foreground/60 transition-colors" />
                  )}
                </div>

                <div>
                  <span
                    className={cn(
                      "font-mono-tech text-[9px] uppercase tracking-wider block font-extrabold",
                      isActive ? f.theme.accent : "text-muted-foreground"
                    )}
                  >
                    {f.tag}
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm text-foreground block truncate mt-0.5">
                    {f.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground block truncate mt-0.5 font-medium">
                    {f.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ACTIVE FEATURE SPOTLIGHT (INTERACTIVE SHOWCASE) */}
        <div
          className={cn(
            "p-5 sm:p-6 rounded-2xl border shadow-sm space-y-4 animate-in fade-in duration-300 relative z-10 transition-colors",
            "bg-gradient-to-br",
            currentFeature.theme.gradient,
            currentFeature.theme.border
          )}
        >
          {/* Spotlight Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-mono-tech text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md border shadow-xs",
                  currentFeature.theme.pill
                )}
              >
                FEATURE SHOWCASE · {currentFeature.tag}
              </span>
              <span className="text-xs text-muted-foreground font-semibold hidden sm:inline">
                Включено в Satango Plus
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono-tech font-bold text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full Access</span>
            </div>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-black text-foreground tracking-tight">
              {currentFeature.headline}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1 font-medium">
              {currentFeature.desc}
            </p>
          </div>

          {/* DYNAMIC SHOWCASE CONTAINER */}
          {activeFeature === "ai" && (
            <div className="rounded-2xl bg-card border border-border/80 p-4 space-y-3 shadow-xs">
              {/* Header with step selector */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-border/60 pb-2">
                <div className="flex items-center gap-2 font-mono-tech font-bold text-foreground">
                  <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span>{socraticDialogues[aiStep].stepLabel}</span>
                </div>
                {/* Step Switcher */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                  {([1, 2, 3] as const).map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setAiStep(step)}
                      className={cn(
                        "px-2.5 py-0.5 rounded-lg font-mono-tech text-[10px] font-bold transition-all",
                        aiStep === step
                          ? "bg-violet-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Шаг {step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Bubble */}
              <div className="flex items-start gap-2.5 max-w-[90%]">
                <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-mono-tech text-[10px] font-bold flex items-center justify-center shrink-0">
                  У
                </div>
                <div className="p-3 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/60 text-xs text-foreground font-medium">
                  {socraticDialogues[aiStep].prompt.replace("Ученик: ", "")}
                </div>
              </div>

              {/* Coach Bubble */}
              <div className="flex items-start gap-2.5 max-w-[95%] ml-auto flex-row-reverse">
                <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl rounded-tr-sm bg-violet-500/10 border border-violet-500/25 text-xs text-foreground font-medium leading-relaxed shadow-xs">
                  <span className="font-mono-tech text-[10px] uppercase font-extrabold text-violet-700 dark:text-violet-300 block mb-1">
                    Socratic AI Coach
                  </span>
                  {socraticDialogues[aiStep].coachText.replace("AI Coach: ", "")}
                </div>
              </div>

              {/* Hint Chip */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono-tech text-[10px] text-violet-700 dark:text-violet-300 font-bold bg-violet-500/15 border border-violet-500/30 px-2.5 py-1 rounded-lg">
                  💡 {socraticDialogues[aiStep].hint}
                </span>
                {aiStep < 3 && (
                  <button
                    type="button"
                    onClick={() => setAiStep((prev) => ((prev + 1) as 1 | 2 | 3))}
                    className="text-[11px] font-mono-tech font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                  >
                    <span>Следующий шаг</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {activeFeature === "vault" && (
            <div className="rounded-2xl bg-card border border-border/80 p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
                <div className="flex items-center gap-2 font-mono-tech font-bold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Очередь ликвидации ошибок (Mistake Telemetry)</span>
                </div>
                <span className="font-mono-tech text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  LIVE SYNC
                </span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-center">
                  <span className="text-lg font-black text-foreground block">18</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Ошибок закрыто</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-center">
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 block">94%</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Точность повтора</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-center">
                  <span className="text-lg font-black text-amber-500 block">+50</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Gems бонус</span>
                </div>
              </div>

              {/* Recovery Progress Bars */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-foreground">Math: Quadratics & Parabolas</span>
                    <span className="font-mono-tech text-[11px] text-rose-600 dark:text-rose-400">85% Исправлено</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full w-[85%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-foreground">RW: Transitions & Contrast Distractors</span>
                    <span className="font-mono-tech text-[11px] text-emerald-600 dark:text-emerald-400">100% Закрыто 🎉</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-800 dark:text-rose-300">
                  🛡️ Тренировка без риска: Жизни НЕ сгорают при отработке банка ошибок
                </span>
                <span className="font-mono-tech text-[10px] font-bold text-rose-700 dark:text-rose-300">
                  БЕЗЛИМИТ
                </span>
              </div>
            </div>
          )}

          {activeFeature === "telemetry" && (
            <div className="rounded-2xl bg-card border border-border/80 p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
                <div className="flex items-center gap-2 font-mono-tech font-bold text-foreground">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>College Board Pace Benchmark</span>
                </div>
                <span className="font-mono-tech text-[10px] text-amber-700 dark:text-amber-300 font-extrabold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                  СТАНДАРТ 71 СЕК
                </span>
              </div>

              {/* Time Pace Comparison */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-mono-tech text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">
                    ТВОЙ ТЕКУЩИЙ ТЕМП
                  </span>
                  <div className="text-2xl font-black text-foreground mt-0.5">
                    52с <span className="text-xs text-muted-foreground font-normal">/ вопрос (норма 71с)</span>
                  </div>
                </div>
                <div className="bg-card px-3.5 py-2 rounded-xl border border-amber-500/30 text-right">
                  <span className="font-mono-tech text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold block">
                    +19 СЕКУНД ЗАПАСА
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    на сложные задачи в Hard Module 2
                  </span>
                </div>
              </div>

              {/* Topic speeds */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                  <span className="font-medium text-foreground">Heart of Algebra</span>
                  <span className="font-mono-tech font-bold text-emerald-600 dark:text-emerald-400">~44с (Быстро)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                  <span className="font-medium text-foreground">Reading & Writing</span>
                  <span className="font-mono-tech font-bold text-emerald-600 dark:text-emerald-400">~56с (Отлично)</span>
                </div>
              </div>
            </div>
          )}

          {activeFeature === "hearts" && (
            <div className="rounded-2xl bg-card border border-border/80 p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
                <div className="flex items-center gap-2 font-mono-tech font-bold text-foreground">
                  <InfinityIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Статус защиты и восстановления жизней</span>
                </div>
                <span className="font-mono-tech text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                  PROTECTED
                </span>
              </div>

              {/* Heart and Shield status */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-2xl">
                    ∞
                  </div>
                  <div>
                    <h5 className="font-black text-sm text-foreground">Безлимитные жизни 24/7</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Никаких 4-часовых пауз и штрафов за ошибки
                    </p>
                  </div>
                </div>

                <div className="bg-card px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs font-mono-tech font-bold text-emerald-700 dark:text-emerald-300 text-center">
                  Таймер: 0 сек
                </div>
              </div>

              {/* Streak Shield Card */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <span className="font-bold text-foreground block">Streak Armor включена</span>
                    <span className="text-[11px] text-muted-foreground">
                      Автоматически защищает серию занятий при случайном пропуске дня
                    </span>
                  </div>
                </div>
                <span className="font-mono-tech text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                  АКТИВНО
                </span>
              </div>
            </div>
          )}
        </div>

        {/* DUAL PRICING PLAN SELECTOR (CRYSTAL CLEAR HIERARCHY & CONTRAST) */}
        <div className="space-y-3 pt-3 border-t border-border/60 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-foreground" />
              <span className="font-mono-tech text-[11px] uppercase tracking-wider text-foreground font-extrabold">
                ВЫБОР ТАРИФА
              </span>
            </div>
            <span className="font-mono-tech text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ⚡ Моментальный доступ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* PLAN 1: 1-Month Sprint */}
            <button
              type="button"
              onClick={() => {
                setSelectedPlan("1month");
                onSelectPlan("1month");
              }}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between shadow-xs tap-feedback",
                selectedPlan === "1month"
                  ? "bg-card border-2 border-foreground dark:border-white shadow-md scale-[1.01]"
                  : "bg-card/60 hover:bg-card border-border/80 hover:border-border"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground font-extrabold bg-muted/80 px-2 py-0.5 rounded">
                    СПРИНТ 30 ДНЕЙ
                  </span>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                      selectedPlan === "1month"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border"
                    )}
                  >
                    {selectedPlan === "1month" && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="mt-2.5">
                  <span className="font-black text-sm text-foreground block">
                    1-Month Sprint
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-foreground mt-1 tracking-tight">
                    $9.99
                    <span className="text-xs text-muted-foreground font-semibold font-mono-tech ml-1.5">
                      / месяц
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium leading-relaxed">
                    Интенсивный спринт перед ближайшим экзаменом SAT.
                  </p>
                </div>

                {/* Bullets */}
                <div className="mt-3.5 pt-3 border-t border-border/50 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                    <span>Безлимитный Socratic AI</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                    <span>Банк ошибок и все 9 модулей</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                    <span>Бесконечные жизни на 30 дней</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-border/50 text-xs font-mono-tech font-bold text-foreground">
                <span>Выбрать 1 месяц</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* PLAN 2: 3-Month Mastery (HIT & VALUE) */}
            <button
              type="button"
              onClick={() => {
                setSelectedPlan("3month");
                onSelectPlan("3month");
              }}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between shadow-xs tap-feedback",
                selectedPlan === "3month"
                  ? "bg-card border-2 border-amber-500 dark:border-amber-400 shadow-lg ring-2 ring-amber-500/25 scale-[1.01]"
                  : "bg-amber-500/[0.04] hover:bg-card border-amber-500/30 hover:border-amber-500/50"
              )}
            >
              {/* Highlight ribbon banner */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-mono-tech text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm flex items-center gap-1">
                <span>🔥</span>
                <span>ХИТ · SAVE 20%</span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono-tech text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-extrabold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                    МАКСИМАЛЬНЫЙ РЕЗУЛЬТАТ
                  </span>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                      selectedPlan === "3month"
                        ? "border-amber-500 bg-amber-500 text-neutral-950 shadow-xs"
                        : "border-border"
                    )}
                  >
                    {selectedPlan === "3month" && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="mt-2.5">
                  <span className="font-black text-sm text-foreground block">
                    3-Month Mastery
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                      $24.99
                    </span>
                    <span className="text-xs font-bold text-foreground bg-amber-500/15 dark:bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-500/30">
                      ~$8.33 / мес
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium leading-relaxed">
                    Полный цикл подготовки от диагностики до 1500+ баллов.
                  </p>
                </div>

                {/* Bullets */}
                <div className="mt-3.5 pt-3 border-t border-border/50 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={2.5} />
                    <span>Всё из тарифа 1 месяц</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={2.5} />
                    <span>Полные 98-вопросные мок-тесты SAT</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={2.5} />
                    <span>Приоритетная скорость ответов ИИ</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-border/50 text-xs font-mono-tech font-bold text-amber-700 dark:text-amber-400">
                <span>Выбрать 3 месяца (Экономия $5)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>

        {/* BOTTOM PROMINENT HIGH-CONVERTING CTA BUTTON */}
        <div className="space-y-2 relative z-10">
          <button
            type="button"
            onClick={() => onSelectPlan(selectedPlan)}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-mono-tech text-xs sm:text-sm uppercase tracking-wider font-black flex items-center justify-center gap-2.5 transition-all shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/35 active:scale-[0.98] tap-feedback"
          >
            <Sparkles className="w-4 h-4 fill-neutral-950" />
            <span>
              {selectedPlan === "3month"
                ? "Оформить 3-Month Mastery — $24.99 (~$8.33/мес)"
                : "Оформить 1-Month Sprint — $9.99"}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Reassurance Trust Signals */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground font-medium pt-1">
            <span className="flex items-center gap-1">
              ⚡ Моментальный доступ
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              🛡️ 7 дней гарантии возврата
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              🔒 Безопасная оплата
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProAcademyDeck;
