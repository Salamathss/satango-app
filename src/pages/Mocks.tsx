// src/pages/Mocks.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import SeoHead from "@/components/SeoHead";
import { useLanguage } from "@/context/LanguageContext";
import {
  getDiagnosticProgress,
  getPersonalPlan,
} from "@/services/personalPlanService";
import {
  Clock,
  FileText,
  Play,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Calculator,
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MockTab = "full" | "sections";
type SectionFilter = "all" | "math" | "rw";

interface MockCardData {
  id: string;
  title: string;
  subtitle: string;
  type: "full" | "math" | "rw";
  questionsCount: number;
  durationMinutes: number;
  difficulty: "standard" | "hard" | "diagnostic";
  route: string;
  categoryLabel: string;
  skills: string[];
}

export const Mocks = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isRu = language === "ru";

  const [activeTab, setActiveTab] = useState<MockTab>("full");
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all");

  // Read saved local diagnostic progress & completed personal plan
  const diagnosticProgress = useMemo(() => getDiagnosticProgress(), []);
  const personalPlan = useMemo(() => getPersonalPlan(), []);

  const fullMocks: MockCardData[] = [
    {
      id: "diag-98",
      title: isRu
        ? "Официальный диагностический Mock (98Q)"
        : "Official Diagnostic Mock Exam (98Q)",
      subtitle: isRu
        ? "Полный адаптивный экзамен по спецификации College Board с формированием персонального плана"
        : "Complete adaptive simulation matching College Board specs with personal study plan generation",
      type: "full",
      questionsCount: 98,
      durationMinutes: 134,
      difficulty: "diagnostic",
      route: "/bluebook?testId=diag-98",
      categoryLabel: isRu ? "Полная симуляция" : "Full Simulation",
      skills: ["RW Module 1 & 2", "Math Module 1 & 2", "Score Range 400-1600"],
    },
    {
      id: "full-sim-alpha",
      title: isRu
        ? "Digital SAT Practice Test #1 (Alpha)"
        : "Digital SAT Practice Test #1 (Alpha)",
      subtitle: isRu
        ? "Сбалансированный тренировочный тест для проверки тайминга и выносливости"
        : "Balanced practice exam to test pacing, stamina, and multi-disciplinary accuracy",
      type: "full",
      questionsCount: 98,
      durationMinutes: 134,
      difficulty: "standard",
      route: "/bluebook?testId=full-sim-alpha",
      categoryLabel: isRu ? "Полный экзамен" : "Full Exam",
      skills: ["Information & Ideas", "Advanced Math", "Standard English"],
    },
    {
      id: "full-sim-beta",
      title: isRu
        ? "High-Scorer Benchmark Test #2"
        : "High-Scorer Benchmark Test #2",
      subtitle: isRu
        ? "Усложненный модуль 2 для тех, кто целится в 1500+ баллов и топовые колледжи"
        : "Toughened Module 2 routing designed for 1500+ scorers and Ivy League aspirants",
      type: "full",
      questionsCount: 98,
      durationMinutes: 134,
      difficulty: "hard",
      route: "/bluebook?testId=full-sim-beta",
      categoryLabel: isRu ? "Hard Track" : "Hard Track",
      skills: ["Tough Quadratics", "Inference & Rhetoric", "Complex Geometry"],
    },
  ];

  const sectionMocks: MockCardData[] = [
    {
      id: "sec-math-core",
      title: isRu
        ? "Math Section: Module 1 Core Sprint"
        : "Math Section: Module 1 Core Sprint",
      subtitle: isRu
        ? "22 вопроса базового и среднего уровня. Тренировка безошибочного прохождения первой части"
        : "22 foundational to medium questions. Master zero-error execution on Module 1",
      type: "math",
      questionsCount: 22,
      durationMinutes: 35,
      difficulty: "standard",
      route: "/bluebook?testId=sec-math-core",
      categoryLabel: isRu ? "Математика M1" : "Math M1",
      skills: ["Linear Equations", "Ratios & Rates", "Geometry"],
    },
    {
      id: "sec-math-hard",
      title: isRu
        ? "Math Section: Module 2 Advanced Challenge"
        : "Math Section: Module 2 Advanced Challenge",
      subtitle: isRu
        ? "22 сложных вопроса: системы с параметрами, регрессии, круги и тригонометрия"
        : "22 rigorous questions: systems with constants, regressions, circles, and trigonometry",
      type: "math",
      questionsCount: 22,
      durationMinutes: 35,
      difficulty: "hard",
      route: "/bluebook?testId=sec-math-hard",
      categoryLabel: isRu ? "Математика M2" : "Math M2",
      skills: ["Desmos Hacking", "Non-linear Systems", "Function Notation"],
    },
    {
      id: "sec-rw-core",
      title: isRu
        ? "Reading & Writing: Module 1 Foundations"
        : "Reading & Writing: Module 1 Foundations",
      subtitle: isRu
        ? "27 вопросов: лексика в контексте, грамматика и главная мысль отрывка"
        : "27 questions: vocabulary in context, grammar conventions, and main idea analysis",
      type: "rw",
      questionsCount: 27,
      durationMinutes: 32,
      difficulty: "standard",
      route: "/bluebook?testId=sec-rw-core",
      categoryLabel: isRu ? "Чтение и письмо M1" : "Reading & Writing M1",
      skills: ["Words in Context", "Transitions", "Boundaries"],
    },
    {
      id: "sec-rw-advanced",
      title: isRu
        ? "Reading & Writing: Module 2 Rhetoric & Evidence"
        : "Reading & Writing: Module 2 Rhetoric & Evidence",
      subtitle: isRu
        ? "27 вопросов повышенной сложности: научные гипотезы, поэзия и сложный синтаксис"
        : "27 high-difficulty questions: scientific hypotheses, paired passages, and synthesis",
      type: "rw",
      questionsCount: 27,
      durationMinutes: 32,
      difficulty: "hard",
      route: "/bluebook?testId=sec-rw-advanced",
      categoryLabel: isRu ? "Чтение и письмо M2" : "Reading & Writing M2",
      skills: ["Cross-Text Connections", "Command of Evidence", "Rhetorical Synthesis"],
    },
  ];

  // Helper to determine status for test card
  const getCardStatus = (cardId: string) => {
    try {
      const saved = localStorage.getItem(`satango_bluebook_${cardId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          const answered = Object.keys(parsed.answers).length;
          return {
            status: "in_progress" as const,
            label: isRu ? `В процессе · ${answered} отв.` : `In Progress · ${answered} ans.`,
          };
        }
      }
    } catch {}

    if (cardId === "diag-98") {
      if (personalPlan) {
        return {
          status: "completed" as const,
          label: isRu
            ? `Завершен · ${personalPlan.totalScore || 1420}/1600`
            : `Completed · ${personalPlan.totalScore || 1420}/1600`,
        };
      }
      if (diagnosticProgress && Object.keys(diagnosticProgress.answers || {}).length > 0) {
        const answered = Object.keys(diagnosticProgress.answers).length;
        return {
          status: "in_progress" as const,
          label: isRu ? `В процессе · ${answered}/98` : `In Progress · ${answered}/98`,
        };
      }
    }
    return {
      status: "not_started" as const,
      label: isRu ? "Не начат" : "Not Started",
    };
  };

  const filteredSections = useMemo(() => {
    if (sectionFilter === "all") return sectionMocks;
    return sectionMocks.filter((m) => m.type === sectionFilter);
  }, [sectionFilter, sectionMocks]);

  return (
    <AppShell title={isRu ? "Мок-тесты" : "Mock Tests"}>
      <SeoHead
        title="Digital SAT Mock Tests — Full & Sectional Simulations"
        description="Take realistic Digital SAT computer-adaptive mock exams and section tests with live timers, pacing analytics, and instant score predictions."
        path="/mocks"
      />

      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Desk */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full mb-1">
              {isRu ? "Адаптивный симулятор экзамена" : "Adaptive Exam Simulator"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isRu ? "Мок-тесты Digital SAT" : "Digital SAT Mock Tests"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl font-sans">
              {isRu
                ? "Адаптивные полные симуляции и секционные спринты по стандартам College Board с таймингом и подробным разбором."
                : "Full-length adaptive simulations and targeted section sprints with realistic pacing and in-depth performance analysis."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/70 bg-card text-xs font-mono-tech shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{isRu ? "Доступно:" : "Available:"}</span>
              <span className="font-bold text-foreground tabular-nums">7 тестов</span>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex p-0.5 bg-muted/50 rounded-lg border border-border/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("full")}
              className={cn(
                "px-3.5 py-1.5 rounded-md font-mono-tech text-xs font-medium motion-safe:transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                activeTab === "full"
                  ? "bg-background text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isRu ? "Полные тесты (98Q)" : "Full Mocks (98Q)"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sections")}
              className={cn(
                "px-3.5 py-1.5 rounded-md font-mono-tech text-xs font-medium motion-safe:transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                activeTab === "sections"
                  ? "bg-background text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isRu ? "Секционные тесты (22-27Q)" : "Section Mocks (22-27Q)"}</span>
            </button>
          </div>

          {/* Sub-filter for sectional mocks */}
          {activeTab === "sections" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSectionFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-mono-tech motion-safe:transition-colors",
                  sectionFilter === "all"
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/60"
                )}
              >
                {isRu ? "Все" : "All"}
              </button>
              <button
                type="button"
                onClick={() => setSectionFilter("math")}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-mono-tech motion-safe:transition-colors flex items-center gap-1",
                  sectionFilter === "math"
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/60"
                )}
              >
                <Calculator className="w-3 h-3" />
                <span>Math</span>
              </button>
              <button
                type="button"
                onClick={() => setSectionFilter("rw")}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-mono-tech motion-safe:transition-colors flex items-center gap-1",
                  sectionFilter === "rw"
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/60"
                )}
              >
                <BookOpen className="w-3 h-3" />
                <span>Reading & Writing</span>
              </button>
            </div>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(activeTab === "full" ? fullMocks : filteredSections).map((test) => {
            const cardStatus = getCardStatus(test.id);

            return (
              <div
                key={test.id}
                className="rounded-xl bg-card border border-border/70 p-4 sm:p-5 flex flex-col justify-between hover:border-foreground/30 motion-safe:transition-colors duration-150 shadow-2xs space-y-4"
              >
                <div className="space-y-3">
                  {/* Top badges row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tech text-[10px] font-semibold px-2 py-0.5 rounded border border-border/60 bg-muted/40 text-muted-foreground">
                      {test.categoryLabel}
                    </span>

                    {/* Status badge */}
                    {cardStatus.status === "completed" && (
                      <span className="inline-flex items-center gap-1 font-mono-tech text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{cardStatus.label}</span>
                      </span>
                    )}

                    {cardStatus.status === "in_progress" && (
                      <span className="inline-flex items-center gap-1 font-mono-tech text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{cardStatus.label}</span>
                      </span>
                    )}

                    {cardStatus.status === "not_started" && (
                      <span className="font-mono-tech text-[11px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-border/50">
                        {cardStatus.label}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-snug">
                      {test.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-sans">
                      {test.subtitle}
                    </p>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {test.skills.map((skill) => (
                      <span
                        key={skill}
                        className="font-mono-tech text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border/40"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Footer: metrics & launch button */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs font-mono-tech text-muted-foreground">
                    <div className="flex items-center gap-1" title="Duration">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="tabular-nums font-medium">{test.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-1" title="Questions">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="tabular-nums font-medium">{test.questionsCount} Qs</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cardStatus.status === "in_progress" ? (
                      <button
                        type="button"
                        onClick={() => navigate(test.route)}
                        className="h-9 px-3.5 rounded-md font-mono-tech text-xs font-semibold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-neutral-950 flex items-center gap-1.5 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-2xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isRu ? "Продолжить" : "Resume"}</span>
                      </button>
                    ) : cardStatus.status === "completed" ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(test.route)}
                          className="h-9 px-3 rounded-md font-mono-tech text-xs font-semibold bg-secondary hover:bg-muted active:bg-secondary/70 disabled:opacity-50 text-foreground border border-border/80 flex items-center gap-1.5 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-2xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isRu ? "Заново" : "Retake"}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(test.route)}
                        className="h-9 px-3.5 rounded-md font-mono-tech text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 disabled:opacity-50 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-950 flex items-center gap-1.5 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-2xs"
                      >
                        <span>{isRu ? "Начать тест" : "Start Test"}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};

export default Mocks;
