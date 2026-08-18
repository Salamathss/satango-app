import { Flame, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StreakWarning = () => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["streak-warning", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ data: progress }, { data: profile }] = await Promise.all([
        supabase.from("user_progress").select("streak, last_activity_date").eq("user_id", user.id).single(),
        supabase.from("profiles").select("nickname, display_name").eq("user_id", user.id).single(),
      ]);
      return { progress, profile };
    },
    enabled: !!user,
  });

  if (!data?.progress || data.progress.streak < 2) return null;

  const today = new Date().toISOString().split("T")[0];
  const lastActivity = data.progress.last_activity_date;

  // Only show warning if they haven't played today
  if (lastActivity === today) return null;

  const name = data.profile?.nickname || data.profile?.display_name?.split(" ")[0] || "";

  return (
    <div className="bg-gradient-to-r from-destructive/10 to-[hsl(35,95%,55%,0.1)] border border-destructive/20 rounded-2xl px-4 py-3 flex items-center gap-3 animate-bounce-in">
      <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
        <Flame className="w-5 h-5 text-streak animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">
          {name ? `${name}, т` : "Т"}вой streak под угрозой! 🔥
        </p>
        <p className="text-xs text-muted-foreground">
          Пройди один уровень, чтобы сохранить {data.progress.streak}-дневную серию!
        </p>
      </div>
      <AlertTriangle className="w-5 h-5 text-streak shrink-0" />
    </div>
  );
};

export default StreakWarning;
