import { DIAGNOSTIC_98_QUESTIONS, DiagnosticQuestion } from "@/data/diagnosticMock98";
import { SAT_MODULES, Module } from "@/lib/modules";

export interface UnitStat {
  unitId: number;
  name: string;
  subtitle: string;
  icon: string;
  correct: number;
  total: number;
  accuracy: number;
  status: "mastered" | "solid" | "needs_work";
}

export interface PlanMilestone {
  week: number;
  title: string;
  focusUnits: number[];
  description: string;
}

export interface PersonalPlan {
  completedAt: string;
  totalScore: number;
  rwScore: number;
  mathScore: number;
  correctTotal: number;
  correctRW: number;
  correctMath: number;
  accuracy: number;
  unitStats: UnitStat[];
  recommendedUnit: {
    id: number;
    name: string;
    subtitle: string;
    reason: string;
  };
  targetScore: number;
  estimatedWeeks: number;
  dailyMinutes: number;
  milestones: PlanMilestone[];
  priorityWeakSpots: string[];
}

export interface DiagnosticProgressState {
  currentIndex: number;
  currentSection: "reading_writing" | "math";
  currentModule: 1 | 2;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  flagged: Record<string, boolean>;
  struck: Record<string, Record<number, boolean>>; // questionId -> optionIndex -> boolean
  timeLeftSeconds: number;
  startedAt: string;
  isPaused: boolean;
}

const STORAGE_PLAN_KEY = "satango_personal_plan";
const STORAGE_PROGRESS_KEY = "satango_diagnostic_progress";

/**
 * Evaluate raw answers for the 98-question test and build a personalized plan
 */
export function generatePersonalPlan(
  userAnswers: Record<string, number>,
  targetScore: number = 1450
): PersonalPlan {
  let correctRW = 0;
  let totalRW = 0;
  let correctMath = 0;
  let totalMath = 0;

  // Track per-unit stats (Units 1 to 8)
  const unitBuckets: Record<number, { correct: number; total: number }> = {};
  for (let u = 1; u <= 8; u++) {
    unitBuckets[u] = { correct: 0, total: 0 };
  }

  // Domain accuracy mapping for weak spot identification
  const domainBuckets: Record<string, { correct: number; total: number }> = {};

  DIAGNOSTIC_98_QUESTIONS.forEach((q) => {
    const selected = userAnswers[q.id];
    const isCorrect = selected !== undefined && selected === q.correct_answer;

    if (q.section === "reading_writing") {
      totalRW++;
      if (isCorrect) correctRW++;
    } else {
      totalMath++;
      if (isCorrect) correctMath++;
    }

    if (q.target_unit && unitBuckets[q.target_unit]) {
      unitBuckets[q.target_unit].total++;
      if (isCorrect) unitBuckets[q.target_unit].correct++;
    }

    if (q.domain) {
      domainBuckets[q.domain] = domainBuckets[q.domain] || { correct: 0, total: 0 };
      domainBuckets[q.domain].total++;
      if (isCorrect) domainBuckets[q.domain].correct++;
    }
  });

  const correctTotal = correctRW + correctMath;
  const totalCount = DIAGNOSTIC_98_QUESTIONS.length;
  const accuracy = Math.round((correctTotal / totalCount) * 100);

  // Digital SAT scaled scores: 200 - 800 per section
  const rwRatio = totalRW > 0 ? correctRW / totalRW : 0;
  const mathRatio = totalMath > 0 ? correctMath / totalMath : 0;

  // Standard Digital SAT scaling curve with slight curve protection at high percentiles
  const scaleSection = (ratio: number): number => {
    if (ratio >= 0.96) return 800;
    if (ratio <= 0.05) return 200;
    const rawScaled = 200 + Math.round(ratio * 600);
    // Round to nearest 10
    return Math.round(rawScaled / 10) * 10;
  };

  const rwScore = scaleSection(rwRatio);
  const mathScore = scaleSection(mathRatio);
  const totalScore = rwScore + mathScore;

  // Compile Unit Stats
  const unitStats: UnitStat[] = Object.entries(unitBuckets).map(([uStr, data]) => {
    const unitId = Number(uStr);
    const mod = SAT_MODULES.find((m) => m.id === unitId);
    const unitAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const status: UnitStat["status"] =
      unitAcc >= 80 ? "mastered" : unitAcc >= 60 ? "solid" : "needs_work";

    return {
      unitId,
      name: mod ? mod.name : `Unit ${unitId}`,
      subtitle: mod ? mod.subtitle : "",
      icon: mod ? mod.icon : "📖",
      correct: data.correct,
      total: data.total,
      accuracy: unitAcc,
      status,
    };
  });

  // Determine Recommended Starting Unit
  // Rule 1: Prioritize fundamental weaknesses (Unit 1 & Unit 2 under 70%)
  const unit1 = unitStats.find((u) => u.unitId === 1);
  const unit2 = unitStats.find((u) => u.unitId === 2);

  let recommendedUnitId = 1;
  let reason = "Базовые уравнения и чтение — ключ к росту в первую очередь.";

  if (unit1 && unit1.accuracy < 70) {
    recommendedUnitId = 1;
    reason = `Точность в базовой алгебре составляет ${unit1.accuracy}%. Закрепление линейных уравнений даст быстрый прирост +80-100 баллов.`;
  } else if (unit2 && unit2.accuracy < 70) {
    recommendedUnitId = 2;
    reason = `В правилах пунктуации и грамматики точность ${unit2.accuracy}%. Standard English Conventions — самый предсказуемый раздел SAT.`;
  } else {
    // Find the unit with the lowest accuracy
    const sorted = [...unitStats].sort((a, b) => a.accuracy - b.accuracy);
    const lowest = sorted[0];
    if (lowest && lowest.accuracy < 80) {
      recommendedUnitId = lowest.unitId;
      reason = `Здесь зафиксирована наибольшая просадка (${lowest.accuracy}%). Устранение пробелов в этом модуле даст максимальный рывок к цели.`;
    } else {
      // High score overall: go to Advanced Math or Synthesis
      recommendedUnitId = 6;
      reason = `У тебя отличная общая база (${totalScore}). Переходи сразу к сложным квадратичным функциям и продвинутому синтезу.`;
    }
  }

  const recMod = SAT_MODULES.find((m) => m.id === recommendedUnitId);

  // Priority weak domains
  const weakDomains = Object.entries(domainBuckets)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .slice(0, 3)
    .map(([dom]) => dom);

  // Generate Milestones based on score gap
  const scoreGap = Math.max(0, targetScore - totalScore);
  const estimatedWeeks = scoreGap > 200 ? 6 : scoreGap > 100 ? 4 : 2;
  const dailyMinutes = scoreGap > 150 ? 45 : 30;

  const milestones: PlanMilestone[] = [
    {
      week: 1,
      title: `Старт: ${recMod?.name || "Unit " + recommendedUnitId}`,
      focusUnits: [recommendedUnitId],
      description: "Освой ключевую теорию модуля и пройди практические блоки без потери сердец.",
    },
    {
      week: 2,
      title: "Ликвидация главных пробелов",
      focusUnits: [recommendedUnitId === 1 ? 2 : 1, 3],
      description: "Подтяни сопутствующие темы и активируй режим 'Карцер' для отработки ошибок.",
    },
    {
      week: 3,
      title: "Прокачка скорости и Desmos",
      focusUnits: [4, 5],
      description: "Автоматизируй решение систем уравнений через калькулятор Desmos и отточи тайминг.",
    },
    {
      week: 4,
      title: "Продвинутый уровень и Boss Battles",
      focusUnits: [6, 7],
      description: "Решай задания повышенной сложности и победи боссов в ключевых юнитах.",
    },
  ];

  if (estimatedWeeks > 4) {
    milestones.push({
      week: 5,
      title: "Геометрия и финальный синтез",
      focusUnits: [8, 9],
      description: "Закрой редкие геометрические теоремы и тригонометрию.",
    });
    milestones.push({
      week: 6,
      title: "Финальный Full Mock и фиксация цели",
      focusUnits: [9],
      description: "Сдай контрольный экзамен в Exam Center и зафиксируй целевой балл 1450+.",
    });
  }

  return {
    completedAt: new Date().toISOString(),
    totalScore,
    rwScore,
    mathScore,
    correctTotal,
    correctRW,
    correctMath,
    accuracy,
    unitStats,
    recommendedUnit: {
      id: recommendedUnitId,
      name: recMod ? `${recMod.name}: ${recMod.subtitle}` : `Unit ${recommendedUnitId}`,
      subtitle: recMod ? recMod.subtitle : "",
      reason,
    },
    targetScore,
    estimatedWeeks,
    dailyMinutes,
    milestones,
    priorityWeakSpots: weakDomains,
  };
}

export function savePersonalPlan(plan: PersonalPlan): void {
  try {
    localStorage.setItem(STORAGE_PLAN_KEY, JSON.stringify(plan));
  } catch (e) {
    console.error("Failed to save personal plan to localStorage:", e);
  }
}

export function getPersonalPlan(): PersonalPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPersonalPlan(): void {
  try {
    localStorage.removeItem(STORAGE_PLAN_KEY);
  } catch {}
}

export function saveDiagnosticProgress(progress: DiagnosticProgressState): void {
  try {
    localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save diagnostic progress:", e);
  }
}

export function getDiagnosticProgress(): DiagnosticProgressState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDiagnosticProgress(): void {
  try {
    localStorage.removeItem(STORAGE_PROGRESS_KEY);
  } catch {}
}
