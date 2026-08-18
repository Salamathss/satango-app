import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useCallback } from "react";
import { usePremium } from "@/hooks/usePremium";

const MAX_HEARTS = 5;
const REGEN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const GEM_REFILL_COST = 150;

export const useHearts = () => {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
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

  // Calculate regenerated hearts
  const getHeartsWithRegen = useCallback(() => {
    if (!progress) return { hearts: MAX_HEARTS, nextRegenAt: null };
    const now = Date.now();
    const lastUpdate = new Date(progress.hearts_updated_at).getTime();
    const elapsed = now - lastUpdate;
    const regenCount = Math.floor(elapsed / REGEN_INTERVAL_MS);
    const currentHearts = Math.min(MAX_HEARTS, (progress.hearts ?? MAX_HEARTS) + regenCount);
    const nextRegenAt = currentHearts < MAX_HEARTS
      ? new Date(lastUpdate + (regenCount + 1) * REGEN_INTERVAL_MS)
      : null;
    return { hearts: currentHearts, nextRegenAt };
  }, [progress]);

  const { hearts, nextRegenAt } = getHeartsWithRegen();

  // Auto-refresh on regen timer
  useEffect(() => {
    if (!nextRegenAt) return;
    const ms = nextRegenAt.getTime() - Date.now();
    if (ms <= 0) return;
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    }, ms + 500);
    return () => clearTimeout(timer);
  }, [nextRegenAt, queryClient]);

  const loseHeart = useCallback(async () => {
    if (!user || hearts <= 0) return;
    if (isPremium) return; // Infinite hearts for premium users
    await (supabase as any).rpc("up_lose_heart");
    queryClient.invalidateQueries({ queryKey: ["user-progress"] });
  }, [user, hearts, queryClient, isPremium]);

  const refillWithGems = useCallback(async () => {
    if (!user || !progress || (progress.gems ?? 0) < GEM_REFILL_COST) return false;
    const { data, error } = await (supabase as any).rpc("up_refill_hearts_with_gems");
    queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    if (error) return false;
    return (data as any)?.ok === true;
  }, [user, progress, queryClient]);

  const effectiveHearts = isPremium ? MAX_HEARTS : hearts;

  return {
    hearts: effectiveHearts,
    maxHearts: MAX_HEARTS,
    nextRegenAt: isPremium ? null : nextRegenAt,
    isLoading,
    canPlay: isPremium || hearts > 0,
    isInfinite: isPremium,
    loseHeart,
    refillWithGems,
    gemRefillCost: GEM_REFILL_COST,
    gems: progress?.gems ?? 0,
  };
};
