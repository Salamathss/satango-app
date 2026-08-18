export interface MockQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  difficulty: number;
  category: string;
  topic: string;
  module: number;
  explanation?: string;
}

export const MOCK_SAT_QUESTIONS: MockQuestion[] = [
  {
    id: "mock_q1",
    question_text: "A researchers studies the population growth of a certain bacteria culture. The population P(t) after t hours is modeled by P(t) = 250 * (1.12)^t. What does the value 250 represent in this context?",
    options: [
      "The initial population of the bacteria culture.",
      "The rate at which the population increases each hour.",
      "The total population after 12 hours.",
      "The maximum population the culture can sustain."
    ],
    correct_answer: 0,
    difficulty: 1,
    category: "math",
    topic: "linear-exponential",
    module: 1,
    explanation: "The value 250 represents the initial value when t = 0 since (1.12)^0 = 1."
  },
  {
    id: "mock_q2",
    question_text: "If 3x + 9 = 27, what is the value of 2x - 3?",
    options: [
      "9",
      "12",
      "6",
      "15"
    ],
    correct_answer: 0,
    difficulty: 1,
    category: "math",
    topic: "algebra",
    module: 1,
    explanation: "Subtracting 9 from both sides gives 3x = 18, so x = 6. Substituting x = 6 into 2x - 3 gives 2(6) - 3 = 9."
  },
  {
    id: "mock_q3",
    question_text: "Which value of x satisfies the equation x^2 - 14x + 49 = 0?",
    options: [
      "7",
      "-7",
      "0",
      "14"
    ],
    correct_answer: 0,
    difficulty: 2,
    category: "math",
    topic: "quadratics",
    module: 2,
    explanation: "The equation factors as (x - 7)^2 = 0, so the only solution is x = 7."
  },
  {
    id: "mock_q4",
    question_text: "Although modern critics often dismiss the 19th-century novel as overly sentimental, contemporary reviews reveal that its audience appreciated its emotional sincerity and found its intricate plot [ ______ ].",
    options: [
      "compelling",
      "tedious",
      "predictable",
      "superfluous"
    ],
    correct_answer: 0,
    difficulty: 2,
    category: "reading",
    topic: "vocabulary-context",
    module: 2,
    explanation: "The passage sets up a contrast using 'although'. While modern critics dismiss it, contemporary reviews appreciated it, meaning they found the plot 'compelling'."
  },
  {
    id: "mock_q5",
    question_text: "A line in the xy-plane passes through the origin and has a slope of -2/5. Which of the following points lies on the line?",
    options: [
      "(5, -2)",
      "(-2, 5)",
      "(2, -5)",
      "(-5, -2)"
    ],
    correct_answer: 0,
    difficulty: 2,
    category: "math",
    topic: "coordinate-geometry",
    module: 3,
    explanation: "The equation of the line is y = (-2/5)x. Substituting x = 5 gives y = -2, so (5, -2) lies on the line."
  },
  {
    id: "mock_q6",
    question_text: "The function f is defined by f(x) = (x - 3)(x + 1)(x - 5). In the xy-plane, how many times does the graph of f intersect the x-axis?",
    options: [
      "3",
      "1",
      "2",
      "0"
    ],
    correct_answer: 0,
    difficulty: 2,
    category: "math",
    topic: "polynomials",
    module: 3,
    explanation: "The roots of f are x = 3, x = -1, and x = 5. Since all roots are real and distinct, the graph intersects the x-axis 3 times."
  },
  {
    id: "mock_q7",
    question_text: "In a certain chemistry experiment, the concentration of a reactant decreases by 8% every 10 minutes. If the initial concentration is C, which function represents the concentration after t minutes?",
    options: [
      "f(t) = C * (0.92)^(t/10)",
      "f(t) = C * (0.08)^(t/10)",
      "f(t) = C * (0.92)^(10t)",
      "f(t) = C * (1.08)^(t/10)"
    ],
    correct_answer: 0,
    difficulty: 3,
    category: "math",
    topic: "exponential-growth-decay",
    module: 4,
    explanation: "Decreasing by 8% means 92% (or 0.92) remains. Since this happens every 10 minutes, the exponent is t/10."
  },
  {
    id: "mock_q8",
    question_text: "Scholars studying the work of sculptor Augusta Savage argue that her artwork was deeply [ ______ ] by her desire to promote racial equality, as evidenced by her selection of themes representing African American culture.",
    options: [
      "animated",
      "impeded",
      "ignored",
      "diluted"
    ],
    correct_answer: 0,
    difficulty: 3,
    category: "reading",
    topic: "vocabulary-context",
    module: 4,
    explanation: "Selection of themes representing African American culture shows that her artwork was driven/inspired ('animated') by her desire to promote racial equality."
  }
];

export const getFallbackQuestions = (moduleNum?: number | null, topicId?: string | null, count: number = 10): MockQuestion[] => {
  let filtered = MOCK_SAT_QUESTIONS;
  if (moduleNum) {
    filtered = filtered.filter((q) => q.module <= moduleNum);
  }
  if (topicId) {
    filtered = filtered.filter((q) => q.topic === topicId || q.category === topicId);
  }
  if (filtered.length === 0) {
    filtered = MOCK_SAT_QUESTIONS;
  }
  // Shuffle and slice
  const shuffled = [...filtered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};
