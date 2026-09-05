import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHearts } from "@/hooks/useHearts";
import { Flame, Gem, Heart, LogOut, Calculator, Sun, Moon, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

interface MobileTopBarProps {
  title?: string;
  showStats?: boolean;
}

const MobileTopBar = ({ title, showStats = true }: MobileTopBarProps) => {
  const { user, signOut } = useAuth();
  const { hearts } = useHearts();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const { data: progress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ data: progData }, { data: profData }] = await Promise.all([
        supabase
          .from("user_progress")
          .select("streak, gems")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("streak_days")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const streak = progData?.streak ?? profData?.streak_days ?? 0;
      const gems = progData?.gems ?? 0;

      return { streak, gems };
    },
    enabled: !!user,
  });

  return (
    <header className="sticky top-0 z-40 glass hairline-b safe-top">
      <div className="flex items-center justify-between flex-wrap px-4 h-14">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary mr-2 sm:hidden">←</Link>
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo-light.png" alt="SATANGO Logo" className="w-6 h-6 rounded-md object-contain shrink-0" />
          <span className="font-mono-tech font-bold text-[13px] tracking-[0.18em] uppercase text-foreground">
            SATANGO
          </span>
          {title && (
            <>
              
              <span className="text-muted-foreground font-medium text-[13px] truncate">
                {title}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {showStats && progress && (
            <div className="flex items-center border border-divider rounded-md overflow-hidden bg-card text-foreground">
              <div className="flex items-center gap-1 px-1.5 xs:px-2 py-1 border-r border-divider" title="Hearts">
                <Heart className="w-3.5 h-3.5 text-heart shrink-0" strokeWidth={2} fill="currentColor" />
                <span className="font-mono-tech font-semibold text-[11px] sm:text-[12px] tabular-nums">{hearts}</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 xs:px-2 py-1 border-r border-divider" title="Streak">
                <Flame className="w-3.5 h-3.5 text-streak shrink-0" strokeWidth={2} fill="currentColor" />
                <span className="font-mono-tech font-semibold text-[11px] sm:text-[12px] tabular-nums">{progress.streak}</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 xs:px-2 py-1" title="Gems">
                <Gem className="w-3.5 h-3.5 text-gem shrink-0" strokeWidth={2} fill="currentColor" />
                <span className="font-mono-tech font-semibold text-[11px] sm:text-[12px] tabular-nums">{progress.gems}</span>
              </div>
            </div>
          )}

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-divider bg-card text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-hover))] transition-colors duration-150"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Language selector */}
          <button
            onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
            aria-label="Toggle language"
            title="Change language"
            className="inline-flex items-center justify-center px-2 h-8 rounded-md border border-divider bg-card text-[11px] font-bold font-mono-tech text-foreground hover:bg-[hsl(var(--surface-hover))] transition-colors duration-150 gap-1"
          >
            <Languages className="w-3 h-3 text-muted-foreground" />
            <span>{language.toUpperCase()}</span>
          </button>

          <Link
            to="/score-calculator"
            aria-label="Score calculator"
            title="Score calculator"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-divider bg-card text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-hover))] transition-colors duration-150"
          >
            <Calculator className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
          {user && (
            <button
              onClick={() => signOut()}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-divider bg-card text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-hover))] transition-colors duration-150"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileTopBar;
