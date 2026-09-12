import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import SeoHead from "@/components/SeoHead";

type Status = "verifying" | "ready" | "invalid" | "done";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("verifying");
  const navigate = useNavigate();

  useEffect(() => {
    // Detect explicit error in URL hash (Supabase appends error_description for expired/invalid tokens)
    const hash = window.location.hash.slice(1);
    const hashParams = new URLSearchParams(hash);
    if (hashParams.get("error")) {
      setError(hashParams.get("error_description")?.replace(/\+/g, " ") || "Reset link is invalid or expired.");
      setStatus("invalid");
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setStatus("ready");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("ready");
      else {
        // No session after 2s => the link is likely invalid/expired
        setTimeout(() => {
          setStatus((s) => (s === "verifying" ? "invalid" : s));
        }, 2000);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    setStatus("done");
  };

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-[#11100f] text-neutral-100 font-sans relative overflow-x-hidden selection:bg-amber-500/30 selection:text-white">
      <SeoHead
        title="Set a new SATANGO password"
        description="Complete the SATANGO password reset flow and securely regain access to your Digital SAT prep account."
        path="/reset-password"
      />

      {/* Full-screen Background Artwork */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/philosopher.jpg"
          alt="Philosopher Background"
          className="w-full h-full object-cover object-[75%_top] sm:object-right-top brightness-[0.75] contrast-[1.1] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#11100f] via-[#11100f]/90 to-[#11100f]/40 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#11100f]/80 via-transparent to-[#11100f]/90" />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center max-w-6xl w-full mx-auto relative z-10 pt-2">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-white/20 flex items-center justify-center font-black text-sm text-white shadow-sm group-hover:scale-105 transition">
            S
          </div>
          <span className="font-mono-tech font-extrabold text-base tracking-[0.2em] uppercase text-white">
            SATANGO
          </span>
        </Link>

        <Link
          to="/auth"
          className="font-mono-tech text-xs tracking-widest uppercase text-neutral-400 hover:text-white transition px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/25 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </Link>
      </header>

      {/* Form Container */}
      <div className="w-full max-w-md mx-auto my-auto py-10 relative z-10">
        <div className="bg-[#171615]/85 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-6 sm:p-8 md:p-9 shadow-2xl space-y-6">
          {status === "done" ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">
                  Password updated
                </h1>
                <p className="text-xs text-neutral-400">
                  You can now sign in with your new password.
                </p>
              </div>
              <button
                onClick={() => navigate("/auth", { replace: true })}
                className="w-full h-11 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-bold uppercase tracking-wider transition-all shadow"
              >
                Continue to Sign In
              </button>
            </div>
          ) : status === "invalid" ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">
                  Link invalid or expired
                </h1>
                <p className="text-xs text-neutral-400">
                  {error || "Please request a new password reset email."}
                </p>
              </div>
              <button
                onClick={() => navigate("/auth", { replace: true })}
                className="w-full h-11 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-bold uppercase tracking-wider transition-all shadow"
              >
                Back to Sign In
              </button>
            </div>
          ) : status === "verifying" ? (
            <div className="text-center py-8 text-sm text-neutral-400 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
              <p className="font-mono-tech text-xs uppercase tracking-wider">
                Verifying reset link…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="font-mono-tech text-[10px] text-amber-400/90 tracking-[0.2em] uppercase bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/25">
                  Security
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
                  Set new password
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Choose something at least 6 characters.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono-tech uppercase text-neutral-400">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-neutral-900/90 border border-neutral-700/80 font-mono-tech text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-white/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono-tech uppercase text-neutral-400">
                  Confirm password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-900/90 border border-neutral-700/80 font-mono-tech text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-white/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-bold uppercase tracking-wider transition-all shadow disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Updating…" : "Update password"}
              </button>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono-tech">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-[11px] text-neutral-500 font-mono-tech tracking-widest uppercase relative z-10 pb-2">
        SATANGO ENGINE v2.4 // SECURE AUTHENTICATION
      </footer>
    </main>
  );
};

export default ResetPassword;
