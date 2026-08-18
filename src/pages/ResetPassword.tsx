import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
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
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-background"
      style={{
        backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <SeoHead
        title="Set a new SATANGO password"
        description="Complete the SATANGO password reset flow and securely regain access to your Digital SAT prep account."
        path="/reset-password"
      />
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-sm tracking-tight">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Satango</span>
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
            // Reset password
          </p>
        </div>

        <div className="bg-background/90 backdrop-blur-sm border border-[#EAE6DF] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8">
          {status === "done" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-full border border-[#EAE6DF] bg-white/80 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-foreground" strokeWidth={1.75} />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-foreground mb-1">
                Password updated
              </h1>
              <p className="text-sm text-muted-foreground mb-5">
                You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate("/", { replace: true })}
                className="w-full h-11 rounded-md bg-foreground text-background text-sm font-semibold tracking-tight hover:bg-foreground/90 transition-colors duration-150"
              >
                Continue
              </button>
            </div>
          ) : status === "invalid" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-full border border-destructive/30 bg-destructive/5 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" strokeWidth={1.75} />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-foreground mb-1">
                Link invalid or expired
              </h1>
              <p className="text-sm text-muted-foreground mb-5">
                {error || "Please request a new password reset email."}
              </p>
              <button
                onClick={() => navigate("/auth", { replace: true })}
                className="w-full h-11 rounded-md bg-foreground text-background text-sm font-semibold tracking-tight hover:bg-foreground/90 transition-colors duration-150"
              >
                Back to sign in
              </button>
            </div>
          ) : status === "verifying" ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Verifying reset link…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="mb-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Set new password</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose something at least 6 characters.</p>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
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
                    className="w-full h-11 pl-3 pr-10 rounded-md bg-white/80 border border-[#EAE6DF] text-sm text-foreground outline-none transition-all duration-150 focus:border-foreground/60 focus:ring-1 focus:ring-foreground/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                  Confirm password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full h-11 px-3 rounded-md bg-white/80 border border-[#EAE6DF] text-sm text-foreground outline-none transition-all duration-150 focus:border-foreground/60 focus:ring-1 focus:ring-foreground/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-md bg-foreground text-background text-sm font-semibold tracking-tight hover:bg-foreground/90 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Updating…" : "Update password"}
              </button>
              {error && (
                <div className="mt-3 px-3 py-2 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-xs font-mono">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
