import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHearts } from "@/hooks/useHearts";
import { Flame, Gem, Heart, LogOut, Calculator } from "lucide-react";
import { Link } from "react-router-dom";

interface MobileTopBarProps {
  title?: string;
  showStats?: boolean;
}

const MobileTopBar = ({ title, showStats = true }: MobileTopBarProps) => {
  const { user, signOut } = useAuth();
  const { hearts } = useHearts();

  const { data: progress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_progress")
        .select("streak, gems")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  return (
    <header className="sticky top-0 z-40 glass hairline-b safe-top">
      <div className="flex items-center justify-between flex-wrap px-4 h-14">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary mr-2 sm:hidden">←</Link>
        <div className="flex items-center gap-2.5 min-w-0">
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

        <div className="flex items-center gap-2 shrink-0">
          {showStats && progress && (
            <div className="hidden sm:flex items-center border border-divider rounded-md overflow-hidden bg-card">
              <div className="flex items-center gap-1.5 px-2.5 py-1 border-r border-divider">
                <Heart className="w-3.5 h-3.5 text-heart" strokeWidth={2} fill="currentColor" />
                <span className="font-mono-tech font-semibold text-[12px] text-foreground tabular-nums">{hearts}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 border-r border-divider">
                <Flame className="w-3.5 h-3.5 text-streak" strokeWidth={2} />
                <span className="font-mono-tech font-semibold text-[12px] text-foreground tabular-nums">{progress.streak}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1">
                <Gem className="w-3.5 h-3.5 text-gem" strokeWidth={2} />
                <span className="font-mono-tech font-semibold text-[12px] text-foreground tabular-nums">{progress.gems}</span>
              </div>
            </div>
          )}
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
