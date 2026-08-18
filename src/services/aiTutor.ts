/**
 * AI Tutor service — clean abstraction over the AI tutor backend call.
 *
 * Uses the standard @supabase/supabase-js client, which reads
 * VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from
 * import.meta.env. This means the service works on any host
 * (Vercel, Netlify, etc.) as long as those env vars are configured.
 */
import { supabase } from "@/integrations/supabase/client";

export interface AITutorRequest {
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
  userLevel?: number;
}

export interface AITutorResponse {
  explanation: string;
  quotaExceeded?: boolean;
}

export async function fetchAITutorExplanation(
  payload: AITutorRequest
): Promise<AITutorResponse> {
  const { data, error } = await supabase.functions.invoke("ai-tutor", {
    body: payload,
  });

  if (error) {
    // Edge function returns non-2xx for quota; surface the flag if present.
    const ctx: any = (error as any).context;
    if (ctx?.status === 403) {
      return { explanation: "", quotaExceeded: true };
    }
    throw error;
  }

  if (data?.quotaExceeded) return { explanation: "", quotaExceeded: true };

  return {
    explanation:
      data?.explanation ||
      "Sorry, I couldn't generate an explanation right now.",
  };
}

export function buildFallbackExplanation(
  options: string[],
  correctAnswer: number,
  fallbackText?: string
): string {
  return `🔍 **The Trap You Fell Into**\nThis is a common misconception in this topic area.\n\n📚 **Step-by-Step Breakdown**\n• The correct answer is **${String.fromCharCode(
    65 + correctAnswer
  )}: ${options[correctAnswer]}**\n• ${
    fallbackText || "Review the underlying concept to strengthen your understanding."
  }\n• Try breaking the problem into smaller parts.\n\n💡 **SAT Pro Tip**\nEliminate obviously wrong answers first to improve your odds.`;
}
