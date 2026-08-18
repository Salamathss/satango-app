import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";

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
    <div className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-extrabold text-sm">Level {progress.level}</p>
            <p className="text-xs text-muted-foreground">{currentLevelXP} / {xpForNextLevel} XP</p>
          </div>
        </div>
        <span className="text-2xl font-black text-primary">{progress.xp}</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full animate-xp-fill"
          style={{ "--xp-percent": `${percent}%`, width: `${percent}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
};

export default XPBar;
