import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";

export const FREE_DAILY_LIMIT = 5;
const todayUTC = () => new Date().toISOString().slice(0, 10);

/**
 * Read-only view of the user's Socratic AI Tutor quota.
 * - Free users: 5 queries per day.
 * - Satango Plus / Pro users: Unlimited.
 */
export const useAITutorLimit = () => {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const date = todayUTC();

  const { data: usage } = useQuery({
    queryKey: ["ai-tutor-usage", user?.id, date],
    queryFn: async () => {
      if (!user) {
        try {
          const localCount = parseInt(localStorage.getItem(`satango_ai_usage_${date}`) || "0", 10);
          return { count: localCount };
        } catch {
          return { count: 0 };
        }
      }
      const { data } = await (supabase as any)
        .from("ai_tutor_usage")
        .select("count")
        .eq("user_id", user.id)
        .eq("usage_date", date)
        .maybeSingle();
      return data;
    },
    enabled: true,
  });

  const count = (usage as any)?.count ?? 0;
  const remaining = isPremium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - count);
  const canUse = isPremium || remaining > 0;

  return { canUse, remaining, count, limit: FREE_DAILY_LIMIT, isPremium };
};
