export interface Module {
  id: number;
  name: string;
  subtitle: string;
  tier: "foundation" | "intermediate" | "advanced";
  difficulty: number;
  colorAccent: string; // HSL CSS variable-style
  icon: string;
  topics: string[];
}

export const SAT_MODULES: Module[] = [
  {
    id: 1,
    name: "Unit 1",
    subtitle: "Basic Algebra & Reading Foundations",
    tier: "foundation",
    difficulty: 1,
    colorAccent: "158 64% 42%",   // Mint
    icon: "🌱",
    topics: ["linear-equations", "central-ideas"],
  },
  {
    id: 2,
    name: "Unit 2",
    subtitle: "Conventions & Percentages",
    tier: "foundation",
    difficulty: 1,
    colorAccent: "200 80% 55%",   // Soft Blue
    icon: "📘",
    topics: ["standard-conventions", "percentages", "geometry", "statistics"],
  },
  {
    id: 3,
    name: "Unit 3",
    subtitle: "Vocabulary & Ratios",
    tier: "foundation",
    difficulty: 1,
    colorAccent: "170 60% 48%",   // Teal
    icon: "📗",
    topics: ["words-in-context", "ratios-rates", "quadratics", "systems-of-equations", "advanced-math"],
  },
  {
    id: 4,
    name: "Unit 4",
    subtitle: "Systems & Text Structure",
    tier: "intermediate",
    difficulty: 2,
    colorAccent: "35 95% 55%",    // Amber
    icon: "⚡",
    topics: ["systems-of-equations", "text-structure", "linear-equations", "ratios-rates", "percentages"],
  },
  {
    id: 5,
    name: "Unit 5",
    subtitle: "Data Analysis & Expression",
    tier: "intermediate",
    difficulty: 2,
    colorAccent: "280 60% 55%",   // Purple
    icon: "📊",
    topics: ["statistics", "expression-of-ideas", "words-in-context", "central-ideas", "command-of-evidence"],
  },
  {
    id: 6,
    name: "Unit 6",
    subtitle: "Quadratics & Synthesis",
    tier: "intermediate",
    difficulty: 2,
    colorAccent: "340 70% 55%",   // Rose
    icon: "🔬",
    topics: ["quadratics", "rhetorical-synthesis", "geometry", "advanced-math"],
  },
  {
    id: 7,
    name: "Unit 7",
    subtitle: "Advanced Math & Evidence",
    tier: "advanced",
    difficulty: 3,
    colorAccent: "15 85% 55%",    // Coral
    icon: "🔥",
    topics: ["advanced-math", "command-of-evidence"],
  },
  {
    id: 8,
    name: "Unit 8",
    subtitle: "Geometry & Conventions Mastery",
    tier: "advanced",
    difficulty: 3,
    colorAccent: "260 70% 60%",   // Indigo
    icon: "💎",
    topics: ["geometry", "standard-conventions"],
  },
  {
    id: 9,
    name: "Unit 9",
    subtitle: "Full SAT Mastery",
    tier: "advanced",
    difficulty: 3,
    colorAccent: "45 90% 50%",    // Gold
    icon: "👑",
    topics: ["advanced-math", "geometry", "quadratics", "rhetorical-synthesis", "command-of-evidence", "expression-of-ideas"],
  },
];

export const getModulesByTier = (tier: Module["tier"]) =>
  SAT_MODULES.filter((m) => m.tier === tier);

export const TIER_LABELS: Record<Module["tier"], string> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
