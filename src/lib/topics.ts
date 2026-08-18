export interface Topic {
  id: string;
  name: string;
  category: "math" | "reading_writing";
  icon: string;
  order: number;
}

export const SAT_TOPICS: Topic[] = [
  // Math topics
  { id: "linear-equations", name: "Linear Equations", category: "math", icon: "📐", order: 1 },
  { id: "systems-of-equations", name: "Systems of Equations", category: "math", icon: "🔗", order: 2 },
  { id: "quadratics", name: "Quadratics & Polynomials", category: "math", icon: "📈", order: 3 },
  { id: "ratios-rates", name: "Ratios & Rates", category: "math", icon: "⚖️", order: 4 },
  { id: "percentages", name: "Percentages", category: "math", icon: "💯", order: 5 },
  { id: "geometry", name: "Geometry & Trig", category: "math", icon: "📏", order: 6 },
  { id: "statistics", name: "Statistics & Probability", category: "math", icon: "📊", order: 7 },
  { id: "advanced-math", name: "Advanced Math", category: "math", icon: "🧮", order: 8 },
  // Reading & Writing topics
  { id: "central-ideas", name: "Central Ideas", category: "reading_writing", icon: "💡", order: 1 },
  { id: "command-of-evidence", name: "Command of Evidence", category: "reading_writing", icon: "🔍", order: 2 },
  { id: "words-in-context", name: "Words in Context", category: "reading_writing", icon: "📖", order: 3 },
  { id: "text-structure", name: "Text Structure", category: "reading_writing", icon: "🏗️", order: 4 },
  { id: "standard-conventions", name: "Standard English Conventions", category: "reading_writing", icon: "✍️", order: 5 },
  { id: "expression-of-ideas", name: "Expression of Ideas", category: "reading_writing", icon: "🎨", order: 6 },
  { id: "rhetorical-synthesis", name: "Rhetorical Synthesis", category: "reading_writing", icon: "🎯", order: 7 },
];

export const getTopicsByCategory = (category: "math" | "reading_writing") =>
  SAT_TOPICS.filter((t) => t.category === category).sort((a, b) => a.order - b.order);
