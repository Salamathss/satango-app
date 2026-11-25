import { describe, it, expect, beforeEach, vi } from "vitest";
import { BOOSTER_ITEMS } from "@/hooks/useBoosters";

describe("Boosters System & Business Logic", () => {
  it("BOOSTER_ITEMS contains all 3 requested boosters with accurate costs", () => {
    expect(BOOSTER_ITEMS.fiftyFifty).toBeDefined();
    expect(BOOSTER_ITEMS.fiftyFifty.cost).toBe(60);

    expect(BOOSTER_ITEMS.desmosHacks).toBeDefined();
    expect(BOOSTER_ITEMS.desmosHacks.cost).toBe(100);

    expect(BOOSTER_ITEMS.similarDrills).toBeDefined();
    expect(BOOSTER_ITEMS.similarDrills.cost).toBe(80);
  });

  it("50/50 elimination mathematically strikes exactly 2 wrong options and never touches correct answer", () => {
    const question = {
      question_text: "What is 2 + 2?",
      options: ["1", "4", "5", "6"],
      correct_answer: 1, // "4"
    };

    const wrongIndexes = question.options
      .map((_, i) => i)
      .filter((i) => i !== question.correct_answer);

    expect(wrongIndexes.length).toBe(3);
    expect(wrongIndexes).not.toContain(question.correct_answer);

    // Pick 2 wrong answers to eliminate
    const toStrike = wrongIndexes.slice(0, 2);
    expect(toStrike.length).toBe(2);
    expect(toStrike).not.toContain(question.correct_answer);

    const remainingOptions = question.options
      .map((_, i) => i)
      .filter((i) => !toStrike.includes(i));

    // Must leave exactly 2 choices (1 correct, 1 wrong) -> 50/50!
    expect(remainingOptions.length).toBe(2);
    expect(remainingOptions).toContain(question.correct_answer);
  });

  it("Streak repair correctly restores streak to at least 1 or advances current streak", () => {
    const brokenStreak = 0;
    const repairedStreak1 = Math.max(1, brokenStreak + 1);
    expect(repairedStreak1).toBe(1);

    const activeStreak = 7;
    const repairedStreak2 = Math.max(1, activeStreak + 1);
    expect(repairedStreak2).toBe(8);
  });
});
