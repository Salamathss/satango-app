import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  Target,
} from "lucide-react";

interface UniversityTier {
  id: string;
  category: string;
  badge: string;
  universities: string[];
  targetScore: number;
  mathTarget: number;
  rwTarget: number;
  weeklyPace: string;
  recommendedDuration: string;
  acceptanceRate: string;
  strategies: string[];
}

const TIERS: UniversityTier[] = [
  {
    id: "ivy",
    category: "Ivy League & Top-10",
    badge: "1540–1600 · Топ 1% в мире",
    universities: ["Harvard", "MIT", "Stanford", "Princeton", "Yale", "Columbia"],
    targetScore: 1560,
    mathTarget: 790,
    rwTarget: 770,
    weeklyPace: "6–8 часов в неделю",
    recommendedDuration: "6–8 недель",
    acceptanceRate: "3% – 5%",
    strategies: [
      "Филигранное решение Math Hard Module 2 через официальные хаки Desmos",
      "Сложные логические выводы и кросс-текстовый анализ в Reading",
      "Нулевой допуск к случайным арифметическим ошибкам через банк ошибок",
    ],
  },
  {
    id: "top25",
    category: "Top-25 Elite",
    badge: "1480–1540 · Высокий шанс стипендии",
    universities: ["NYU", "UC Berkeley", "Duke", "Johns Hopkins", "Northwestern", "UCLA"],
    targetScore: 1510,
    mathTarget: 770,
    rwTarget: 740,
    weeklyPace: "5–6 часов в неделю",
    recommendedDuration: "8–10 недель",
    acceptanceRate: "8% – 14%",
    strategies: [
      "Автоматизация квадратичных уравнений, регрессий и систем в Desmos",
      "Безошибочное закрытие блока Standard English Conventions за 8 минут",
      "Пейсинг: запас 5+ минут на детальную перепроверку каждого модуля",
    ],
  },
  {
    id: "top50",
    category: "Top-50 Competitive",
    badge: "1380–1480 · Уверенное поступление",
    universities: ["Boston Univ", "Purdue", "UW Madison", "UIUC", "Penn State"],
    targetScore: 1430,
    mathTarget: 730,
    rwTarget: 700,
    weeklyPace: "4–5 часов в неделю",
    recommendedDuration: "10–12 недель",
    acceptanceRate: "20% – 35%",
    strategies: [
      "Фундаментальная алгебра, пропорции и линейные функции",
      "Быстрое определение главной идеи и структуры длинных пассажей",
      "Исключение частых ловушек на согласование подлежащего и сказуемого",
    ],
  },
  {
    id: "foundations",
    category: "Strong Foundation",
    badge: "1250–1380 · Мощный стартовый рывок",
    universities: ["State Flagships", "Honors Programs", "Full-Tuition Merit"],
    targetScore: 1350,
    mathTarget: 690,
    rwTarget: 660,
    weeklyPace: "3–4 часа в неделю",
    recommendedDuration: "12–14 недель",
    acceptanceRate: "45% – 60%",
    strategies: [
      "Ликвидация базовых пробелов школьной математики без стресса",
      "Пополнение словарного запаса через контекстный тренажер лексики",
      "Привыкание к таймингу и интерфейсу экзамена College Board Bluebook",
    ],
  },
];

export const DreamUniversityCalculator: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>("ivy");
  const navigate = useNavigate();

  const activeTier = TIERS.find((t) => t.id === selectedId) || TIERS[0];

  const handleStartPrep = () => {
    navigate("/auth", { state: { targetScore: activeTier.targetScore } });
  };

  return (
    <section className="relative z-10 border-t border-white/[0.08] bg-[#0C0C0E] py-20 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/[0.08] pb-6 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white text-balance">
              Выбери свой университет мечты — получи план баллов
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md font-sans leading-relaxed">
            Реальные проходные баллы и рекомендуемый темп занятий на основе статистики поступлений в ведущие вузы США и мира.
          </p>
        </div>

        {/* Tier Selector Pills */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TIERS.map((tier) => {
            const isSelected = tier.id === selectedId;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedId(tier.id)}
                className={`p-4 sm:p-5 rounded-2xl text-left border transition-all duration-150 flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "bg-white/[0.08] border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30"
                    : "bg-[#141417] border-white/[0.08] hover:border-white/20 hover:bg-[#1a1a1f]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? "text-blue-300" : "text-neutral-400"
                    }`}
                  >
                    {tier.category}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                  {tier.targetScore}
                  <span className="text-xs text-neutral-400 font-normal ml-1">цель</span>
                </div>
                <div className="text-[11px] text-neutral-400 truncate">
                  {tier.universities.slice(0, 3).join(", ")}...
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Tier Interactive Dashboard Card */}
        <div className="bg-[#141417] border border-white/[0.12] rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-black/60 space-y-8 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />

          {/* Top Info Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {activeTier.category}
                </h3>
                <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-semibold border border-blue-500/30">
                  {activeTier.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300">
                Целевые вузы:{" "}
                <span className="text-white font-medium">
                  {activeTier.universities.join(" · ")}
                </span>
              </p>
            </div>

            {/* Score Showcase */}
            <div className="flex items-baseline gap-3 shrink-0 bg-white/[0.04] border border-white/[0.08] px-5 py-3 rounded-2xl">
              <div>
                <span className="text-xs text-neutral-400 block font-medium">Итоговый балл</span>
                <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                  {activeTier.targetScore}
                </span>
                <span className="text-xs text-neutral-400 ml-1">/ 1600</span>
              </div>
            </div>
          </div>

          {/* Subscores & Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Math Subscore */}
            <div className="bg-[#0E0E11] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  SAT Math Target
                </span>
                <span className="text-white font-bold tabular-nums">
                  {activeTier.mathTarget} / 800
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(activeTier.mathTarget / 800) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                Допустимо не более {Math.max(1, Math.round((800 - activeTier.mathTarget) / 15))} ошибок в секции Math
              </p>
            </div>

            {/* R&W Subscore */}
            <div className="bg-[#0E0E11] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  Reading & Writing Target
                </span>
                <span className="text-white font-bold tabular-nums">
                  {activeTier.rwTarget} / 800
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(activeTier.rwTarget / 800) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                Допустимо не более {Math.max(1, Math.round((800 - activeTier.rwTarget) / 15))} ошибок в секции R&W
              </p>
            </div>

            {/* Preparation Pace */}
            <div className="bg-[#0E0E11] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Рекомендуемый темп</span>
              </div>
              <div className="text-xl font-bold text-white tabular-nums">
                {activeTier.weeklyPace}
              </div>
              <p className="text-[11px] text-neutral-400">
                Срок подготовки: {activeTier.recommendedDuration}
              </p>
            </div>
          </div>

          {/* Actionable Strategy Checklist & Direct CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
            <div className="lg:col-span-8 space-y-2.5">
              <h4 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                Ключевой фокус программы для этого уровня:
              </h4>
              <ul className="space-y-2">
                {activeTier.strategies.map((strat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{strat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-center">
              <button
                onClick={handleStartPrep}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-white hover:bg-neutral-200 text-neutral-950 font-bold px-6 py-4 rounded-xl text-sm transition-all duration-150 shadow-lg shadow-white/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>Собрать план на {activeTier.targetScore}+</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-neutral-400 text-center mt-2">
                Бесплатный старт · Подбор тем под ваш уровень
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
