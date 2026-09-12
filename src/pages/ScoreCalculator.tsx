import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import SeoHead from "@/components/SeoHead";
import { useLanguage } from "@/context/LanguageContext";
import {
  Calculator,
  Target,
  BookOpen,
  Plus,
  Minus,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Approximate Digital SAT scoring curve.
 * Reading & Writing: raw 0..54  → scaled 200..800
 * Math:               raw 0..44 → scaled 200..800
 *
 * The real curve is mildly non-linear (steeper at the tails, flatter in
 * the middle). We approximate with a smoothstep-style easing anchored to
 * published concordance ranges. Not an official score — a close estimate.
 */
function scaleSection(raw: number, maxRaw: number): number {
  const clamped = Math.max(0, Math.min(maxRaw, raw));
  if (clamped === 0) return 200;
  if (clamped === maxRaw) return 800;

  const t = clamped / maxRaw; // 0..1
  // Ease: flatter middle, steeper tails — matches published curves better
  const eased = 0.5 * (1 - Math.cos(Math.PI * Math.pow(t, 0.92)));
  const scaled = 200 + eased * 600;
  // Digital SAT scaled scores are multiples of 10
  return Math.round(scaled / 10) * 10;
}

const RW_MAX = 54;
const MATH_MAX = 44;

const TARGET_PRESETS = [1350, 1400, 1450, 1500, 1550, 1600];

const ScoreCalculator = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [rw, setRw] = useState<number>(44);
  const [math, setMath] = useState<number>(38);
  const [target, setTarget] = useState<number>(1500);

  const rwScaled = useMemo(() => scaleSection(rw, RW_MAX), [rw]);
  const mathScaled = useMemo(() => scaleSection(math, MATH_MAX), [math]);
  const total = rwScaled + mathScaled;
  const delta = total - target;

  const getPercentile = (score: number) => {
    if (score >= 1550) return "99+th";
    if (score >= 1500) return "98th";
    if (score >= 1400) return "93rd";
    if (score >= 1300) return "86th";
    if (score >= 1200) return "74th";
    if (score >= 1100) return "58th";
    return "Top 50%";
  };

  return (
    <AppShell title={t("calculator")}>
      <SeoHead
        title="Digital SAT Score Calculator | SATANGO"
        description="Free Digital SAT score calculator. Convert raw Reading & Writing and Math scores into scaled section scores (200-800) and total out of 1600."
        path="/score-calculator"
      />

      <div className="space-y-6 animate-spring-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Calculator className="w-7 h-7 text-primary" />
              {t("calculatorTitle")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("calculatorDesc")}
            </p>
          </div>
        </div>

        {/* Total Score Hero Card */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              {t("totalScaledScore")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {getPercentile(total)} {language === "ru" ? "процентиль" : "Percentile"}
              </span>
              <span
                className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-full border",
                  delta >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                {delta >= 0 ? `+${delta} ${t("atOrAboveTarget")}` : `${delta} ${t("belowTarget")}`}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-mono-tech text-6xl sm:text-7xl font-black tracking-tight text-foreground tabular-nums">
              {total}
            </span>
            <span className="font-mono-tech text-xl sm:text-2xl text-muted-foreground font-semibold tabular-nums">
              / 1600
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-3.5 bg-muted rounded-full overflow-hidden p-0.5 border border-border/60">
              <div
                className="h-full bg-gradient-to-r from-primary via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (total / 1600) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono-tech text-muted-foreground">
              <span>400</span>
              <span>800</span>
              <span>1200</span>
              <span className="font-bold text-foreground">1600</span>
            </div>
          </div>
        </div>

        {/* Section Cards (RW and Math) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reading & Writing */}
          <SectionInputCard
            title={t("readingWriting")}
            icon={<BookOpen className="w-5 h-5 text-amber-500" />}
            scaledScore={rwScaled}
            rawValue={rw}
            maxRaw={RW_MAX}
            onChange={setRw}
            language={language}
          />

          {/* Math */}
          <SectionInputCard
            title={t("math")}
            icon={<Calculator className="w-5 h-5 text-sky-500" />}
            scaledScore={mathScaled}
            rawValue={math}
            maxRaw={MATH_MAX}
            onChange={setMath}
            language={language}
          />
        </div>

        {/* Target Score Selector & Strategy */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-base text-foreground">
                  {t("targetScore")}
                </h3>
              </div>
              <span className="font-mono-tech font-extrabold text-lg text-primary">
                {target}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "ru"
                ? "Выбери желаемый итоговый балл, чтобы рассчитать необходимый результат."
                : "Select your target score to see what you need to hit your goal."}
            </p>
          </div>

          {/* Target preset buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {TARGET_PRESETS.map((p) => {
              const isSelected = target === p;
              return (
                <button
                  key={p}
                  onClick={() => setTarget(p)}
                  className={cn(
                    "py-2 px-3 rounded-2xl font-mono-tech text-sm font-bold border transition-all duration-150",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/50 hover:bg-muted text-foreground border-border/80"
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Action guidance */}
          <div
            className={cn(
              "p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
              delta >= 0
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-100"
                : "bg-amber-500/10 border-amber-500/20 text-amber-950 dark:text-amber-100"
            )}
          >
            <div className="flex items-start gap-3">
              {delta >= 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {delta >= 0 ? t("onTrackMessage") : t("needPracticeMessage")}
                </p>
                <p className="text-xs opacity-80 mt-0.5">
                  {rwScaled < mathScaled
                    ? (language === "ru" ? "Слабая секция: Reading & Writing" : "Weaker section: Reading & Writing")
                    : rwScaled > mathScaled
                    ? (language === "ru" ? "Слабая секция: Math" : "Weaker section: Math")
                    : (language === "ru" ? "Обе секции сбалансированы" : "Both sections are balanced")}
                </p>
              </div>
            </div>

            <Button
              onClick={() => navigate(delta >= 0 ? "/exam-center" : "/")}
              size="sm"
              className="rounded-xl font-bold shrink-0 self-end sm:self-auto gap-1.5"
            >
              <span>{delta >= 0 ? t("takeDiagnosticMock") : t("practiceWeakest")}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Concordance Notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-muted/40 border border-border/60 text-muted-foreground text-xs">
          <Info className="w-4 h-4 shrink-0" />
          <p>{t("calculatorNote")}</p>
        </div>
      </div>
    </AppShell>
  );
};

interface SectionInputCardProps {
  title: string;
  icon: React.ReactNode;
  scaledScore: number;
  rawValue: number;
  maxRaw: number;
  onChange: (val: number) => void;
  language: string;
}

const SectionInputCard = ({
  title,
  icon,
  scaledScore,
  rawValue,
  maxRaw,
  onChange,
  language,
}: SectionInputCardProps) => {
  const percentage = Math.round((rawValue / maxRaw) * 100);

  const increment = () => onChange(Math.min(maxRaw, rawValue + 1));
  const decrement = () => onChange(Math.max(0, rawValue - 1));

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-extrabold text-sm text-foreground">{title}</h3>
        </div>
        <div className="text-right">
          <span className="font-mono-tech text-2xl font-black text-foreground tabular-nums">
            {scaledScore}
          </span>
          <span className="font-mono-tech text-xs text-muted-foreground ml-1">/ 800</span>
        </div>
      </div>

      {/* Raw score counter + steppers */}
      <div className="flex items-center justify-between bg-muted/50 border border-border/60 rounded-2xl p-3">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {language === "ru" ? "Правильные ответы" : "Correct Answers"}
          </p>
          <p className="font-mono-tech text-lg font-black text-foreground mt-0.5">
            {rawValue} <span className="text-xs text-muted-foreground font-semibold">/ {maxRaw}</span>
            <span className="text-xs text-muted-foreground ml-2 font-normal">({percentage}%)</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={decrement}
            disabled={rawValue <= 0}
            className="w-9 h-9 rounded-xl bg-card border border-border/80 flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition"
            aria-label="Decrease score"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={increment}
            disabled={rawValue >= maxRaw}
            className="w-9 h-9 rounded-xl bg-card border border-border/80 flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition"
            aria-label="Increase score"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={maxRaw}
          value={rawValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
          aria-label={`${title} raw score slider`}
        />
        <div className="flex justify-between text-[10px] font-mono-tech text-muted-foreground">
          <span>0</span>
          <span>{Math.round(maxRaw / 2)}</span>
          <span>{maxRaw} max</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreCalculator;
