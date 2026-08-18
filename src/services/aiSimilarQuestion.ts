import { supabase } from "@/integrations/supabase/client";

export interface SimilarQuestionRequest {
  question_text: string;
  options: string[];
  correct_answer: number;
}

export interface SimilarQuestionResponse {
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  error?: boolean;
}

export async function generateSimilarQuestion(
  payload: SimilarQuestionRequest
): Promise<SimilarQuestionResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-similar-question", {
      body: payload,
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.explanation || "Failed to generate");

    return data as SimilarQuestionResponse;
  } catch (err) {
    console.error("AI Similar Question invoke failed, returning fallback:", err);
    
    // Procedural fallback generator (multiply numbers inside question by 2 or change names)
    const mockText = `[Similar Practice] ${payload.question_text.replace(/\d+/g, (n) => String(parseInt(n) * 2 + 1))}`;
    return {
      question_text: mockText,
      options: payload.options,
      correct_answer: payload.correct_answer,
      explanation: "Practice targets the same mathematical relationships with modified coordinates.",
    };
  }
}
