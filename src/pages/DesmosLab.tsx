// src/pages/DesmosLab.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import SeoHead from "@/components/SeoHead";
import { useLanguage } from "@/context/LanguageContext";
import {
  Binary,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Play,
  ArrowRight,
  ExternalLink,
  Info,
  Maximize2,
  Minimize2,
  ChevronRight,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

declare global {
  interface Window {
    Desmos?: any;
  }
}

interface LessonStep {
  title: string;
  description: string;
  equations?: string[];
  note?: string;
}

interface DesmosLesson {
  id: string;
  title: string;
  badge: string;
  topic: string;
  timeEstimate: string;
  problem: {
    question: string;
    equationsText?: string[];
    options: { key: string; text: string }[];
    correctAnswer: string;
    explanation: string;
  };
  strategy: string;
  steps: LessonStep[];
  defaultExpressions?: { id: string; latex: string }[];
}

const DESMOS_LESSONS: DesmosLesson[] = [
  {
    id: "systems-intersection",
    title: "1. Решение систем через пересечение",
    badge: "SAT #1 HACK",
    topic: "Algebra · Linear Systems",
    timeEstimate: "3 мин",
    problem: {
      question:
        "If (x, y) is the solution to the system of equations below, what is the value of x + y?",
      equationsText: ["3x + 2y = 22", "5x - y = 15"],
      options: [
        { key: "A", text: "6" },
        { key: "B", text: "9" },
        { key: "C", text: "11" },
        { key: "D", text: "14" },
      ],
      correctAnswer: "B",
      explanation:
        "При вводе двух уравнений в Desmos прямые пересекаются в точке (4, 5). Таким образом, x = 4 и y = 5. Значит, x + y = 4 + 5 = 9 (вариант B).",
    },
    strategy:
      "Не тратьте 2-3 минуты на метод подстановки или сложения вручную! В Digital SAT калькулятор Desmos мгновенно рисует неявные уравнения. Введите уравнения прямо в том виде, в котором они записаны в тесте, и кликните на серую точку пересечения.",
    steps: [
      {
        title: "Шаг 1: Введите первое уравнение",
        description: "Введите `3x + 2y = 22` в первую строку калькулятора.",
        equations: ["3x + 2y = 22"],
      },
      {
        title: "Шаг 2: Введите второе уравнение",
        description: "Во второй строке запишите `5x - y = 15`.",
        equations: ["5x - y = 15"],
      },
      {
        title: "Шаг 3: Нажмите на точку пересечения",
        description:
          "Desmos подсветит серую точку пересечения прямых. Кликните по ней — отобразятся координаты (4, 5).",
        note: "x = 4, y = 5",
      },
      {
        title: "Шаг 4: Найдите итоговую сумму",
        description:
          "В третьей строке Desmos можно сразу посчитать ответ: введите `4 + 5`, и калькулятор покажет `9`.",
        equations: ["4 + 5"],
      },
    ],
    defaultExpressions: [
      { id: "line1", latex: "3x + 2y = 22" },
      { id: "line2", latex: "5x - y = 15" },
    ],
  },
  {
    id: "regression-formula",
    title: "2. Регрессии (~) для поиска формул",
    badge: "PRO HACK",
    topic: "Advanced Math · Modeling",
    timeEstimate: "4 мин",
    problem: {
      question:
        "A line in the xy-plane passes through the coordinates (4, 19) and (9, 39). What is the y-intercept of this line?",
      options: [
        { key: "A", text: "1" },
        { key: "B", text: "3" },
        { key: "C", text: "4" },
        { key: "D", text: "7" },
      ],
      correctAnswer: "B",
      explanation:
        "При использовании таблицы x1, y1 и регрессии y1 ~ m*x1 + b Desmos мгновенно находит параметры: m = 4 и b = 3. Так как уравнение прямой y = 4x + 3, y-intercept (свободный член) равен 3 (вариант B).",
    },
    strategy:
      "Символ тильды (~) в Desmos запускает движок регрессии. Если вам даны 2 или более точек и нужно найти коэффициенты m, b или уравнение кривой — создайте таблицу x1/y1 и используйте формулу регрессии.",
    steps: [
      {
        title: "Шаг 1: Создайте таблицу данных",
        description:
          "Внесите данные точек (4, 19) и (9, 39) в таблицу со столбцами x₁ и y₁.",
        note: "Строка 1: x₁=4, y₁=19. Строка 2: x₁=9, y₁=39",
      },
      {
        title: "Шаг 2: Запустите регрессию",
        description: "Введите формулу линейной регрессии `y_1 ~ m x_1 + b`.",
        equations: ["y_{1} \\sim m x_{1} + b"],
      },
      {
        title: "Шаг 3: Прочитайте параметры",
        description:
          "Desmos покажет: m = 4 (угловой коэффициент) и b = 3 (y-intercept).",
        note: "Ответ на вопрос задачи: b = 3",
      },
    ],
    defaultExpressions: [
      { id: "reg", latex: "y_{1} \\sim m x_{1} + b" },
    ],
  },
  {
    id: "quadratic-vertex-roots",
    title: "3. Корни и вершины парабол",
    badge: "1500+ ESSENTIAL",
    topic: "Quadratics · Vertex & Zeroes",
    timeEstimate: "3 мин",
    problem: {
      question:
        "The quadratic function f is defined by f(x) = -2x^2 + 12x + 14. For what value of x does f(x) reach its maximum value?",
      equationsText: ["f(x) = -2x^2 + 12x + 14"],
      options: [
        { key: "A", text: "2" },
        { key: "B", text: "3" },
        { key: "C", text: "6" },
        { key: "D", text: "32" },
      ],
      correctAnswer: "B",
      explanation:
        "Вершина параболы находится в точке (3, 32). Максимальное значение функции равно 32, и оно достигается при x = 3 (вариант B). Вопрос спрашивает именно значение x!",
    },
    strategy:
      "Забудьте про формулы вершины -b/(2a) или долгое выделение полного квадрата под стрессом экзамена. Введите параболу в Desmos и нажмите на пик параболы: координаты вершины отобразятся моментально.",
    steps: [
      {
        title: "Шаг 1: Постройте график функции",
        description: "Введите уравнение `y = -2x^2 + 12x + 14` в Desmos.",
        equations: ["y = -2x^2 + 12x + 14"],
      },
      {
        title: "Шаг 2: Кликните на вершину (Vertex)",
        description:
          "Нажмите на самую верхнюю точку параболы. Desmos покажет серый маркер с координатами (3, 32).",
        note: "3 — это x-координата (аргумент), 32 — максимальное значение y",
      },
      {
        title: "Шаг 3: Проверьте формулировку вопроса",
        description:
          "Вопрос: 'For what value of x...'. Следовательно, правильный ответ x = 3.",
      },
    ],
    defaultExpressions: [
      { id: "quad1", latex: "y = -2x^2 + 12x + 14" },
    ],
  },
  {
    id: "desmos-sandbox",
    title: "4. Свободная песочница Desmos",
    badge: "DIGITAL SAT MODE",
    topic: "Sandbox · Practice Playground",
    timeEstimate: "Безлимитно",
    problem: {
      question:
        "Свободная тренировочная среда. Используйте быстрые пресеты ниже для отработки графических приемов Digital SAT: системы с окружностями, параметры k со слайдерами и показательные уравнения.",
      options: [],
      correctAnswer: "",
      explanation: "Песочница доступна для свободного исследования без ограничений.",
    },
    strategy:
      "В официальном экзамене Digital SAT Bluebook встроен полнофункциональный Desmos. Тренируйтесь быстро вбивать выражения, использовать слайдеры для параметров и находить пересечения за считанные секунды.",
    steps: [
      {
        title: "Пресет: Уравнение окружности",
        description:
          "Окружность с центром (3, -2) и радиусом 5: `(x - 3)^2 + (y + 2)^2 = 25`.",
        equations: ["(x - 3)^2 + (y + 2)^2 = 25"],
      },
      {
        title: "Пресет: Слайдер параметра k",
        description:
          "Прямая `y = 2x + k` с динамическим слайдером k для проверки количества решений системы.",
        equations: ["y = 2x + k", "k = 1"],
      },
      {
        title: "Пресет: Экспоненциальный рост",
        description: "Экспоненциальная модель `y = 100(1.15)^x`.",
        equations: ["y = 100(1.15)^x"],
      },
    ],
    defaultExpressions: [
      { id: "sand1", latex: "(x - 3)^2 + (y + 2)^2 = 25" },
      { id: "sand2", latex: "y = 2x - 1" },
    ],
  },
];

export const DesmosLab = () => {
  const { t, language } = useLanguage();
  const isRu = language === "ru";

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const currentLesson = DESMOS_LESSONS[currentLessonIndex];

  // Answer state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Desmos calculator state & ref
  const calculatorContainerRef = useRef<HTMLDivElement>(null);
  const calculatorInstanceRef = useRef<any>(null);
  const [desmosApiReady, setDesmosApiReady] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  // Initialize Desmos API script
  useEffect(() => {
    if (window.Desmos && window.Desmos.GraphingCalculator) {
      setDesmosApiReady(true);
      return;
    }

    const scriptId = "desmos-api-script";
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
      script.async = true;

      script.onload = () => {
        if (window.Desmos && window.Desmos.GraphingCalculator) {
          setDesmosApiReady(true);
        } else {
          setUseIframeFallback(true);
        }
      };

      script.onerror = () => {
        // Fallback to official SAT calculator iframe if script blocked
        setUseIframeFallback(true);
      };

      document.body.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.Desmos && window.Desmos.GraphingCalculator) {
          setDesmosApiReady(true);
          clearInterval(checkInterval);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.Desmos) setUseIframeFallback(true);
      }, 3000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, []);

  // Mount or update calculator when Desmos API is ready
  useEffect(() => {
    if (!desmosApiReady || useIframeFallback || !calculatorContainerRef.current) return;

    if (!calculatorInstanceRef.current && window.Desmos) {
      try {
        const calc = window.Desmos.GraphingCalculator(
          calculatorContainerRef.current,
          {
            keypad: true,
            graphpaper: true,
            expressions: true,
            settingsMenu: true,
            zoomButtons: true,
            border: false,
          }
        );
        calculatorInstanceRef.current = calc;
      } catch {
        setUseIframeFallback(true);
        return;
      }
    }

    // Load initial lesson expressions
    if (calculatorInstanceRef.current && currentLesson.defaultExpressions) {
      calculatorInstanceRef.current.setBlank();
      currentLesson.defaultExpressions.forEach((expr) => {
        calculatorInstanceRef.current.setExpression(expr);
      });
    }
  }, [desmosApiReady, useIframeFallback, currentLessonIndex, currentLesson.defaultExpressions]);

  // Reset user answer when switching lessons
  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
  }, [currentLessonIndex]);

  // Insert expression into calculator
  const handleInsertEquation = useCallback(
    (latex: string) => {
      if (calculatorInstanceRef.current) {
        calculatorInstanceRef.current.setExpression({ latex });
        toast.success(
          isRu ? "Уравнение добавлено в Desmos" : "Expression added to Desmos"
        );
      } else {
        // If iframe fallback, copy to clipboard for convenience
        navigator.clipboard.writeText(latex);
        toast.info(
          isRu
            ? "Скопировано! Вставьте в калькулятор через Ctrl+V"
            : "Copied! Paste into calculator with Ctrl+V"
        );
      }
    },
    [isRu]
  );

  // Clear calculator
  const handleClearCalculator = () => {
    if (calculatorInstanceRef.current) {
      calculatorInstanceRef.current.setBlank();
      toast.info(isRu ? "График очищен" : "Calculator cleared");
    }
  };

  // Reload current lesson preset
  const handleReloadPreset = () => {
    if (calculatorInstanceRef.current && currentLesson.defaultExpressions) {
      calculatorInstanceRef.current.setBlank();
      currentLesson.defaultExpressions.forEach((expr) => {
        calculatorInstanceRef.current.setExpression(expr);
      });
      toast.success(
        isRu ? "Пресет урока загружен" : "Lesson equations restored"
      );
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;
    setIsAnswerChecked(true);
  };

  const isCorrect = selectedAnswer === currentLesson.problem.correctAnswer;

  return (
    <AppShell title="Desmos Lab">
      <SeoHead
        title="Desmos Lab — Digital SAT Math Shortcuts & Graphing Hacks"
        description="Master Digital SAT Math with official Desmos Graphing Calculator hacks: linear regressions, systems of equations, parabola vertices, and free sandbox."
        path="/desmos-lab"
      />

      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Header Desk */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                Официальный графический движок Desmos для Digital SAT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Desmos Lab: Секретные хаки SAT
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl font-sans">
              {isRu
                ? "Решайте до 60% задач секции SAT Math без долгих ручных вычислений с помощью официального графического движка."
                : "Solve up to 60% of Digital SAT Math problems in seconds using graphical intersections, regressions, and vertex detection."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono-tech text-xs text-muted-foreground px-2.5 py-1 rounded-md border border-border/70 bg-card shadow-2xs">
              Урок {currentLessonIndex + 1} из {DESMOS_LESSONS.length}
            </span>
          </div>
        </div>

        {/* Lesson Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {DESMOS_LESSONS.map((lesson, idx) => {
            const active = idx === currentLessonIndex;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setCurrentLessonIndex(idx)}
                className={cn(
                  "px-3 py-2 rounded-md font-mono-tech text-xs font-medium shrink-0 motion-safe:transition-colors flex items-center gap-2 border shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted disabled:opacity-50",
                  active
                    ? "bg-foreground text-background font-semibold border-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border/70"
                )}
              >
                <span>{lesson.title}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded font-semibold",
                    active
                      ? "bg-background/20 text-background"
                      : "bg-muted/70 text-muted-foreground"
                  )}
                >
                  {lesson.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* SPLIT-SCREEN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: SAT Problem, Strategy & Step-by-Step Guide */}
          <div className="lg:col-span-5 space-y-4">
            {/* Strategy Banner */}
            <div className="rounded-xl bg-card border border-border/80 p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-tech text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-amber-500" />
                  Суть хака Desmos
                </span>
                <span className="font-mono-tech text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60">
                  {currentLesson.timeEstimate}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                {currentLesson.strategy}
              </p>
            </div>

            {/* SAT Problem Card */}
            {currentLesson.problem.options.length > 0 && (
              <div className="rounded-xl bg-card border border-border/80 p-4 sm:p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <span className="font-mono-tech text-[10px] font-semibold px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/60">
                    SAT REAL PROBLEM
                  </span>
                  <span className="font-mono-tech text-xs text-muted-foreground">
                    {currentLesson.topic}
                  </span>
                </div>

                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {currentLesson.problem.question}
                </p>

                {currentLesson.problem.equationsText && (
                  <div className="space-y-1 p-2.5 rounded-md bg-muted/30 border border-border/60 font-mono-tech text-xs text-foreground">
                    {currentLesson.problem.equationsText.map((eq, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span>{eq}</span>
                        <button
                          type="button"
                          onClick={() => handleInsertEquation(eq)}
                          title="Вставить в Desmos"
                          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 underline underline-offset-2 motion-safe:transition-colors"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>в Desmos</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Options choices */}
                <div className="space-y-2 pt-1">
                  {currentLesson.problem.options.map((opt) => {
                    const isSelected = selectedAnswer === opt.key;
                    let optionStyle =
                      "bg-card/70 border-border/70 text-foreground hover:bg-muted/40";

                    if (isAnswerChecked) {
                      if (opt.key === currentLesson.problem.correctAnswer) {
                        optionStyle =
                          "bg-emerald-500/10 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-semibold";
                      } else if (isSelected) {
                        optionStyle =
                          "bg-rose-500/10 border-rose-500/50 text-rose-900 dark:text-rose-200 line-through";
                      }
                    } else if (isSelected) {
                      optionStyle =
                        "bg-foreground text-background font-semibold border-foreground";
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          if (!isAnswerChecked) setSelectedAnswer(opt.key);
                        }}
                        className={cn(
                          "w-full p-2.5 rounded-md border text-xs font-mono-tech flex items-center justify-between motion-safe:transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted disabled:opacity-50",
                          optionStyle
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-muted/60 text-[11px] font-bold shrink-0">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        {isAnswerChecked &&
                          opt.key === currentLesson.problem.correctAnswer && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        {isAnswerChecked &&
                          isSelected &&
                          opt.key !== currentLesson.problem.correctAnswer && (
                            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          )}
                      </button>
                    );
                  })}
                </div>

                {/* Check button & Explanation */}
                <div className="pt-2">
                  {!isAnswerChecked ? (
                    <button
                      type="button"
                      onClick={handleCheckAnswer}
                      disabled={!selectedAnswer}
                      className="w-full h-9 rounded-md font-mono-tech text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-950 disabled:opacity-40 disabled:pointer-events-none motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-2xs"
                    >
                      Проверить ответ
                    </button>
                  ) : (
                    <div
                      className={cn(
                        "p-3 rounded-md border text-xs space-y-1.5",
                        isCorrect
                          ? "bg-emerald-500/10 border-emerald-500/40 text-foreground"
                          : "bg-muted/40 border-border/70 text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono-tech font-bold">
                          {isCorrect ? "Отлично! Ответ верный" : "Разбор задачи"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAnswer(null);
                            setIsAnswerChecked(false);
                          }}
                          className="font-mono-tech text-[10px] text-muted-foreground hover:text-foreground underline"
                        >
                          Сбросить
                        </button>
                      </div>
                      <p className="text-muted-foreground leading-relaxed font-sans">
                        {currentLesson.problem.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step-by-Step Instructions */}
            <div className="rounded-xl bg-card border border-border/80 p-4 sm:p-5 shadow-2xs space-y-3">
              <span className="font-mono-tech text-xs font-semibold text-foreground block border-b border-border/60 pb-2">
                Инструкция по шагам
              </span>

              <div className="space-y-3">
                {currentLesson.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md bg-muted/20 border border-border/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">
                        {step.title}
                      </h4>
                      {step.equations && step.equations.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleInsertEquation(step.equations![0])}
                          className="font-mono-tech text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 motion-safe:transition-colors"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Вставить</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      {step.description}
                    </p>
                    {step.note && (
                      <span className="inline-block font-mono-tech text-[11px] text-foreground font-semibold bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                        {step.note}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Official Desmos Graphing Calculator */}
          <div className="lg:col-span-7 sticky top-16 space-y-3">
            <div className="rounded-xl bg-card border border-border/80 overflow-hidden shadow-2xs">
              {/* Toolbar above calculator */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/70 bg-card/90">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Desmos Active" />
                  <span className="font-mono-tech text-xs font-bold text-foreground">
                    Desmos Digital SAT Calculator
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleReloadPreset}
                    title="Загрузить формулы урока"
                    className="h-7 px-2.5 rounded text-[11px] font-mono-tech text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border/60 flex items-center gap-1 motion-safe:transition-colors active:bg-muted/70 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Пресет</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCalculator}
                    title="Очистить график"
                    className="h-7 px-2.5 rounded text-[11px] font-mono-tech text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border/60 motion-safe:transition-colors active:bg-muted/70 disabled:opacity-50"
                  >
                    Очистить
                  </button>
                </div>
              </div>

              {/* Calculator Viewport */}
              <div className="w-full h-[540px] sm:h-[580px] bg-white relative">
                {!useIframeFallback ? (
                  <div
                    ref={calculatorContainerRef}
                    className="w-full h-full"
                    style={{ minHeight: "540px" }}
                  />
                ) : (
                  <iframe
                    src="https://www.desmos.com/testing/cb-digital-sat/graphing"
                    className="w-full h-full border-0"
                    title="Desmos Official SAT Calculator"
                  />
                )}
              </div>
            </div>

            {/* Quick Tips footer */}
            <div className="px-3.5 py-2.5 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between text-xs font-mono-tech text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-foreground/70" />
                <span>Хоткей: кликните по любой серой точке на графике для отображения координат</span>
              </span>
              <a
                href="https://www.desmos.com/testing/cb-digital-sat/graphing"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1 underline underline-offset-2 motion-safe:transition-colors shrink-0 ml-2"
              >
                <span>На весь экран</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default DesmosLab;

