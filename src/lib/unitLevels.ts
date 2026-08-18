export type LevelType = "theory" | "practice" | "boss";

export interface UnitLevel {
  id: number; // 1-based within unit
  unitId: number;
  name: string;
  type: LevelType;
  icon: string;
  questionCount?: number; // for practice/boss
  theoryTopic?: string; // key into THEORY_CARDS
  description: string;
}

// Each unit has 7 levels: Theory → Practice × 2 → Theory → Practice × 2 → Boss
function generateUnitLevels(
  unitId: number,
  theoryTopics: string[],
  levelNames: string[]
): UnitLevel[] {
  const t1 = theoryTopics[0] || theoryTopics[theoryTopics.length - 1];
  const t2 = theoryTopics[1] || theoryTopics[0];

  return [
    { id: 1, unitId, name: levelNames[0] || "Intro Theory", type: "theory", icon: "📖", theoryTopic: t1, description: "Learn the core concepts" },
    { id: 2, unitId, name: levelNames[1] || "Practice I", type: "practice", icon: "✏️", questionCount: 10, description: "Apply what you learned" },
    { id: 3, unitId, name: levelNames[2] || "Practice II", type: "practice", icon: "📝", questionCount: 10, description: "Reinforce your skills" },
    { id: 4, unitId, name: levelNames[3] || "Advanced Theory", type: "theory", icon: "🧠", theoryTopic: t2, description: "Dive deeper into the topic" },
    { id: 5, unitId, name: levelNames[4] || "Practice III", type: "practice", icon: "🎯", questionCount: 12, description: "Challenge yourself" },
    { id: 6, unitId, name: levelNames[5] || "Practice IV", type: "practice", icon: "💪", questionCount: 12, description: "Master the fundamentals" },
    { id: 7, unitId, name: levelNames[6] || "Boss Level", type: "boss", icon: "👑", questionCount: 15, description: "Prove your mastery!" },
  ];
}

export const UNIT_LEVELS: Record<number, UnitLevel[]> = {
  1: generateUnitLevels(1, ["linear-equations", "linear-equations"], [
    "Algebra Foundations", "Linear Equations I", "Linear Equations II",
    "Isolation Techniques", "Mixed Practice I", "Mixed Practice II", "Unit 1 Boss"
  ]),
  2: generateUnitLevels(2, ["standard-conventions", "standard-conventions"], [
    "Grammar Basics", "Punctuation I", "Punctuation II",
    "Verb Tense Rules", "Grammar Practice I", "Grammar Practice II", "Unit 2 Boss"
  ]),
  3: generateUnitLevels(3, ["ratios-rates", "percentages"], [
    "Ratios & Rates", "Proportions I", "Proportions II",
    "Percentages Deep Dive", "Ratio Practice I", "Percentage Practice", "Unit 3 Boss"
  ]),
  4: generateUnitLevels(4, ["systems-of-equations", "text-structure"], [
    "Systems Intro", "Systems Practice I", "Systems Practice II",
    "Text Structure", "Mixed Practice I", "Mixed Practice II", "Unit 4 Boss"
  ]),
  5: generateUnitLevels(5, ["statistics", "expression-of-ideas"], [
    "Data Analysis", "Statistics I", "Statistics II",
    "Expression of Ideas", "Analysis Practice", "Writing Practice", "Unit 5 Boss"
  ]),
  6: generateUnitLevels(6, ["quadratics", "rhetorical-synthesis"], [
    "Quadratic Foundations", "Quadratics I", "Quadratics II",
    "Rhetorical Synthesis", "Math Practice", "Writing Practice", "Unit 6 Boss"
  ]),
  7: generateUnitLevels(7, ["advanced-math", "command-of-evidence"], [
    "Advanced Functions", "Functions I", "Functions II",
    "Evidence Skills", "Math Practice", "Reading Practice", "Unit 7 Boss"
  ]),
  8: generateUnitLevels(8, ["geometry", "standard-conventions"], [
    "Geometry Mastery", "Geometry I", "Geometry II",
    "Conventions Review", "Geometry Practice", "Mixed Review", "Unit 8 Boss"
  ]),
  9: generateUnitLevels(9, ["advanced-math", "rhetorical-synthesis"], [
    "Final Review: Math", "Advanced Math I", "Advanced Math II",
    "Final Review: Writing", "Full Practice I", "Full Practice II", "SAT Mastery Boss"
  ]),
};

export const getUnitLevels = (unitId: number): UnitLevel[] =>
  UNIT_LEVELS[unitId] || [];
