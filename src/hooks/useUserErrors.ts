/**
 * useUserErrors — Error Log & Mistake Vault ("Карцер" / Vault) system.
 *
 * Persists incorrect answers from practice, mock exams, and diagnostic tests
 * into `user_errors` + local vault, exposes counts for dashboard badges,
 * and clears entries when reviewed correctly.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { recordMistake, removeLocalMistake, getLocalMistakes } from "@/services/mistakeVaultService";

export const ERROR_REVIEW_BONUS = 50;

export const useUserErrors = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const economy = useGameEconomy();

  const { data: errorRows = [], isLoading } = useQuery({
    queryKey: ["user-errors", user?.id],
    queryFn: async () => {
      if (!user) {
        const local = getLocalMistakes();
        return local.map((l) => ({ id: l.id, question_id: l.question_id, created_at: l.created_at }));
      }
      const { data, error } = await supabase
        .from("user_errors" as any)
        .select("id, question_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: true,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["user-errors"] });
  }, [queryClient]);

  /** Persist a wrong answer. */
  const logError = useCallback(
    async (
      questionId: string,
      extra?: {
        question_text?: string;
        topic?: string;
        category?: string;
        options?: string[];
        correct_answer?: number;
        explanation?: string;
        source?: "quiz" | "mock" | "diagnostic";
      }
    ) => {
      if (!questionId) return;
      await recordMistake(user?.id, questionId, extra);
      invalidate();
    },
    [user, invalidate]
  );

  /** Bulk persist wrong answers (e.g. from diagnostic mock or full mock exam). */
  const logMultipleErrors = useCallback(
    async (
      items: Array<{
        questionId: string;
        question_text?: string;
        topic?: string;
        category?: string;
        options?: string[];
        correct_answer?: number;
        explanation?: string;
        source?: "quiz" | "mock" | "diagnostic";
      }>
    ) => {
      if (!items.length) return;
      for (const item of items) {
        await recordMistake(user?.id, item.questionId, item);
      }
      invalidate();
    },
    [user, invalidate]
  );

  /** Clear a single error after the user reviews it correctly. */
  const clearError = useCallback(
    async (questionId: string) => {
      removeLocalMistake(questionId);
      if (user) {
        await supabase
          .from("user_errors" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("question_id", questionId);
      }
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
    logMultipleErrors,
    clearError,
    grantQueueCompletionBonus,
  };
};
