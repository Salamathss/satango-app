import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ProfileSummary {
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  onboarding_completed: boolean;
  is_admin: boolean;
  referral_source: string | null;
  streak_days: number;
}

interface ProgressSummary {
  xp: number;
  level: number;
  streak: number;
  gems: number;
  hearts: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: ProfileSummary | null;
  progress: ProgressSummary | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  progress: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

const REMEMBER_KEY = "satango.rememberMe";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const navigate = useNavigate();

  const loadBootstrap = useCallback(async (uid: string) => {
    const [{ data: prof }, { data: prog }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, nickname, avatar_url, is_premium, onboarding_completed, is_admin, streak_days, referral_source")
        .eq("user_id", uid)
        .maybeSingle(),
      supabase
        .from("user_progress")
        .select("xp, level, streak, gems, hearts")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);
    setProfile(prof as ProfileSummary | null);
    setProgress(prog as ProgressSummary | null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadBootstrap(user.id);
  }, [user, loadBootstrap]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        // Defer to avoid deadlocks in the auth callback
        setTimeout(() => loadBootstrap(session.user.id), 0);
      } else {
        setProfile(null);
        setProgress(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) loadBootstrap(session.user.id);
    });

    const handleUnload = () => {
      try {
        if (localStorage.getItem(REMEMBER_KEY) === "0") {
          supabase.auth.signOut();
        }
      } catch {}
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [loadBootstrap]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("SignOut error:", e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setProgress(null);
      try {
        localStorage.removeItem(REMEMBER_KEY);
      } catch {}
      navigate("/auth", { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, progress, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
