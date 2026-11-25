import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

export interface DomainItem {
  id: string;
  name: string;
  shortName: string;
  category: "math" | "reading_writing";
  score: number; // 0 to 100
  potentialGain: number; // score point lift if mastered (+30, +40, etc.)
  advice: string;
  drillTopicId: string;
}

const DEFAULT_DOMAINS: DomainItem[] = [
  {
    id: "algebra",
    name: "Algebra",
    shortName: "Algebra",
    category: "math",
    score: 82,
    potentialGain: 20,
    advice: "Уверенная база. Доведи скорость решения линейных систем через Desmos до 30 секунд.",
    drillTopicId: "linear-equations",
  },
  {
    id: "advanced_math",
    name: "Advanced Math",
    shortName: "Adv Math",
    category: "math",
    score: 68,
    potentialGain: 35,
    advice: "Повтори формулы Виета и нахождение вершины параболы -b/(2a) без ручного счёта.",
    drillTopicId: "quadratics",
  },
  {
    id: "problem_solving",
    name: "Problem Solving & Data",
    shortName: "Data / Stats",
    category: "math",
    score: 75,
    potentialGain: 25,
    advice: "Будь внимателен к единицам измерения в пропорциях и доверительным интервалам.",
    drillTopicId: "percentages",
  },
  {
    id: "geometry",
    name: "Geometry & Trigonometry",
    shortName: "Geometry",
    category: "math",
    score: 62,
    potentialGain: 40,
    advice: "Отработай уравнение окружности (x-h)² + (y-k)² = r² и теоремы об углах хорд.",
    drillTopicId: "circles",
  },
  {
    id: "craft_structure",
    name: "Craft & Structure",
    shortName: "Craft & Struct",
    category: "reading_writing",
    score: 71,
    potentialGain: 30,
    advice: "Изучи словарный запас высокого уровня в контекстном тренажере лексики.",
    drillTopicId: "words-in-context",
  },
  {
    id: "information_ideas",
    name: "Information & Ideas",
    shortName: "Info & Ideas",
    category: "reading_writing",
    score: 66,
    potentialGain: 35,
    advice: "Ищи прямое текстуальное подтверждение гипотезы, исключая крайние формулировки.",
    drillTopicId: "central-ideas",
  },
  {
    id: "conventions",
    name: "Standard English Conventions",
    shortName: "Grammar",
    category: "reading_writing",
    score: 48,
    potentialGain: 45,
    advice: "Железные правила: точки с запятой, двоеточия и comma splices. Дает самый быстрый прирост баллов!",
    drillTopicId: "punctuation",
  },
  {
    id: "expression",
    name: "Expression of Ideas",
    shortName: "Transitions",
    category: "reading_writing",
    score: 78,
    potentialGain: 20,
    advice: "Классифицируй связки на три типа: контраст (However), добавление (Furthermore), следствие (Therefore).",
    drillTopicId: "transitions",
  },
];

interface DomainMasteryRadarProps {
  userAnswers?: any[];
}

export const DomainMasteryRadar: React.FC<DomainMasteryRadarProps> = ({ userAnswers }) => {
  const navigate = useNavigate();
  const [hoveredDomain, setHoveredDomain] = useState<DomainItem | null>(null);

  // Compute live scores if answers exist, otherwise fall back to calibrated baseline
  const domains: DomainItem[] = React.useMemo(() => {
    if (!userAnswers || userAnswers.length < 5) {
      return DEFAULT_DOMAINS;
    }

    // Map answers by domain
    const stats: Record<string, { correct: number; total: number }> = {};
    for (const a of userAnswers) {
      const topic = a.questions?.topic || "algebra";
      if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
      stats[topic].total += 1;
      if (a.is_correct) stats[topic].correct += 1;
    }

    return DEFAULT_DOMAINS.map((d) => {
      const stat = stats[d.drillTopicId];
      if (stat && stat.total > 0) {
        const accuracy = Math.round((stat.correct / stat.total) * 100);
        return {
          ...d,
          score: Math.max(25, accuracy),
          potentialGain: Math.max(15, Math.round((100 - accuracy) * 0.6)),
        };
      }
      return d;
    });
  }, [userAnswers]);

  // Find lowest scoring domain (The Point of Maximum Leverage)
  const weakestDomain = [...domains].sort((a, b) => a.score - b.score)[0];

  // SVG Radar Geometry calculation
  const size = 320;
  const center = size / 2;
  const radius = center - 45;
  const numAxes = domains.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Concentric polygon points (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (valueRatio: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius * valueRatio;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate data polygon path
  const dataPoints = domains.map((d, i) => getCoordinates(d.score / 100, i));
  const dataPathString =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-card border border-border/80 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 text-xs font-semibold mb-1">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>Компетенции Digital SAT</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Радар владения доменами экзамена
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">
            Интерактивная карта точности по 8 ключевым разделам College Board.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">
            Средняя точность:{" "}
            <strong className="text-foreground tabular-nums">
              {Math.round(domains.reduce((acc, d) => acc + d.score, 0) / domains.length)}%
            </strong>
          </span>
        </div>
      </div>

      {/* Main Grid: Radar SVG + Weakest Domain Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Radar Spider Chart */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative select-none">
          <svg
            width={size}
            height={size}
            aria-label="Domain Mastery Radar"
            className="overflow-visible max-w-full"
          >
            {/* Background concentric rings */}
            {rings.map((ringVal) => {
              const ringPoints = domains.map((_, i) => getCoordinates(ringVal, i));
              const ringPath =
                ringPoints
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                  .join(" ") + " Z";
              return (
                <path
                  key={ringVal}
                  d={ringPath}
                  fill="none"
                  stroke="currentColor"
                  className="text-border/60"
                  strokeWidth="1"
                  strokeDasharray={ringVal === 1 ? undefined : "3 3"}
                />
              );
            })}

            {/* Axes lines from center to outer ring */}
            {domains.map((_, i) => {
              const outer = getCoordinates(1.0, i);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="currentColor"
                  className="text-border/70"
                  strokeWidth="1"
                />
              );
            })}

            {/* User Mastery Polygon Area with Gradient */}
            <defs>
              <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
              </linearGradient>
            </defs>

            <path
              d={dataPathString}
              fill="url(#radarGradient)"
              stroke="#f59e0b"
              strokeWidth="2.5"
              className="drop-shadow-sm"
            />

            {/* Vertex Dots & Interactive Hotspots */}
            {dataPoints.map((p, i) => {
              const domain = domains[i];
              const isHovered = hoveredDomain?.id === domain.id;
              const isWeak = domain.id === weakestDomain.id;

              return (
                <g key={domain.id} className="cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 6 : isWeak ? 5 : 4}
                    fill={isWeak ? "#ef4444" : "#f59e0b"}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="motion-safe:transition-transform duration-150"
                    onMouseEnter={() => setHoveredDomain(domain)}
                    onMouseLeave={() => setHoveredDomain(null)}
                  />
                </g>
              );
            })}

            {/* Axis Labels */}
            {domains.map((d, i) => {
              const labelPos = getCoordinates(1.22, i);
              const isWeak = d.id === weakestDomain.id;

              return (
                <text
                  key={d.id}
                  x={labelPos.x}
                  y={labelPos.y + 4}
                  textAnchor="middle"
                  className={`text-[10px] font-semibold transition-colors ${
                    isWeak
                      ? "fill-rose-500 font-bold"
                      : "fill-muted-foreground hover:fill-foreground"
                  }`}
                >
                  {d.shortName}
                </text>
              );
            })}
          </svg>

          {/* Active tooltip on hover */}
          {hoveredDomain && (
            <div className="absolute bottom-2 bg-muted border border-border shadow-md px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
              <span className="font-semibold text-foreground">{hoveredDomain.name}:</span>
              <span className="font-bold text-amber-500 tabular-nums">{hoveredDomain.score}% точности</span>
            </div>
          )}
        </div>

        {/* Leverage Point & Action Card */}
        <div className="lg:col-span-5 space-y-4">
          {/* Key Leverage Callout */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Главная точка роста
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs tabular-nums">
                +{weakestDomain.potentialGain} баллов
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-foreground">
                {weakestDomain.name} ({weakestDomain.score}% точности)
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {weakestDomain.advice}
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={() => navigate(`/cheatsheet`)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-neutral-950 text-xs font-bold transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 whitespace-nowrap"
              >
                <span>Изучить хаки и правила по теме</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Domain Grid */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">
              Все домены по уровню готовности:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {domains.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-xl border border-border/70 bg-muted/30 hover:bg-muted/60 transition-colors flex items-center justify-between text-xs"
                >
                  <span className="truncate text-foreground font-medium pr-1">
                    {d.shortName}
                  </span>
                  <span
                    className={`font-bold tabular-nums shrink-0 ${
                      d.score >= 75
                        ? "text-emerald-700 dark:text-emerald-400"
                        : d.score >= 60
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {d.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
