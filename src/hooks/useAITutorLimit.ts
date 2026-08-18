import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";

const FREE_DAILY_LIMIT = 3;
const todayUTC = () => new Date().toISOString().slice(0, 10);

/**
 * Read-only view of the user's AI Tutor quota.
 * The authoritative consume/increment happens server-side inside the
 * `ai-tutor` edge function via the `consume_ai_tutor_request` RPC,
 * so the client cannot bypass the limit by editing React state.
 */
export const useAITutorLimit = () => {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const date = todayUTC();

  const { data: usage } = useQuery({
    queryKey: ["ai-tutor-usage", user?.id, date],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from("ai_tutor_usage")
        .select("count")
        .eq("user_id", user.id)
        .eq("usage_date", date)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const count = (usage as any)?.count ?? 0;
  const remaining = isPremium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - count);
  const canUse = isPremium || remaining > 0;

  return { canUse, remaining, count, limit: FREE_DAILY_LIMIT, isPremium };
};
