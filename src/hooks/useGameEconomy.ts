/**
 * useGameEconomy — single source of truth for Gems, Hearts and Streak.
 *
 * All mutations go through SECURITY DEFINER RPCs (`up_*`). Direct UPDATEs to
 * `user_progress` from the browser are blocked by RLS.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useHearts } from "@/hooks/useHearts";

const DAILY_REWARDS = [10, 15, 20, 30, 40, 60, 100];

export interface EconomySnapshot {
  gems: number;
  xp: number;
  level: number;
  streak: number;
  dailyCheckInStreak: number;
  lastCheckInDate: string | null;
  lastActivityDate: string | null;
  streakFreezeCount: number;
}

export const useGameEconomy = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hearts = useHearts();

  const { data: progress, isLoading } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["user-progress"] });
  }, [queryClient]);

  /**
   * Award the error-queue clear bonus. The server verifies the queue is empty
   * and limits the bonus to once per UTC day; the `delta` argument is ignored
   * (the amount is fixed server-side). Returns the new gem balance, or 0 if
   * the bonus was rejected (queue not empty / already claimed today).
   */
  const addGems = useCallback(
    async (_delta?: number) => {
      if (!user) return 0;
      const { data, error } = await (supabase as any).rpc("up_clear_error_queue_bonus");
      if (error) return 0;
      invalidate();
      if (!(data as any)?.ok) return 0;
      return (data as any)?.gems ?? 0;
    },
    [user, invalidate]
  );

  /** XP is now awarded only through `complete_level`. Kept as a no-op shim for legacy callers. */
  const addXp = useCallback(async (_delta: number) => {
    // intentionally no-op — XP must come from a validated quiz completion
  }, []);

  /** Bump day-streak through the server. */
  const updateStreakOnActivity = useCallback(async () => {
    if (!user) return;
    const { error } = await (supabase as any).rpc("up_bump_streak_on_activity");
    if (error) throw error;
    invalidate();
  }, [user, invalidate]);

  /** Claim today's daily check-in chest. Returns the reward (0 if already claimed). */
  const claimDailyCheckIn = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    const { data, error } = await (supabase as any).rpc("up_daily_check_in");
    if (error) throw error;
    invalidate();
    return (data as any)?.reward ?? 0;
  }, [user, invalidate]);

  const economy: EconomySnapshot = {
    gems: progress?.gems ?? 0,
    xp: progress?.xp ?? 0,
    level: progress?.level ?? 1,
    streak: progress?.streak ?? 0,
    dailyCheckInStreak: progress?.daily_check_in_streak ?? 0,
    lastCheckInDate: progress?.last_check_in_date ?? null,
    lastActivityDate: progress?.last_activity_date ?? null,
    streakFreezeCount: progress?.streak_freeze_count ?? 0,
  };

  return {
    ...economy,
    hearts: hearts.hearts,
    maxHearts: hearts.maxHearts,
    nextRegenAt: hearts.nextRegenAt,
    canPlay: hearts.canPlay,
    loseHeart: hearts.loseHeart,
    refillHeartsWithGems: hearts.refillWithGems,
    heartRefillCost: hearts.gemRefillCost,
    isLoading: isLoading || hearts.isLoading,
    addGems,
    addXp,
    updateStreakOnActivity,
    claimDailyCheckIn,
    DAILY_REWARDS,
  };
};
