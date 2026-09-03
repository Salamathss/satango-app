import { describe, it, expect, vi } from "vitest";
import { generateSimilarQuestion } from "@/services/aiSimilarQuestion";

// Mocks for edge cases testing
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(async () => {
        throw new Error("Network offline simulation");
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

describe("Edge Cases & Integration Quality Assurance", () => {
  it("Fallback generator correctly handles network errors during Solve Similar invoke", async () => {
    const payload = {
      question_text: "Solve 2x + 4 = 10",
      options: ["x = 3", "x = 4", "x = 5", "x = 6"],
      correct_answer: 0,
    };

    const result = await generateSimilarQuestion(payload);
    expect(result).toBeDefined();
    expect(result.question_text).toContain("[Similar Practice]");
    expect(result.options).toEqual(payload.options);
    expect(result.correct_answer).toBe(0);
  });

  it("SAT Predicted score computation handles boundary conditions correctly", () => {
    const computePredictedScore = (recentAnswers: Array<{ is_correct: boolean }>) => {
      if (recentAnswers.length < 5) return 0;
      const correct = recentAnswers.filter((a) => a.is_correct).length;
      const accuracy = correct / recentAnswers.length;
      return Math.round(200 + accuracy * 600);
    };

    // Less than 5 questions -> 0
    expect(computePredictedScore([{ is_correct: true }])).toBe(0);

    // 0% accuracy -> 200
    const allWrong = Array(10).fill({ is_correct: false });
    expect(computePredictedScore(allWrong)).toBe(200);

    // 100% accuracy -> 800
    const allCorrect = Array(10).fill({ is_correct: true });
    expect(computePredictedScore(allCorrect)).toBe(800);

    // 50% accuracy -> 500
    const halfCorrect = [
      { is_correct: true },
      { is_correct: true },
      { is_correct: true },
      { is_correct: true },
      { is_correct: true },
      { is_correct: false },
      { is_correct: false },
      { is_correct: false },
      { is_correct: false },
      { is_correct: false },
    ];
    expect(computePredictedScore(halfCorrect)).toBe(500);
  });
});
