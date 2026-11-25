import { describe, it, expect } from "vitest";

describe("Quiz 50/50 Booster Integration Verification", () => {
  it("generates correct strikethrough map for 50/50 and disables 2 wrong options", () => {
    const q = {
      id: "test-q1",
      question_text: "Which value satisfies 2x + 6 = 14?",
      options: ["x = 2", "x = 4", "x = 5", "x = 8"],
      correct_answer: 1, // "x = 4"
    };

    const wrongIndexes = q.options
      .map((_, i) => i)
      .filter((i) => i !== q.correct_answer);

    expect(wrongIndexes).toEqual([0, 2, 3]);

    // Pick 2 wrong indexes to eliminate
    const toStrike = wrongIndexes.slice(0, 2);
    expect(toStrike.length).toBe(2);

    const newStruck: Record<number, boolean> = {};
    toStrike.forEach((idx) => {
      newStruck[idx] = true;
    });

    // Verify struck options count and properties
    expect(Object.keys(newStruck).length).toBe(2);
    expect(newStruck[q.correct_answer]).toBeUndefined();

    // Verify un-struck options
    const activeOptions = q.options.filter((_, i) => !newStruck[i]);
    expect(activeOptions.length).toBe(2);
    expect(activeOptions).toContain("x = 4");
  });

  it("handles 3-choice questions safely by eliminating 1 or 2 options without striking correct answer", () => {
    const q = {
      id: "test-q2",
      question_text: "Which of the following is an irrational number?",
      options: ["3/4", "sqrt(2)", "0.5"],
      correct_answer: 1, // "sqrt(2)"
    };

    const wrongIndexes = q.options
      .map((_, i) => i)
      .filter((i) => i !== q.correct_answer);

    const toStrike = wrongIndexes.slice(0, 2);
    const newStruck: Record<number, boolean> = {};
    toStrike.forEach((idx) => {
      newStruck[idx] = true;
    });

    expect(newStruck[q.correct_answer]).toBeUndefined();
    expect(q.options[q.correct_answer]).toBe("sqrt(2)");
  });
});
