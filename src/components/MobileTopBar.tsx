// src/components/MobileTopBar.tsx
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHearts } from "@/hooks/useHearts";
import { Flame, Gem, Heart, LogOut, Calculator, Sun, Moon, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { SoundToggle } from "@/components/SoundToggle";
import { StreakRepairDialog } from "@/components/StreakRepairDialog";

interface MobileTopBarProps {
  title?: string;
  showStats?: boolean;
}

const MobileTopBar = ({ title, showStats = true }: MobileTopBarProps) => {
  const { user, signOut } = useAuth();
  const { hearts } = useHearts();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [streakRepairOpen, setStreakRepairOpen] = useState(false);
  const isRu = language === "ru";

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

      const streak = Math.max(progData?.streak ?? 0, profData?.streak_days ?? 0);
      const gems = progData?.gems ?? 0;

      return { streak, gems };
    },
    enabled: !!user,
  });

  return (
    <header className="sticky top-0 z-40 bg-card/90 dark:bg-card/80 backdrop-blur-md border-b border-border/70 safe-top select-none">
      <div className="flex items-center justify-between px-3.5 sm:px-6 h-13 sm:h-14 w-full">
        {/* Left side: back link on mobile + brand or breadcrumbs */}
        <div className="flex items-center min-w-0 mr-3">
          <Link
            to="/"
            aria-label="Home"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:hidden mr-1 shrink-0"
          >
            ←
          </Link>

          {/* Mobile view brand mark */}
          <div className="flex items-center gap-2 min-w-0 lg:hidden">
            <Link
              to="/"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md group"
              aria-label="SATANGO"
            >
              <div className="w-6 h-6 rounded-md border border-border/70 bg-background/50 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                <img
                  src="/logo-light.png"
                  alt="SATANGO Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="wordmark font-mono-tech font-bold text-xs tracking-[0.08em] uppercase text-foreground shrink-0">
                SATANGO
              </span>
            </Link>
            {title && (
              <>
                <span className="text-border/80 select-none text-xs" aria-hidden="true">
                  /
                </span>
                <span className="text-muted-foreground font-medium text-xs truncate">
                  {title}
                </span>
              </>
            )}
          </div>

          {/* Desktop breadcrumb context */}
          <div className="hidden lg:flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono-tech text-muted-foreground/80 shrink-0 select-none">
              {t("home")}
            </span>
            {title && (
              <>
                <span className="text-border select-none text-xs" aria-hidden="true">
                  /
                </span>
                <span className="text-xs font-semibold text-foreground tracking-tight truncate">
                  {title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side: stats pill + controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {showStats && progress && (
            <div
              className="flex items-center border border-border/70 rounded-md overflow-hidden bg-card/80 text-foreground divide-x divide-border/60 shadow-2xs"
              role="group"
              aria-label="User statistics"
            >
              <div
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1"
                title={t("hearts")}
              >
                <Heart
                  className="w-3.5 h-3.5 text-heart shrink-0"
                  strokeWidth={2}
                  fill="currentColor"
                />
                <span className="font-mono-tech font-semibold text-[11px] sm:text-xs tabular-nums text-foreground">
                  {hearts}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStreakRepairOpen(true)}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 hover:bg-amber-500/10 transition-colors cursor-pointer tap-feedback group"
                title={isRu ? "Нажмите для восстановления стрика" : "Click to repair streak"}
              >
                <Flame
                  className="w-3.5 h-3.5 text-streak shrink-0 group-hover:scale-110 transition-transform"
                  strokeWidth={2}
                  fill="currentColor"
                />
                <span className="font-mono-tech font-semibold text-[11px] sm:text-xs tabular-nums text-foreground">
                  {progress.streak}
                </span>
              </button>
              <div
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1"
                title={t("gems")}
              >
                <Gem
                  className="w-3.5 h-3.5 text-gem shrink-0"
                  strokeWidth={2}
                  fill="currentColor"
                />
                <span className="font-mono-tech font-semibold text-[11px] sm:text-xs tabular-nums text-foreground">
                  {progress.gems}
                </span>
              </div>
            </div>
          )}

          {/* Quick Streak Repair Header Button */}
          {user && (
            <button
              onClick={() => setStreakRepairOpen(true)}
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 h-8 rounded-md border border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono-tech text-[11px] font-bold motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-2xs tap-feedback"
              title={isRu ? "Восстановить стрик за 150 💎" : "Repair streak for 150 💎"}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-current animate-pulse shrink-0" />
              <span className="hidden sm:inline">
                {isRu ? "Streak Repair" : "Repair Streak"}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold sm:ml-0.5">
                150💎
              </span>
            </button>
          )}

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === "dark" ? t("lightMode") : t("darkMode")}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border/70 bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted/60 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted disabled:opacity-50 disabled:pointer-events-none shadow-2xs"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Audio Sound effects toggle */}
          <SoundToggle />

          {/* Language selector */}
          <button
            onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
            aria-label="Toggle language"
            title="Change language"
            className="inline-flex items-center justify-center px-2 h-8 rounded-md border border-border/70 bg-card/80 text-[11px] font-semibold font-mono-tech text-foreground hover:bg-muted/60 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted disabled:opacity-50 disabled:pointer-events-none gap-1 shadow-2xs"
          >
            <Languages className="w-3 h-3 text-muted-foreground" />
            <span>{language.toUpperCase()}</span>
          </button>

          <Link
            to="/score-calculator"
            aria-label="Score calculator"
            title={t("calculator")}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border/70 bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted/60 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted shadow-2xs"
          >
            <Calculator className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>

          {user && (
            <button
              onClick={() => signOut()}
              aria-label={t("signOut")}
              title={t("signOut")}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border/70 bg-card/80 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted disabled:opacity-50 disabled:pointer-events-none shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      <StreakRepairDialog
        open={streakRepairOpen}
        onOpenChange={setStreakRepairOpen}
      />
    </header>
  );
};

export default MobileTopBar;
