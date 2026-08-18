import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import { toast } from "sonner";

/* ---------------- constants ---------------- */

const REMEMBER_KEY = "satango.rememberMe";
const PENDING_KEY = "satango.pendingOnboarding";

type Mode = "signin" | "signup" | "forgot";

const SCORE_OPTIONS = [
  { value: 1340, label: "1200 – 1340", tag: "Advanced" },
  { value: 1490, label: "1350 – 1490", tag: "Elite" },
  { value: 1600, label: "1500 – 1600", tag: "Ivy League" },
] as const;

const TIME_OPTIONS = [
  { value: 15, label: "15 мин/день", tag: "Casual" },
  { value: 30, label: "30 мин/день", tag: "Optimal" },
  { value: 60, label: "60+ мин/день", tag: "Hardcore" },
] as const;

const QUIZ = [
  {
    id: 1,
    tag: "Heart of Algebra",
    text: "If 5x + 7 = 32, what is the value of 10x + 14?",
    options: ["32", "64", "50", "71"],
    correct: 1,
  },
  {
    id: 2,
    tag: "Advanced Math",
    text: "Which of the following is equivalent to (x² − 4) / (x − 2) when x ≠ 2?",
    options: ["x − 2", "x + 2", "x² + 2", "x − 4"],
    correct: 1,
  },
  {
    id: 3,
    tag: "Geometry & Trig",
    text: "In a right triangle, if sin(θ) = 3/5, what is the value of cos(θ)?",
    options: ["3/4", "4/5", "5/3", "1"],
    correct: 1,
  },
] as const;

function computeLevel(correct: number) {
  if (correct >= 3) return { key: "advanced", label: "Advanced Level", ru: "Продвинутый уровень", range: "1390 – 1600", copy: "Открываем сложные модули и тяжелые Mock-тесты." };
  if (correct === 2) return { key: "intermediate", label: "Intermediate Level", ru: "Средний уровень", range: "1190 – 1380", copy: "Открываем продвинутые темы и Десмос-хаки." };
  return { key: "base", label: "Base Level", ru: "Начальный уровень", range: "1000 – 1180", copy: "Старт с Heart of Algebra и работы с фундаментом." };
}

/* ---------------- pending onboarding flush (safe on any mount) ---------------- */

type PendingOnboarding = {
  target_score: number;
  daily_minutes: number;
  diagnostic_score: number;
  initial_level: string;
};

async function flushPendingOnboarding(userId: string) {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as PendingOnboarding;
    const daily_xp_target =
      data.daily_minutes >= 60 ? 500 : data.daily_minutes >= 30 ? 200 : 50;
    const { error } = await supabase
      .from("profiles")
      .update({
        target_score: data.target_score,
        daily_minutes: data.daily_minutes,
        diagnostic_score: data.diagnostic_score,
        initial_level: data.initial_level,
        current_level: data.initial_level,
        sat_goal: String(data.target_score),
        daily_xp_target,
        onboarding_completed: true,
      })
      .eq("user_id", userId);
    if (!error) localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------------- small UI atoms ---------------- */

const MonoLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
    {children}
  </span>
);

const SelectCard = ({
  active,
  onClick,
  title,
  tag,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  tag: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full text-left px-4 py-3.5 rounded-md border transition-all duration-150 flex items-center justify-between gap-3 ${
      active
        ? "border-foreground bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] scale-[1.005]"
        : "border-[#EAE6DF] bg-white/70 hover:bg-white hover:border-foreground/40"
    } disabled:opacity-50`}
  >
    <div>
      <div className="text-sm font-semibold tracking-tight text-foreground">{title}</div>
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
        {tag}
      </div>
    </div>
    <div
      className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
        active ? "border-foreground bg-foreground text-background" : "border-[#EAE6DF]"
      }`}
    >
      {active && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
    </div>
  </button>
);

/* ---------------- wizard ---------------- */

type WizardStep = 1 | 2 | 3 | 4 | 5;

const Wizard = ({
  onBackToSignIn,
  redirectTo,
}: {
  onBackToSignIn: () => void;
  redirectTo: string;
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [fade, setFade] = useState(true);

  // Step 1
  const [target, setTarget] = useState<number>(1600);
  const [minutes, setMinutes] = useState<number>(30);

  // Step 2
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [qIdx, setQIdx] = useState(0);

  // Step 3
  const [analyzing, setAnalyzing] = useState(false);

  // Step 5
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const correct = useMemo(
    () => answers.reduce<number>((acc, a, i) => acc + (a === QUIZ[i].correct ? 1 : 0), 0),
    [answers]
  );
  const diagnosed = useMemo(() => computeLevel(correct), [correct]);

  const goto = (n: WizardStep) => {
    setFade(false);
    setTimeout(() => {
      setStep(n);
      setFade(true);
    }, 140);
  };

  const startAnalysis = () => {
    goto(3);
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 1400);
  };

  const skipQuiz = () => {
    setAnswers([null, null, null]);
    goto(4);
  };

  const answerQ = (opt: number) => {
    const next = [...answers];
    next[qIdx] = opt;
    setAnswers(next);
    setTimeout(() => {
      if (qIdx < 2) setQIdx(qIdx + 1);
      else startAnalysis();
    }, 220);
  };

  const persistPending = () => {
    const payload: PendingOnboarding = {
      target_score: target,
      daily_minutes: minutes,
      diagnostic_score: correct,
      initial_level: diagnosed.key,
    };
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
    } catch {}
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setLoading(true);
    setError("");
    setInfo("");
    persistPending();
    try {
      localStorage.setItem(REMEMBER_KEY, "1");
    } catch {}
    const { data, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: 'https://satango-app.vercel.app/auth' },
    });
    if (signErr) {
      setError(signErr.message);
      setLoading(false);
      return;
    }
    if (data.session && data.user) {
      await flushPendingOnboarding(data.user.id);
      navigate(redirectTo, { replace: true });
    } else {
      setInfo("Проверь почту — мы отправили ссылку для подтверждения. После входа роадмап сохранится автоматически.");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    if (loading || googleLoading) return;
    setError("");
    setGoogleLoading(true);
    persistPending();
    try {
      localStorage.setItem(REMEMBER_KEY, "1");
    } catch {}
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        setError(result.error instanceof Error ? result.error.message : "Google sign-in failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const weeks = Math.max(4, Math.min(24, Math.round(((target - 1000) / 40) * (30 / minutes))));

  const roadmap =
    diagnosed.key === "advanced"
      ? ["Advanced Math sprints", "Passport to Advanced Math", "Full-length Mocks", "Score optimization"]
      : diagnosed.key === "intermediate"
      ? ["Heart of Algebra refresh", "Advanced Math core", "Data Analysis", "Sectional Mocks"]
      : ["Foundations of Algebra", "Linear Equations & Systems", "Ratios & Percents", "Reading & Grammar core"];

  /* ---------------- rendering ---------------- */

  return (
    <div className={`transition-opacity duration-150 ${fade ? "opacity-100" : "opacity-0"}`}>
      {/* progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <MonoLabel>Step {step} / 5</MonoLabel>
          <button
            type="button"
            onClick={onBackToSignIn}
            className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition"
          >
            Уже есть аккаунт
          </button>
        </div>
        <div className="h-[3px] w-full bg-[#EAE6DF] rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1 — goals */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Целевой балл и темп</h1>
            <p className="text-sm text-muted-foreground mt-1">Какой твой целевой балл и темп подготовки?</p>
          </div>

          <div>
            <MonoLabel>// Target Score</MonoLabel>
            <div className="mt-2 grid gap-2">
              {SCORE_OPTIONS.map((o) => (
                <SelectCard
                  key={o.value}
                  active={target === o.value}
                  onClick={() => setTarget(o.value)}
                  title={o.label}
                  tag={o.tag}
                />
              ))}
            </div>
          </div>

          <div>
            <MonoLabel>// Daily Practice</MonoLabel>
            <div className="mt-2 grid gap-2">
              {TIME_OPTIONS.map((o) => (
                <SelectCard
                  key={o.value}
                  active={minutes === o.value}
                  onClick={() => setMinutes(o.value)}
                  title={o.label}
                  tag={o.tag}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => goto(2)}
            className="w-full h-11 rounded-md bg-foreground text-background text-sm font-semibold tracking-tight hover:bg-foreground/90 transition inline-flex items-center justify-center gap-2"
          >
            Продолжить <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Step 2 — quiz */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Placement Test</h1>
            <p className="text-sm text-muted-foreground mt-1">
              🧠 Быстрый мини-тест (3 вопроса), чтобы настроить твой Roadmap. Можно пропустить.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <MonoLabel>Question {qIdx + 1} of 3 · {QUIZ[qIdx].tag}</MonoLabel>
            <button
              onClick={skipQuiz}
              className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition"
            >
              Пропустить тест
            </button>
          </div>

          <div className="rounded-md border border-[#EAE6DF] bg-white/70 p-4">
            <div className="font-mono text-[13px] leading-relaxed text-foreground">
              {QUIZ[qIdx].text}
            </div>
          </div>

          <div className="grid gap-2">
            {QUIZ[qIdx].options.map((opt, i) => {
              const isPicked = answers[qIdx] === i;
              return (
                <button
                  key={i}
                  onClick={() => answerQ(i)}
                  className={`w-full text-left px-4 py-3 rounded-md border font-mono text-sm transition-all duration-150 flex items-center gap-3 ${
                    isPicked
                      ? "border-foreground bg-white scale-[1.005]"
                      : "border-[#EAE6DF] bg-white/70 hover:bg-white hover:border-foreground/40"
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground w-4">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => (qIdx > 0 ? setQIdx(qIdx - 1) : goto(1))}
              className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Назад
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — analyzing / result */}
      {step === 3 && (
        <div className="space-y-6 min-h-[280px] flex flex-col justify-center">
          {analyzing ? (
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-foreground" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Analyzing your math skills…</p>
              <MonoLabel>// running diagnostic engine</MonoLabel>
            </div>
          ) : (
            <>
              <div className="text-center">
                <MonoLabel>// Diagnostic Result</MonoLabel>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mt-2">
                  {diagnosed.label}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{diagnosed.ru}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-[#EAE6DF] bg-white/70 p-3">
                  <MonoLabel>Correct</MonoLabel>
                  <div className="font-mono text-xl font-semibold tracking-tight mt-1">
                    {correct} / 3
                  </div>
                </div>
                <div className="rounded-md border border-[#EAE6DF] bg-white/70 p-3">
                  <MonoLabel>Est. SAT Range</MonoLabel>
                  <div className="font-mono text-xl font-semibold tracking-tight mt-1">
                    {diagnosed.range}
                  </div>
                </div>
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed">{diagnosed.copy}</p>

              <button
                onClick={() => goto(4)}
                className="w-full h-11 rounded-md bg-foreground text-background text-sm font-semibold tracking-tight hover:bg-foreground/90 transition inline-flex items-center justify-center gap-2"
              >
                Посмотреть Roadmap <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 4 — roadmap */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Твой Roadmap</h1>
            <p className="text-sm text-muted-foreground mt-1">
              План: достичь <span className="font-semibold text-foreground">{target}</span> примерно за{" "}
              <span className="font-semibold text-foreground">{weeks} недель</span> при графике{" "}
              <span className="font-semibold text-foreground">{minutes} мин/день</span>.
            </p>
          </div>

          <div className="rounded-md border border-[#EAE6DF] bg-white/70 p-4">
            <MonoLabel>// Custom Path — {diagnosed.label}</MonoLabel>
            <ol className="mt-3 space-y-2">
              {roadmap.map((r, i) => (
                <li key={r} className="flex items-center gap-3 font-mono text-[13px]">
                  <span className="w-6 h-6 rounded-sm border border-[#EAE6DF] bg-white flex items-center justify-center text-[10px] font-semibold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>
          </div>

          {diagnosed.key !== "base" && (
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              // {diagnosed.key === "advanced" ? "Foundations skipped — diagnostic passed." : "Basic algebra fast-tracked."}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => goto(3)}
              className="h-11 px-4 rounded-md border border-[#EAE6DF] bg-white/70 text-sm font-medium text-foreground hover:bg-white transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Назад
            </button>
            <button
              onClick={() => goto(5)}
              className="flex-1 h-11 rounded-md bg-foreground text-background text-sm font-semibold tracking-tight hover:bg-foreground/90 transition inline-flex items-center justify-center gap-2"
            >
              Создать аккаунт <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Step 5 — signup */}
      {step === 5 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Создать аккаунт</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Последний шаг — сохраним твой роадмап и цель ({target}).
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
            className="w-full h-11 rounded-md border border-[#EAE6DF] bg-white/80 hover:bg-white transition flex items-center justify-center gap-2 text-sm font-medium text-foreground disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Продолжить с Google
          </button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EAE6DF]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                or with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <MonoLabel>Email</MonoLabel>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@domain.com"
                className="mt-1.5 w-full h-11 px-3 rounded-md bg-white/80 border border-[#EAE6DF] text-sm outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/20 transition"
              />
            </div>
            <div>
              <MonoLabel>Password</MonoLabel>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full h-11 pl-3 pr-10 rounded-md bg-white/80 border border-[#EAE6DF] text-sm outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => goto(4)}
                className="h-11 px-4 rounded-md border border-[#EAE6DF] bg-white/70 text-sm font-medium text-foreground hover:bg-white transition inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Назад
              </button>
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="flex-1 h-11 rounded-md bg-foreground text-background text-sm font-semibold tracking-tight hover:bg-foreground/90 transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Создаём…" : "Создать аккаунт"}
              </button>
            </div>

            {(error || info) && (
              <div
                className={`mt-2 px-3 py-2 rounded-md border text-xs font-mono ${
                  error
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : "border-[#EAE6DF] bg-white/60 text-foreground/80"
                }`}
              >
                {error || info}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

/* ---------------- sign-in view ---------------- */

const SignInView = ({
  onSwitchSignUp,
  onSwitchForgot,
  redirectTo,
}: {
  onSwitchSignUp: () => void;
  onSwitchForgot: () => void;
  redirectTo: string;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setLoading(true);
    setError("");
    try {
      localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    } catch {}
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  };

  const google = async () => {
    if (loading || googleLoading) return;
    setError("");
    setGoogleLoading(true);
    try {
      localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    } catch {}
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        setError(result.error instanceof Error ? result.error.message : "Google sign-in failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const disabled = loading || googleLoading;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h1>
        <p className="text-sm text-muted-foreground mt-1">Continue your structured SAT preparation.</p>
      </div>

      <button
        type="button"
        onClick={google}
        disabled={disabled}
        className="w-full h-11 mb-4 rounded-md border border-[#EAE6DF] bg-white/80 hover:bg-white transition flex items-center justify-center gap-2 text-sm font-medium text-foreground disabled:opacity-60"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continue with Google
      </button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#EAE6DF]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            or with email
          </span>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <MonoLabel>Email</MonoLabel>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@domain.com"
            className="mt-1.5 w-full h-11 px-3 rounded-md bg-white/80 border border-[#EAE6DF] text-sm outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/20 transition"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <MonoLabel>Password</MonoLabel>
            <button
              type="button"
              onClick={onSwitchForgot}
              className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full h-11 pl-3 pr-10 rounded-md bg-white/80 border border-[#EAE6DF] text-sm outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/20 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-3.5 h-3.5 rounded-sm border border-[#EAE6DF] accent-foreground cursor-pointer"
          />
          <span className="text-xs text-muted-foreground">Remember me on this device</span>
        </label>

        <button
          type="submit"
          disabled={disabled}
          className="w-full h-11 mt-2 rounded-md bg-foreground text-background text-sm font-semibold tracking-tight hover:bg-foreground/90 transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Signing in…" : "Continue with email"}
        </button>

        {error && (
          <div className="mt-3 px-3 py-2 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-xs font-mono">
            {error}
          </div>
        )}
      </form>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitchSignUp}
          className="text-foreground font-semibold underline-offset-4 hover:underline"
        >
          Начать подготовку
        </button>
      </p>
    </div>
  );
};

/* ---------------- forgot view ---------------- */

const ForgotView = ({ onSwitchSignIn }: { onSwitchSignIn: () => void }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) setError(err.message);
    else setInfo("Check your email for a password reset link.");
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset password</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send a reset link.</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <MonoLabel>Email</MonoLabel>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@domain.com"
            className="mt-1.5 w-full h-11 px-3 rounded-md bg-white/80 border border-[#EAE6DF] text-sm outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/20 transition"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-2 rounded-md bg-foreground text-background text-sm font-semibold tracking-tight hover:bg-foreground/90 transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Sending…" : "Send reset link"}
        </button>
        {(error || info) && (
          <div
            className={`mt-3 px-3 py-2 rounded-md border text-xs font-mono ${
              error
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-[#EAE6DF] bg-white/60 text-foreground/80"
            }`}
          >
            {error || info}
          </div>
        )}
      </form>
      <p className="text-center text-xs text-muted-foreground mt-6">
        Remembered it?{" "}
        <button
          type="button"
          onClick={onSwitchSignIn}
          className="text-foreground font-semibold underline-offset-4 hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

/* ---------------- page shell ---------------- */

const Auth = () => {
  const [mode, setMode] = useState<Mode>("signup");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirect") || "/";
  const { user } = useAuth();

  // Flush pending onboarding as soon as we have a session (email confirm, OAuth return, etc.)
  useEffect(() => {
    if (user) {
      flushPendingOnboarding(user.id).finally(() => {
        navigate(redirectTo, { replace: true });
      });
    }
  }, [user, navigate, redirectTo]);

  // Show success toast on email confirmation parameters
  useEffect(() => {
    const isEmailConfirm = 
      window.location.search.includes("code=") || 
      window.location.hash.includes("access_token=") ||
      window.location.hash.includes("type=signup");
    
    if (isEmailConfirm) {
      toast.success('Аккаунт успешно подтверждён! Нажмите "Уже есть аккаунт" и войдите под своими данными.');
    }
  }, []);

  const seoTitle =
    mode === "forgot"
      ? "Reset your SATANGO password"
      : mode === "signup"
      ? "Create your SATANGO account"
      : "Sign in to SATANGO";

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative"
      style={{
        backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <SeoHead
        title={seoTitle}
        description="Adaptive Digital SAT preparation with a Socratic AI tutor, diagnostic placement test, and personalized roadmap."
        path="/auth"
      />
      <div className="w-full max-w-[460px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-sm tracking-tight">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Satango</span>
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            // SAT Mastery System
          </p>
        </div>

        <div className="bg-background/90 backdrop-blur-sm border border-[#EAE6DF] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8">
          {mode === "signup" && (
            <Wizard onBackToSignIn={() => setMode("signin")} redirectTo={redirectTo} />
          )}
          {mode === "signin" && (
            <SignInView
              onSwitchSignUp={() => setMode("signup")}
              onSwitchForgot={() => setMode("forgot")}
              redirectTo={redirectTo}
            />
          )}
          {mode === "forgot" && <ForgotView onSwitchSignIn={() => setMode("signin")} />}
        </div>

        <p className="text-center text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-6">
          SECURE · ENCRYPTED · v2.0
        </p>
      </div>
    </main>
  );
};

export default Auth;
