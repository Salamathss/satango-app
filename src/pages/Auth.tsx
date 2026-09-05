import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle2, Trophy, Flame } from "lucide-react";
import { toast } from "sonner";

function calculateTargetLevel(correct: number, total: number) {
  const percentage = (correct / total) * 100;
  if (percentage >= 80) return { title: "Advanced Level", copy: "Вы показываете высокий уровень в математике. Вам доступны продвинутые модули и сложные Mock-тесты." };
  if (percentage >= 40) return { title: "Intermediate Level", copy: "Хороший результат! Закрепим ключевые моменты и изучим трюки с Desmos." };
  return { title: "Foundations Level", copy: "Начнем с базовых концепций и постепенного наращивания сложности." };
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
  { score: 1200, label: "1200+", desc: "Solid Foundation", color: "from-blue-500/20 to-cyan-500/20" },
  { score: 1400, label: "1400+", desc: "Top Universities", color: "from-purple-500/20 to-pink-500/20" },
  { score: 1500, label: "1500+", desc: "Ivy League Tier", color: "from-amber-500/20 to-orange-500/20" },
];

const MonoLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-xs text-primary/80 tracking-widest uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
    {children}
  </span>
);

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const pending = localStorage.getItem(PENDING_KEY);
        if (pending) {
          try {
            const parsed = JSON.parse(pending);
            const user = session.user;
            supabase.from("profiles").upsert({
              user_id: user.id,
              target_score: parsed.target_score,
              daily_minutes: parsed.daily_minutes,
              diagnostic_score: parsed.diagnostic_score,
              initial_level: parsed.initial_level,
              updated_at: new Date().toISOString(),
            } as any).then(() => {
              localStorage.removeItem(PENDING_KEY);
              navigate("/dashboard");
            });
            return;
          } catch { }
        }
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="flex justify-between items-center max-w-6xl w-full mx-auto z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src="/logo-light.png" alt="SATANGO Logo" className="w-8 h-8 rounded-xl object-contain shadow-sm" />
          <span className="font-mono font-bold text-lg tracking-tight">SATANGO</span>
        </div>
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === "login" ? "// Create Account" : "// Existing User"}
        </button>
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-12 z-10">
        {mode === "signup" ? <Wizard navigate={navigate} /> : <SignInView />}
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-muted-foreground font-mono z-10">
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
    setTimeout(() => setAnalyzing(false), 2000);
  };

  const handleGoogle = async () => {
    if (loading || googleLoading) return;
    setError("");
    setGoogleLoading(true);
    persistPending();
    try {
      localStorage.setItem(REMEMBER_KEY, "1");
    } catch { }

    try {
      const redirectUrl = `${window.location.origin}/auth`;
      console.log("Initiating Google OAuth with redirectTo:", redirectUrl);
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthErr) {
        console.error("Google OAuth Error:", oauthErr);
        toast.error(`Ошибка авторизации Google: ${oauthErr.message}`);
        setError(oauthErr.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error("Google OAuth Exception:", err);
      toast.error(`Ошибка входа Google: ${err?.message || err}`);
      setError(err?.message || String(err));
      setGoogleLoading(false);
    }
  };

  const persistPending = () => {
    const correctCount = Object.entries(answers).filter(
      ([qId, idx]) => DIAGNOSTIC_QUESTIONS.find((q) => q.id === qId)?.correct === idx
    ).length;
    const payload = {
      target_score: target,
      daily_minutes: minutes,
      diagnostic_score: correctCount,
      initial_level: calculateTargetLevel(correctCount, DIAGNOSTIC_QUESTIONS.length),
    };
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
    } catch { }
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
    ([qId, idx]) => DIAGNOSTIC_QUESTIONS.find((q) => q.id === qId)?.correct === idx
  ).length;

  const diagnosed = calculateTargetLevel(correctCount, DIAGNOSTIC_QUESTIONS.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-4 font-mono text-xs">
        <span className={step >= 1 ? "text-primary font-bold" : "text-muted-foreground"}>01. GOALS</span>
        <span className="text-muted-foreground">&gt;</span>
        <span className={step >= 2 ? "text-primary font-bold" : "text-muted-foreground"}>02. DIAGNOSTIC</span>
        <span className="text-muted-foreground">&gt;</span>
        <span className={step >= 3 ? "text-primary font-bold" : "text-muted-foreground"}>03. ACCOUNT</span>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <MonoLabel>Target Score</MonoLabel>
            <h2 className="text-2xl font-bold tracking-tight mt-2">What is your dream SAT score?</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {TARGET_PRESETS.map((p) => (
              <button
                key={p.score}
                type="button"
                onClick={() => setTarget(p.score)}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${target === p.score
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/5"
                  : "border-border hover:border-primary/50 bg-card"
                  }`}
              >
                <div className="font-mono font-bold text-xl">{p.label}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{p.desc}</div>
              </button>
            ))}
          </div>

          <div>
            <MonoLabel>Daily Commitment</MonoLabel>
            <div className="flex items-center gap-4 mt-3 bg-card border border-border p-4 rounded-xl">
              <Flame className="w-5 h-5 text-amber-500" />
              <input
                type="range"
                min={15}
                max={90}
                step={15}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <span className="font-mono font-bold text-lg min-w-[60px] text-right">{minutes}m/d</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => goto(2)}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold font-mono flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            CONTINUE <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <MonoLabel>Quick Diagnostic</MonoLabel>
            <h2 className="text-2xl font-bold tracking-tight mt-2">Answer 3 calibration questions</h2>
          </div>

          <div className="space-y-4">
            {DIAGNOSTIC_QUESTIONS.map((q, idx) => (
              <div key={q.id} className="bg-card border border-border p-4 rounded-xl space-y-3">
                <div className="text-xs font-mono text-muted-foreground">Q{idx + 1}. {q.domain}</div>
                <p className="font-medium text-sm">{q.question}</p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                      className={`p-2.5 rounded-lg border text-xs font-mono text-left transition-all ${answers[q.id] === optIdx
                        ? "border-primary bg-primary/20 text-primary font-bold"
                        : "border-border hover:border-primary/40"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(1)}
              className="px-4 py-3 border border-border rounded-xl font-mono text-sm hover:bg-card"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={Object.keys(answers).length < DIAGNOSTIC_QUESTIONS.length}
              onClick={startAnalysis}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold font-mono flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              CALCULATE MY BASELINE <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {analyzing ? (
            <div className="text-center space-y-4 py-12">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              <p className="text-sm font-mono text-muted-foreground">Analyzing your math skills...</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <MonoLabel>Diagnostic Result</MonoLabel>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mt-2">
                  {diagnosed.title}
                </h1>
                <p className="text-sm text-foreground/80 leading-relaxed mt-2">{diagnosed.copy}</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
                className="w-full py-3 bg-card border border-border rounded-xl font-mono text-sm font-semibold flex items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase font-mono">
                  <span className="bg-background px-2 text-muted-foreground">or email</span>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-3">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-card font-mono text-sm"
                />
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-card font-mono text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold font-mono hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "CREATE ACCOUNT"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SignInView() {
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
    } catch { }

    try {
      const redirectUrl = `${window.location.origin}/auth`;
      console.log("Initiating Google OAuth in SignInView with redirectTo:", redirectUrl);
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthErr) {
        console.error("Google OAuth Error:", oauthErr);
        toast.error(`Ошибка авторизации Google: ${oauthErr.message}`);
        setError(oauthErr.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error("Google OAuth Exception:", err);
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
    } catch { }

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground mt-2">Sign In</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={google}
        disabled={disabled}
        className="w-full py-3 bg-card border border-border rounded-xl font-mono text-sm font-semibold flex items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase font-mono">
          <span className="bg-background px-2 text-muted-foreground">or email</span>
        </div>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">EMAIL</label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-card font-mono text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">PASSWORD</label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-card font-mono text-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-border accent-primary"
            />
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold font-mono hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIGN IN"}
        </button>
      </form>
    </div>
  );
}