import { supabase } from "@/integrations/supabase/client";

export interface MistakeRecord {
  id: string;
  question_id: string;
  question_text?: string;
  topic?: string;
  category?: string;
  options?: string[];
  correct_answer?: number;
  explanation?: string;
  created_at: string;
  source?: "quiz" | "mock" | "diagnostic";
}

const LOCAL_STORAGE_VAULT_KEY = "satango_mistake_vault";

/**
 * Save a mistake locally as backup and to Supabase user_errors table
 */
export const recordMistake = async (
  userId: string | undefined,
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

  // Local storage caching
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VAULT_KEY);
    const list: MistakeRecord[] = raw ? JSON.parse(raw) : [];
    if (!list.some((m) => m.question_id === questionId)) {
      list.unshift({
        id: `local_${Date.now()}_${questionId}`,
        question_id: questionId,
        question_text: extra?.question_text,
        topic: extra?.topic,
        category: extra?.category,
        options: extra?.options,
        correct_answer: extra?.correct_answer,
        explanation: extra?.explanation,
        created_at: new Date().toISOString(),
        source: extra?.source || "quiz",
      });
      localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(list.slice(0, 200)));
    }
  } catch (e) {
    console.error("Local mistake storage error:", e);
  }

  // Supabase sync if signed in
  if (userId) {
    try {
      await supabase.from("user_errors" as any).upsert(
        { user_id: userId, question_id: questionId },
        { onConflict: "user_id,question_id", ignoreDuplicates: true }
      );
    } catch (e) {
      console.error("Supabase mistake sync error:", e);
    }
  }
};

/**
 * Remove resolved mistake from local vault
 */
export const removeLocalMistake = (questionId: string) => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VAULT_KEY);
    if (!raw) return;
    const list: MistakeRecord[] = JSON.parse(raw);
    const filtered = list.filter((m) => m.question_id !== questionId);
    localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Remove local mistake error:", e);
  }
};

/**
 * Get all cached mistakes from localStorage
 */
export const getLocalMistakes = (): MistakeRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
