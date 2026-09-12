import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Sparkles } from "lucide-react";

const XPBar = () => {
  const { user } = useAuth();

  const { data: progress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  if (!progress) return null;

  const xpForNextLevel = progress.level * 100;
  const currentLevelXP = progress.xp % xpForNextLevel;
  const percent = Math.min((currentLevelXP / xpForNextLevel) * 100, 100);

  return (
    <div className="relative z-10 bg-card/90 dark:bg-[#171615]/90 backdrop-blur-xl border border-border/80 dark:border-white/[0.12] rounded-3xl p-5 shadow-sm space-y-3.5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Zap className="w-4 h-4 fill-amber-500/40" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tech text-[10px] uppercase tracking-widest text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                LEVEL {progress.level}
              </span>
              <span className="font-extrabold text-sm text-foreground">Scholar</span>
            </div>
            <p className="text-[11px] font-mono-tech text-muted-foreground mt-0.5">
              {currentLevelXP} / {xpForNextLevel} XP to Level {progress.level + 1}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono-tech text-2xl font-black text-foreground tabular-nums">
            {progress.xp}
          </span>
          <span className="font-mono-tech text-xs text-muted-foreground ml-1 uppercase">XP</span>
        </div>
      </div>

      {/* Glowing XP Progress Bar */}
      <div className="h-3 bg-muted/60 dark:bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-border/70 dark:border-white/10">
        <div
          className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default XPBar;
