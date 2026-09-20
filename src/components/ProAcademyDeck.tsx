import { useState } from "react";
import {
  Sparkles,
  Brain,
  ShieldCheck,
  Clock,
  Infinity as InfinityIcon,
  CheckCircle2,
  ArrowRight,
  Terminal,
  Target,
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

  const features = [
    {
      id: "ai" as const,
      name: "Socratic AI Coach",
      tag: "SOCRATIC INTEL",
      icon: Brain,
      color: "text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
      headline: "Разбирает ловушки SAT, развивая логику.",
      desc: "ИИ-коуч не выдаёт ответ сразу, а ведёт по шагам рассуждений и учит видеть дистракторы College Board, формируя непоколебимую интуицию.",
      preview: {
        badge: "SOCRATIC DIALOGUE",
        prompt: "Ученик: «Почему вариант C неверен в вопросе 14?»",
        response: "AI Coach: «Обрати внимание на связующее слово в 4-й строке. Вариант C предполагает причинно-следственную связь, тогда как текст указывает лишь на контраст. Что это говорит о цели автора?»",
      },
    },
    {
      id: "vault" as const,
      name: "Mistake Vault Pro",
      tag: "AUTO RECOVERY",
      icon: ShieldCheck,
      color: "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-200 dark:border-rose-900/50",
      headline: "Банк ошибок со всех 9 модулей и мок-тестов.",
      desc: "Каждая неверно решённая задача автоматически сохраняется в персональный банк для точечной отработки без потери жизней.",
      preview: {
        badge: "VAULT TELEMETRY",
        prompt: "Банк ошибок: Отслеживание пробелов по Math и Reading & Writing",
        response: "Режим тренировки: Отработка без штрафа жизней · Бонус +50 Gems при закрытии очереди",
      },
    },
    {
      id: "telemetry" as const,
      name: "Pacing & Time Engine",
      tag: "SPEED BENCHMARK",
      icon: Clock,
      color: "text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
      headline: "Аналитика темпа относительно стандарта SAT 71с.",
      desc: "Точный подсчёт секунд на вопрос по каждой теме. Ты заранее знаешь, на каких типах задач теряешь драгоценные минуты.",
      preview: {
        badge: "SPEED RADAR",
        prompt: "Math Pace: ~56s (Оптимально) · RW Pace: ~49s (Быстро)",
        response: "Запас темпа: У тебя в среднем +18 секунд на сложные задачи в адаптивном Hard Module 2.",
      },
    },
    {
      id: "hearts" as const,
      name: "Infinite Hearts & Armor",
      tag: "UNRESTRICTED",
      icon: InfinityIcon,
      color: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50",
      headline: "Бесконечные жизни и броня стриков.",
      desc: "Занимайся в любое удобное время без 4-часовых таймеров на восстановление жизней и со встроенной защитой серии занятий.",
      preview: {
        badge: "ARMOR STATUS",
        prompt: "Жизни: ∞ Бесконечно · Никаких пауз посреди занятия",
        response: "Streak Shield: Активен · Автоматически сохраняет серию при пропуске дня",
      },
    },
  ];

  const currentFeature = features.find((f) => f.id === activeFeature) || features[0];

  return (
    <div className="space-y-4 font-sans">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-500" />
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
            // SATANGO PLUS ARSENAL
          </span>
        </div>
        <span className="font-mono-tech text-[10px] text-muted-foreground uppercase font-semibold">
          PRO SPECIFICATION
        </span>
      </div>

      {/* HERO BENTO CONTAINER (CLEAN LIGHT-GRAY SLEEK PALETTE) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/70 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400/80 dark:hover:border-zinc-700 text-foreground p-6 sm:p-7 shadow-xs hover:shadow-md space-y-6 transition-all">
        {/* Subtle Ambient Depth */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-200/30 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Banner Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-zinc-700 dark:text-zinc-300 font-bold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-xs">
                  ALL-ACCESS PASS
                </span>
                {isPremium && (
                  <span className="font-mono-tech text-[10px] uppercase text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    АКТИВНА
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-foreground mt-0.5">
                Satango Plus Membership
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3.5 py-1.5 rounded-2xl shrink-0 shadow-xs">
            <Target className="w-4 h-4 text-zinc-500" />
            <span className="font-mono-tech text-xs text-foreground font-bold">
              Цель: 1500+ SAT
            </span>
          </div>
        </div>

        {/* FEATURE SELECTOR TABS (Light Gray Tiles) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
          {features.map((f) => {
            const Icon = f.icon;
            const isActive = f.id === activeFeature;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFeature(f.id)}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 shadow-xs",
                  isActive
                    ? "bg-white dark:bg-zinc-800 border-zinc-900 dark:border-white shadow-sm scale-[1.02]"
                    : "bg-zinc-50/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 opacity-75 hover:opacity-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border", f.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white" />}
                </div>
                <div>
                  <span className="font-mono-tech text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">
                    {f.tag}
                  </span>
                  <span className="font-black text-xs text-foreground block truncate mt-0.5">
                    {f.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ACTIVE FEATURE SPOTLIGHT (Clean Spotlight Card) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3.5 animate-fadeIn shadow-xs relative z-10">
          <div>
            <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              FEATURE SPOTLIGHT // {currentFeature.tag}
            </span>
            <h4 className="text-base sm:text-lg font-black text-foreground mt-0.5">
              {currentFeature.headline}
            </h4>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
            {currentFeature.desc}
          </p>

          {/* Interactive preview snippet */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2 font-mono-tech text-xs">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
              <span className="flex items-center gap-1.5 text-foreground font-bold">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" /> {currentFeature.preview.badge}
              </span>
              <span className="font-bold text-zinc-600 dark:text-zinc-400">LIVE DEMO</span>
            </div>
            <p className="text-foreground text-[11px] leading-relaxed font-semibold">
              {currentFeature.preview.prompt}
            </p>
            <p className="text-foreground text-[11px] leading-relaxed bg-zinc-100 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-medium">
              {currentFeature.preview.response}
            </p>
          </div>
        </div>

        {/* DUAL PRICING PLAN SELECTOR */}
        <div className="space-y-3 pt-2 border-t border-zinc-200/80 dark:border-zinc-800 relative z-10">
          <div className="flex items-center justify-between">
            <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              ВЫБОР ТАРИФА
            </span>
            <span className="font-mono-tech text-[10px] text-zinc-600 dark:text-zinc-400 font-bold">
              Моментальный доступ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PLAN 1: 1-Month Sprint */}
            <button
              type="button"
              onClick={() => {
                setSelectedPlan("1month");
                onSelectPlan("1month");
              }}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between shadow-xs",
                selectedPlan === "1month"
                  ? "bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-white shadow-sm scale-[1.01]"
                  : "bg-zinc-50/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 opacity-75 hover:opacity-100"
              )}
            >
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                  1-Month Sprint
                </span>
                <div className="text-2xl font-black text-foreground mt-1 tracking-tight">
                  $9.99
                  <span className="text-xs text-muted-foreground font-normal font-mono-tech ml-1">/ месяц</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                  Интенсивный спринт перед ближайшим экзаменом.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-700 text-xs font-mono-tech font-bold text-foreground">
                <span>Выбрать 1 месяц</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* PLAN 2: 3-Month Mastery (HIT) */}
            <button
              type="button"
              onClick={() => {
                setSelectedPlan("3month");
                onSelectPlan("3month");
              }}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between shadow-xs",
                selectedPlan === "3month"
                  ? "bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-white shadow-sm scale-[1.01]"
                  : "bg-zinc-50/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 opacity-75 hover:opacity-100"
              )}
            >
              <div className="absolute top-0 right-0 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono-tech text-[8px] font-bold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                ХИТ · SAVE 20%
              </div>

              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-foreground font-bold block">
                  3-Month Mastery
                </span>
                <div className="text-2xl font-black text-foreground mt-1 tracking-tight">
                  $24.99
                  <span className="text-xs text-muted-foreground font-normal font-mono-tech ml-1">за 3 мес (~$8.33/мес)</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                  Полный цикл подготовки от диагностики до 1500+ баллов.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-700 text-xs font-mono-tech font-bold text-foreground">
                <span>Выбрать 3 месяца</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>

        {/* BOTTOM QUICK CTA */}
        <button
          type="button"
          onClick={() => onSelectPlan(selectedPlan)}
          className="w-full h-13 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-mono-tech text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 transition shadow-sm active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {selectedPlan === "3month"
              ? "Оформить 3-Month Mastery — $24.99 (Хит · -20%)"
              : "Оформить 1-Month Sprint — $9.99"}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ProAcademyDeck;
