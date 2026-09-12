import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Flame,
  Lock,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import SeoHead from "@/components/SeoHead";

function calculateTargetLevel(correct: number, total: number) {
  const percentage = (correct / total) * 100;
  if (percentage >= 80)
    return {
      title: "Advanced Level",
      copy: "Вы показываете высокий уровень в математике. Вам доступны продвинутые модули и сложные Mock-тесты.",
    };
  if (percentage >= 40)
    return {
      title: "Intermediate Level",
      copy: "Хороший результат! Закрепим ключевые моменты и изучим трюки с Desmos.",
    };
  return {
    title: "Foundations Level",
    copy: "Начнем с базовых концепций и постепенного наращивания сложности.",
  };
}

const REMEMBER_KEY = "satango_remember";
const PENDING_KEY = "satango_pending_onboarding";

type Mode = "login" | "signup";
type WizardStep = 1 | 2 | 3;

interface DiagnosticQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  domain: string;
}

const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: "d1",
    question: "If 3x + 7 = 22, what is the value of 6x - 4?",
    options: ["26", "30", "22", "34"],
    correct: 0,
    explanation: "3x = 15 => x = 5. Then 6(5) - 4 = 26.",
    domain: "Algebra",
  },
  {
    id: "d2",
    question: "A line passes through (2, 5) and (4, 11). What is its slope?",
    options: ["2", "3", "4", "6"],
    correct: 1,
    explanation: "m = (11 - 5) / (4 - 2) = 6 / 2 = 3.",
    domain: "Advanced Math",
  },
  {
    id: "d3",
    question: "If f(x) = x² - 4x + 7, what is the minimum value of f(x)?",
    options: ["3", "7", "0", "4"],
    correct: 0,
    explanation: "Vertex x = -b/(2a) = 4/2 = 2. f(2) = 4 - 8 + 7 = 3.",
    domain: "Advanced Math",
  },
];

const TARGET_PRESETS = [
  {
    score: 1200,
    label: "1200+",
    desc: "Solid Foundation",
    tag: "Fundamentals",
  },
  {
    score: 1400,
    label: "1400+",
    desc: "Top Universities",
    tag: "High Honors",
  },
  {
    score: 1500,
    label: "1500+",
    desc: "Ivy League Tier",
    tag: "Elite 99th",
  },
];

const MonoLabel = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`font-mono-tech text-[10px] text-amber-400/90 tracking-[0.2em] uppercase bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/25 ${className}`}
  >
    {children}
  </span>
);

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const pending = localStorage.getItem(PENDING_KEY);
        if (pending) {
          try {
            const parsed = JSON.parse(pending);
            const user = session.user;
            supabase
              .from("profiles")
              .upsert({
                user_id: user.id,
                target_score: parsed.target_score,
                daily_minutes: parsed.daily_minutes,
                diagnostic_score: parsed.diagnostic_score,
                initial_level: parsed.initial_level,
                updated_at: new Date().toISOString(),
              } as any)
              .then(() => {
                localStorage.removeItem(PENDING_KEY);
                navigate("/dashboard");
              });
            return;
          } catch {}
        }
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#11100f] text-neutral-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden selection:bg-amber-500/30 selection:text-white">
      <SeoHead
        title="Authorization | SATANGO"
        description="Sign in or create your SATANGO account to begin adaptive Digital SAT prep."
        path="/auth"
      />

      {/* Full-screen Background Artwork with Moody Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/philosopher.jpg"
          alt="Philosopher with Golden Kintsugi"
          className="w-full h-full object-cover object-[75%_top] sm:object-right-top brightness-[0.75] contrast-[1.1] scale-105 transition-transform duration-1000"
        />
        {/* Shadow overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#11100f] via-[#11100f]/90 to-[#11100f]/40 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#11100f]/80 via-transparent to-[#11100f]/90" />
      </div>

      {/* Top Header */}
      <header className="flex justify-between items-center max-w-6xl w-full mx-auto relative z-10 pt-2">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-white/20 flex items-center justify-center font-black text-sm text-white shadow-sm group-hover:scale-105 transition">
            S
          </div>
          <span className="font-mono-tech font-extrabold text-base tracking-[0.2em] uppercase text-white">
            SATANGO
          </span>
        </Link>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="font-mono-tech text-xs tracking-widest uppercase text-neutral-400 hover:text-white transition px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/25"
        >
          {mode === "login" ? "// Create Account" : "// Existing User"}
        </button>
      </header>

      {/* Main Form Center Box */}
      <main className="max-w-md w-full mx-auto my-auto py-10 relative z-10">
        <div className="bg-[#171615]/85 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-6 sm:p-8 md:p-9 shadow-2xl space-y-6">
          {mode === "signup" ? (
            <Wizard navigate={navigate} />
          ) : (
            <SignInView onSwitchToSignup={() => setMode("signup")} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-[11px] text-neutral-500 font-mono-tech tracking-widest uppercase relative z-10 pb-2">
        SATANGO ENGINE v2.4 // AI-POWERED ADAPTIVE PREP
      </footer>
    </div>
  );
}

function Wizard({ navigate }: { navigate: (path: string) => void }) {
  const [step, setStep] = useState<WizardStep>(1);
  const [target, setTarget] = useState<number>(1400);
  const [minutes, setMinutes] = useState<number>(30);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const goto = (n: WizardStep) => setStep(n);

  const startAnalysis = () => {
    goto(3);
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 1500);
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
      const redirectUrl = `${window.location.origin}/auth`;
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthErr) {
        toast.error(`Ошибка авторизации Google: ${oauthErr.message}`);
        setError(oauthErr.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      toast.error(`Ошибка входа Google: ${err?.message || err}`);
      setError(err?.message || String(err));
      setGoogleLoading(false);
    }
  };

  const persistPending = () => {
    const correctCount = Object.entries(answers).filter(
      ([qId, idx]) =>
        DIAGNOSTIC_QUESTIONS.find((q) => q.id === qId)?.correct === idx
    ).length;
    const payload = {
      target_score: target,
      daily_minutes: minutes,
      diagnostic_score: correctCount,
      initial_level: calculateTargetLevel(
        correctCount,
        DIAGNOSTIC_QUESTIONS.length
      ),
    };
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
    } catch {}
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setError("");
    setLoading(true);
    persistPending();

    const { error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });

    if (signErr) {
      setError(signErr.message);
      setLoading(false);
    }
  };

  const correctCount = Object.entries(answers).filter(
    ([qId, idx]) =>
      DIAGNOSTIC_QUESTIONS.find((q) => q.id === qId)?.correct === idx
  ).length;

  const diagnosed = calculateTargetLevel(
    correctCount,
    DIAGNOSTIC_QUESTIONS.length
  );

  return (
    <div className="space-y-6">
      {/* Wizard Step Breadcrumbs */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4 font-mono-tech text-[10px] tracking-wider uppercase">
        <span
          className={
            step >= 1 ? "text-amber-400 font-bold" : "text-neutral-500"
          }
        >
          01. GOALS
        </span>
        <span className="text-neutral-600">&gt;</span>
        <span
          className={
            step >= 2 ? "text-amber-400 font-bold" : "text-neutral-500"
          }
        >
          02. DIAGNOSTIC
        </span>
        <span className="text-neutral-600">&gt;</span>
        <span
          className={
            step >= 3 ? "text-amber-400 font-bold" : "text-neutral-500"
          }
        >
          03. ACCOUNT
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <MonoLabel>Target Score</MonoLabel>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2">
              What is your dream SAT score?
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {TARGET_PRESETS.map((p) => {
              const isSelected = target === p.score;
              return (
                <button
                  key={p.score}
                  type="button"
                  onClick={() => setTarget(p.score)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/15 text-white shadow-md shadow-amber-500/10"
                      : "border-white/10 hover:border-white/20 bg-white/5 text-neutral-300"
                  }`}
                >
                  <div className="font-mono-tech font-extrabold text-lg">
                    {p.label}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1 leading-tight">
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <MonoLabel>Daily Commitment</MonoLabel>
            <div className="flex items-center gap-4 mt-2.5 bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl">
              <Flame className="w-5 h-5 text-amber-500 shrink-0" />
              <input
                type="range"
                min={15}
                max={90}
                step={15}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="font-mono-tech font-bold text-base min-w-[60px] text-right text-white">
                {minutes}m/d
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => goto(2)}
            className="w-full py-3.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl font-bold font-mono-tech text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition hover:scale-[1.01] active:scale-[0.99]"
          >
            CONTINUE <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <MonoLabel>Quick Diagnostic</MonoLabel>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2">
              Answer 3 calibration questions
            </h2>
          </div>

          <div className="space-y-3.5">
            {DIAGNOSTIC_QUESTIONS.map((q, idx) => (
              <div
                key={q.id}
                className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl space-y-2.5"
              >
                <div className="text-[10px] font-mono-tech uppercase text-neutral-400">
                  Q{idx + 1}. {q.domain}
                </div>
                <p className="font-medium text-sm text-neutral-200">
                  {q.question}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isChosen = answers[q.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                        }
                        className={`p-2.5 rounded-xl border text-xs font-mono-tech text-left transition-all ${
                          isChosen
                            ? "border-amber-500 bg-amber-500/20 text-amber-300 font-bold"
                            : "border-white/10 hover:border-white/20 bg-white/5 text-neutral-300"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(1)}
              className="px-4 py-3 border border-white/10 rounded-xl font-mono-tech text-sm hover:bg-white/5 text-neutral-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={Object.keys(answers).length < DIAGNOSTIC_QUESTIONS.length}
              onClick={startAnalysis}
              className="flex-1 py-3.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl font-bold font-mono-tech text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              CALCULATE MY BASELINE <Sparkles className="w-4 h-4 text-amber-600" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {analyzing ? (
            <div className="text-center space-y-4 py-12">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-400" />
              <p className="text-sm font-mono-tech text-neutral-400">
                Analyzing your math skills...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <MonoLabel>Diagnostic Result</MonoLabel>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                  {diagnosed.title}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-sm mx-auto">
                  {diagnosed.copy}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono-tech">
                  {error}
                </div>
              )}

              {/* Google OAuth button */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
                className="w-full py-3.5 bg-white/5 border border-white/15 hover:bg-white/10 rounded-xl font-mono-tech text-xs uppercase tracking-wider font-semibold text-white flex items-center justify-center gap-3 transition shadow-sm"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono-tech">
                  <span className="bg-[#171615] px-2 text-neutral-500">
                    or create with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-3">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-neutral-900/90 border-neutral-700/80 font-mono-tech text-sm text-white placeholder:text-neutral-500 rounded-xl h-11"
                />
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-neutral-900/90 border-neutral-700/80 font-mono-tech text-sm text-white placeholder:text-neutral-500 rounded-xl h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl font-bold font-mono-tech text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50 shadow"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "CREATE ACCOUNT"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SignInView({
  onSwitchToSignup,
}: {
  onSwitchToSignup: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const google = async () => {
    if (loading || googleLoading) return;
    setError("");
    setGoogleLoading(true);
    try {
      localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    } catch {}

    try {
      const redirectUrl = `${window.location.origin}/auth`;
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthErr) {
        toast.error(`Ошибка авторизации Google: ${oauthErr.message}`);
        setError(oauthErr.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      toast.error(`Ошибка входа Google: ${err?.message || err}`);
      setError(err?.message || String(err));
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setError("");
    setLoading(true);
    try {
      localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    } catch {}

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const disabled = loading || googleLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <MonoLabel>Welcome Back</MonoLabel>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
          Sign In
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Access your adaptive modules, boss levels, and mock records.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono-tech">
          {error}
        </div>
      )}

      {/* Google OAuth */}
      <button
        type="button"
        onClick={google}
        disabled={disabled}
        className="w-full py-3.5 bg-white/5 border border-white/15 hover:bg-white/10 rounded-xl font-mono-tech text-xs uppercase tracking-wider font-semibold text-white flex items-center justify-center gap-3 transition shadow-sm"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-mono-tech">
          <span className="bg-[#171615] px-2 text-neutral-500">
            or email
          </span>
        </div>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono-tech uppercase text-neutral-400">
            EMAIL
          </label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-neutral-900/90 border-neutral-700/80 font-mono-tech text-sm text-white placeholder:text-neutral-500 rounded-xl h-11"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono-tech uppercase text-neutral-400">
              PASSWORD
            </label>
            <Link
              to="/reset-password"
              className="text-[10px] font-mono-tech text-amber-400/80 hover:text-amber-300 transition uppercase tracking-wider"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-neutral-900/90 border-neutral-700/80 font-mono-tech text-sm text-white placeholder:text-neutral-500 rounded-xl h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              {showPass ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono-tech">
          <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-200">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-neutral-700 accent-amber-500 bg-neutral-900"
            />
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="w-full py-3.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl font-bold font-mono-tech text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "SIGN IN"
          )}
        </button>
      </form>
    </div>
  );
}