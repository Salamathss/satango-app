/**
 * useQuizProgress — unit/level progression read/write helpers.
 *
 * Every persistence call uses the standard @supabase/supabase-js
 * client so the codebase stays portable across hosts.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getUnitLevels, UnitLevel } from "@/lib/unitLevels";

export type LevelStatus = "completed" | "available" | "locked";

export interface CompleteLevelInput {
  unitId: number;
  levelId: number;
  scoreCorrect: number;
  scoreTotal: number;
  xpEarned: number;
  gemsEarned: number;
}

export const useQuizProgress = (unitId?: number) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: levelProgress = [], isLoading } = useQuery({
    queryKey: ["level-progress", user?.id, unitId],
    queryFn: async () => {
      if (!user) return [];
      const query = supabase
        .from("level_progress")
        .select("*")
        .eq("user_id", user.id);
      const { data, error } = unitId
        ? await query.eq("unit_id", unitId)
        : await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const getLevelStatus = useCallback(
    (level: UnitLevel): LevelStatus => {
      const lp = levelProgress.find(
        (p: any) => p.level_id === level.id && p.unit_id === (unitId ?? p.unit_id)
      );
      if (lp?.is_completed) return "completed";
      if (level.id === 1) return "available";
      const prev = levelProgress.find(
        (p: any) =>
          p.level_id === level.id - 1 && p.unit_id === (unitId ?? p.unit_id)
      );
      return prev?.is_completed ? "available" : "locked";
    },
    [levelProgress, unitId]
  );

  const getUnitCompletion = useCallback(
    (id: number) => {
      const levels = getUnitLevels(id);
      const completed = levelProgress.filter(
        (lp: any) => lp.unit_id === id && lp.is_completed
      ).length;
      const total = levels.length;
      return {
        completed,
        total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    },
    [levelProgress]
  );

  const completeLevel = useCallback(
    async (input: CompleteLevelInput) => {
      if (!user) return;
      const { error } = await (supabase as any).rpc("complete_level", {
        _unit_id: input.unitId,
        _level_id: input.levelId,
        _score_correct: input.scoreCorrect,
        _score_total: input.scoreTotal,
        _mode: "standard",
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["level-progress"] });
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    },
    [user, queryClient]
  );

  return {
    levelProgress,
    isLoading,
    getLevelStatus,
    getUnitCompletion,
    completeLevel,
  };
};
