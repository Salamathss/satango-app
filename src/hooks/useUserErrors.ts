/**
 * useUserErrors — Error Log ("Карцер") system.
 *
 * Persists incorrect answers from practice / boss levels into
 * `user_errors`, exposes a count for dashboard badges, and clears
 * entries when reviewed correctly. Clearing the entire queue
 * grants a +50 Gems completion bonus through useGameEconomy.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useGameEconomy } from "@/hooks/useGameEconomy";

export const ERROR_REVIEW_BONUS = 50;

export const useUserErrors = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const economy = useGameEconomy();

  const { data: errorRows = [], isLoading } = useQuery({
    queryKey: ["user-errors", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_errors" as any)
        .select("id, question_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!user,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["user-errors"] });
  }, [queryClient]);

  /** Persist a wrong answer. Uniqueness on (user_id, question_id) — duplicates are silently ignored. */
  const logError = useCallback(
    async (questionId: string) => {
      if (!user || !questionId) return;
      await supabase
        .from("user_errors" as any)
        .upsert(
          { user_id: user.id, question_id: questionId },
          { onConflict: "user_id,question_id", ignoreDuplicates: true }
        );
      invalidate();
    },
    [user, invalidate]
  );

  /** Clear a single error after the user reviews it correctly. */
  const clearError = useCallback(
    async (questionId: string) => {
      if (!user) return;
      await supabase
        .from("user_errors" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("question_id", questionId);
      invalidate();
    },
    [user, invalidate]
  );

  /** Awards the +50 Gems queue-clear bonus. */
  const grantQueueCompletionBonus = useCallback(async () => {
    await economy.addGems(ERROR_REVIEW_BONUS);
    return ERROR_REVIEW_BONUS;
  }, [economy]);

  return {
    errors: errorRows as Array<{ id: string; question_id: string; created_at: string }>,
    pendingCount: errorRows.length,
    isLoading,
    logError,
    clearError,
    grantQueueCompletionBonus,
  };
};
