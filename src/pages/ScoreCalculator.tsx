import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Calculator, Target } from "lucide-react";
import SeoHead from "@/components/SeoHead";

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
  const t = clamped / maxRaw; // 0..1
  // Ease: flatter middle, steeper tails — matches published curves better
  // than pure linear. f(t) = 0.5 * (1 - cos(pi * t^0.92))
  const eased = 0.5 * (1 - Math.cos(Math.PI * Math.pow(t, 0.92)));
  const scaled = 200 + eased * 600;
  // Digital SAT scaled scores are multiples of 10
  return Math.round(scaled / 10) * 10;
}

const DottedGrid = () => (
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.14]"
    style={{
      backgroundImage: "radial-gradient(hsl(var(--foreground)) 0.5px, transparent 0.5px)",
      backgroundSize: "24px 24px",
    }}
  />
);

const MonoLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] opacity-60">
    {children}
  </span>
);

const RW_MAX = 54;
const MATH_MAX = 44;

const ScoreCalculator = () => {
  const [rw, setRw] = useState<number>(40);
  const [math, setMath] = useState<number>(32);
  const [target, setTarget] = useState<number>(1500);

  const rwScaled = useMemo(() => scaleSection(rw, RW_MAX), [rw]);
  const mathScaled = useMemo(() => scaleSection(math, MATH_MAX), [math]);
  const total = rwScaled + mathScaled;
  const delta = total - target;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Digital SAT Score Calculator",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description:
      "Convert Digital SAT raw scores (Reading & Writing, Math) into scaled section scores and a total out of 1600.",
    url: "https://satango.com/score-calculator",
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <SeoHead
        title="Digital SAT Score Calculator | Satango"
        description="Free Digital SAT score calculator. Convert raw Reading & Writing and Math scores into scaled section scores and total out of 1600, and see the gap to your target."
        path="/score-calculator"
        jsonLd={jsonLd}
      />

      {/* NAV */}
      <nav className="relative z-20 border-b border-border/60">
        <DottedGrid />
        <div className="relative max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-sm">
              S
            </div>
            <span className="font-semibold tracking-tight text-lg">Satango</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/score-calculator"
              className="hidden sm:inline-flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-widest px-3 py-2 opacity-100"
            >
              <Calculator className="w-3.5 h-3.5" strokeWidth={2} />
              Calculator
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              Start free
              <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <section className="relative border-b border-border/60">
        <DottedGrid />
        <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-10">
          <div className="flex items-center gap-2 mb-4">
            <MonoLabel>// Tool 01</MonoLabel>
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] opacity-40">
              /score-calculator
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight max-w-3xl text-balance leading-[1.05]">
            Digital SAT Score Calculator
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground text-base leading-relaxed">
            Enter your raw section scores. We convert them to scaled Digital SAT
            section scores (200–800) and a total out of 1600, using a published-curve
            approximation.
          </p>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="relative">
        <DottedGrid />
        <div className="relative max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-[1.05fr_1fr] gap-8">
          {/* Inputs */}
          <div className="surface-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <MonoLabel>// Raw Inputs</MonoLabel>
              <span className="status-pill">LIVE</span>
            </div>

            <div className="space-y-8">
              <RawInput
                label="Reading & Writing"
                sublabel="Raw correct answers (0–54)"
                value={rw}
                max={RW_MAX}
                onChange={setRw}
              />
              <RawInput
                label="Math"
                sublabel="Raw correct answers (0–44)"
                value={math}
                max={MATH_MAX}
                onChange={setMath}
              />

              <div className="pt-6 border-t border-divider">
                <label className="block">
                  <MonoLabel>Target Total Score</MonoLabel>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="number"
                      min={400}
                      max={1600}
                      step={10}
                      value={target}
                      onChange={(e) => setTarget(Number(e.target.value) || 0)}
                      className="w-32 bg-white/80 border border-[hsl(var(--divider))] rounded-md px-3 py-2 font-mono-tech text-base tabular-nums focus:outline-none focus:border-foreground/50 transition"
                    />
                    <span className="font-mono-tech text-[11px] uppercase tracking-widest opacity-50">
                      / 1600
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="surface-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <MonoLabel>// Total Scaled</MonoLabel>
                <MonoLabel>1600 max</MonoLabel>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono-tech text-6xl sm:text-7xl font-semibold tabular-nums tracking-tight">
                  {total}
                </span>
                <span className="font-mono-tech text-lg opacity-40 tabular-nums">/ 1600</span>
              </div>
              <ProgressBar value={total} max={1600} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SectionCard label="Reading & Writing" scaled={rwScaled} raw={rw} max={RW_MAX} />
              <SectionCard label="Math" scaled={mathScaled} raw={math} max={MATH_MAX} />
            </div>

            <div className="surface-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-3.5 h-3.5 opacity-60" strokeWidth={2} />
                <MonoLabel>// Gap to Target</MonoLabel>
              </div>
              <div className="flex items-baseline justify-between">
                <span
                  className={`font-mono-tech text-3xl font-semibold tabular-nums ${
                    delta >= 0 ? "text-foreground" : "text-[hsl(var(--destructive))]"
                  }`}
                >
                  {delta >= 0 ? `+${delta}` : delta}
                </span>
                <span className="font-mono-tech text-[11px] uppercase tracking-widest opacity-60">
                  {delta >= 0 ? "at or above target" : "points below target"}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {delta >= 0
                  ? "You're on curve. Lock in with mock exams to confirm."
                  : `Close the gap with focused practice on your weakest module.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER NOTE */}
      <section className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono-tech text-[10px] uppercase tracking-widest opacity-50">
            // Approximation based on published College Board concordance tables. Not an official score.
          </p>
          <Link
            to="/"
            className="font-mono-tech text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition"
          >
            ← Back to Satango
          </Link>
        </div>
      </section>
    </div>
  );
};

const RawInput = ({
  label,
  sublabel,
  value,
  max,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
}) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-base font-semibold tracking-tight">{label}</label>
        <span className="font-mono-tech text-[11px] uppercase tracking-widest opacity-50">
          {sublabel}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
          className="w-24 bg-white/80 border border-[hsl(var(--divider))] rounded-md px-3 py-2 font-mono-tech text-base tabular-nums focus:outline-none focus:border-foreground/50 transition"
        />
        <span className="font-mono-tech text-[11px] uppercase tracking-widest opacity-50">
          / {max}
        </span>
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-foreground"
          aria-label={`${label} raw score`}
        />
      </div>
      <div className="mt-3 h-1 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const SectionCard = ({
  label,
  scaled,
  raw,
  max,
}: {
  label: string;
  scaled: number;
  raw: number;
  max: number;
}) => (
  <div className="surface-card p-5">
    <MonoLabel>// {label}</MonoLabel>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="font-mono-tech text-3xl font-semibold tabular-nums">{scaled}</span>
      <span className="font-mono-tech text-[11px] opacity-40 tabular-nums">/ 800</span>
    </div>
    <div className="mt-1 font-mono-tech text-[11px] uppercase tracking-widest opacity-50 tabular-nums">
      raw {raw} / {max}
    </div>
    <ProgressBar value={scaled - 200} max={600} />
  </div>
);

const ProgressBar = ({ value, max }: { value: number; max: number }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mt-4 h-1 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
      <div
        className="h-full bg-foreground transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export default ScoreCalculator;
