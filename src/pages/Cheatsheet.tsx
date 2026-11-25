import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import SeoHead from "@/components/SeoHead";
import {
  Sparkles,
  Calculator,
  BookOpen,
  Printer,
  Copy,
  Check,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { playClickSound, playSuccessSound, playErrorSound } from "@/utils/audio";
import { MathText } from "@/components/MathText";

interface DesmosHack {
  id: string;
  title: string;
  category: string;
  description: string;
  snippet: string;
  explanation: string;
  example: string;
}

const DESMOS_HACKS: DesmosHack[] = [
  {
    id: "regression-linear",
    title: "Поиск уравнения прямой через таблицу (Регрессия ~)",
    category: "Регрессии",
    description: "Находит наклон m и сдвиг b по двум или более точкам за 3 секунды без ручных вычислений.",
    snippet: "y_1 ~ m x_1 + b",
    explanation: "Создайте таблицу (кнопка + -> table), введите координаты точек в столбцы x1 и y1. В строке ниже напишите y1 ~ m x1 + b. Desmos мгновенно выдаст значения m и b.",
    example: "Даны точки (2, 5) и (6, 17). Занесите их в таблицу -> m = 3, b = -1.",
  },
  {
    id: "regression-quadratic",
    title: "Подбор квадратичной функции по 3 точкам",
    category: "Регрессии",
    description: "Находит коэффициенты a, b, c параболы через любые три точки.",
    snippet: "y_1 ~ a x_1^2 + b x_1 + c",
    explanation: "Введите 3 точки из условия в таблицу x1, y1. В следующей строке введите формулу с тильдой ~. Desmos мгновенно найдет a, b, c и R² = 1.",
    example: "Точки (0, 3), (1, 6), (2, 11) -> a = 1, b = 2, c = 3 -> y = x² + 2x + 3.",
  },
  {
    id: "intersections",
    title: "Решение систем уравнений через пересечение графиков",
    category: "Системы",
    description: "Количество решений и их координаты находятся в один клик без подстановок.",
    snippet: "Вбейте оба уравнения в отдельные строки",
    explanation: "Просто напечатайте оба уравнения в Desmos в исходном виде (даже если они не выражены через y). Кликните по серым точкам пересечения графиков — координаты появятся на экране.",
    example: "Строка 1: 3x - 2y = 8, Строка 2: y = x^2 - 4. Точки пересечения видны сразу.",
  },
  {
    id: "vertex-extremum",
    title: "Поиск вершины параболы (Min / Max) за 1 клик",
    category: "Параболы",
    description: "Desmos автоматически отмечает серыми точками вершину и корни параболы.",
    snippet: "f(x) = a x^2 + b x + c",
    explanation: "Введите квадратичное уравнение. Desmos автоматически подсветит серую точку на вершине (минимум или максимум) и на пересечении с осями x и y. Кликните по ней, чтобы зафиксировать координаты (h, k).",
    example: "Для f(x) = -2x² + 8x + 5 вершина отобразится в точке (2, 13). Максимальное значение = 13 при x = 2.",
  },
  {
    id: "sliders",
    title: "Подбор параметров через слайдеры (add slider)",
    category: "Параметры",
    description: "Проверка условий 'система не имеет решений' или 'касается в одной точке'.",
    snippet: "y = kx + 3  ->  нажмите 'add slider: k'",
    explanation: "Если в уравнении есть неизвестный параметр k, c или a, Desmos предложит добавить ползунок. Двигайте ползунок, чтобы увидеть, при каком значении прямая становится параллельной или касается графика.",
    example: "Для поиска k, при котором прямые параллельны, совместите углы наклона.",
  },
  {
    id: "inequalities",
    title: "Системы неравенств и область допустимых решений",
    category: "Неравенства",
    description: "Визуальное затенение области пересечения нескольких неравенств.",
    snippet: "y <= 2x + 1   и   y > -x + 3",
    explanation: "Введите неравенства со знаками <, >, <=, >=. Область, закрашенная обоими цветами одновременно, является решением системы.",
    example: "Проверяйте координаты из вариантов ответов A, B, C, D: попадает ли точка в закрашенную зону.",
  },
];

interface GrammarRule {
  id: string;
  title: string;
  ruleShort: string;
  ruleFull: string;
  correctExample: string;
  wrongExample: string;
  miniQuiz: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

const GRAMMAR_RULES: GrammarRule[] = [
  {
    id: "semicolon",
    title: "Правило 1. Точка с запятой (;)",
    ruleShort: "Соединяет только два полных независимых предложения (Complete ; Complete)",
    ruleFull: "Точка с запятой на SAT выполняет ровно ту же функцию, что и точка. Обе части до и после ';' обязаны быть законченными грамматическими основами (Subject + Verb). Если хотя бы одна часть зависимая — точка с запятой запрещена.",
    correctExample: "The experiment was successful; the researchers confirmed their initial hypothesis.",
    wrongExample: "Because the experiment was successful; the researchers celebrated.",
    miniQuiz: {
      question: "Выберите верный вариант: The new telescope captured clear images [ ; / , / : ] allowing astronomers to detect distant galaxies.",
      options: [
        "images; allowing astronomers",
        "images, allowing astronomers",
        "images: allowing astronomers",
      ],
      correct: 1,
      explanation: "'allowing astronomers...' — это причастный оборот (неполное предложение), поэтому точку с запятой ставить нельзя. Нужна запятая.",
    },
  },
  {
    id: "colon",
    title: "Правило 2. Двоеточие (:)",
    ruleShort: "Слева ВСЕГДА полное предложение. Справа — пояснение, список или вывод.",
    ruleFull: "Главная ловушка SAT: перед двоеточием ОБЯЗАТЕЛЬНО должно стоять полноценное самостоятельное предложение (Independent Clause). После двоеточия может идти одно слово, список или целое предложение, раскрывающее сказанное.",
    correctExample: "The botanist noticed a rare feature: purple spots along the stem.",
    wrongExample: "The botanist noticed such as: purple spots along the stem.",
    miniQuiz: {
      question: "Какое предложение оформлено по стандарту College Board?",
      options: [
        "She had one ultimate goal: to publish her novel before winter.",
        "Her ultimate goals included: publishing a novel and travelling.",
      ],
      correct: 0,
      explanation: "В варианте B перед двоеточием стоит 'included' (сказуемое без прямого дополнения), левая часть не является законченной мыслью. В варианте A левая часть грамматически завершена.",
    },
  },
  {
    id: "dashes",
    title: "Правило 3. Тире одиночное и парное (—)",
    ruleShort: "Парные тире = скобки. Одиночное тире = двоеточие.",
    ruleFull: "Если дополнительная мысль в середине предложения открывается тире, она обязана закрываться тире (нельзя начать запятой, а закончить тире!). Если тире одно, оно работает в точности как двоеточие — ставится после законченной мысли перед драматическим уточнением.",
    correctExample: "The ancient artifact — discovered during the 1923 excavation — was remarkably preserved.",
    wrongExample: "The ancient artifact, discovered during the 1923 excavation — was remarkably preserved.",
    miniQuiz: {
      question: "The pianist's technique [ — / , ] praised by critics across Europe [ — / ) ] inspired a new generation of musicians.",
      options: [
        "— praised by critics across Europe —",
        ", praised by critics across Europe —",
      ],
      correct: 0,
      explanation: "Симметрия знаков: если обособление открыто через тире, закрывать его необходимо тоже тире.",
    },
  },
  {
    id: "comma-splice",
    title: "Правило 4. Comma Splice (Склейка запятой)",
    ruleShort: "Два полных предложения нельзя соединять одной лишь запятой.",
    ruleFull: "Если у вас есть два полноценных предложения (IC, IC), разделять их просто запятой — грубейшая ошибка. Варианты исправления: 1) Точка (IC. IC); 2) Точка с запятой (IC; IC); 3) Запятая + союз FANBOYS (IC, and IC).",
    correctExample: "The climate is arid, so few deciduous trees survive.",
    wrongExample: "The climate is arid, few deciduous trees survive.",
    miniQuiz: {
      question: "Какая пунктуация правильна: 'The museum curator acquired three paintings [ ... ] all of them were restored.'",
      options: [
        "paintings, all of them",
        "paintings; all of them",
        "paintings all of them",
      ],
      correct: 1,
      explanation: "Обе части — полные предложения. Просто запятая создаст comma splice. Необходима точка с запятой.",
    },
  },
  {
    id: "apostrophes",
    title: "Правило 5. Апострофы (It's vs Its vs Its')",
    ruleShort: "It's = It is. Its = его/её (притяжательное). Its' — НЕ СУЩЕСТВУЕТ В ПРИРОДЕ!",
    ruleFull: "College Board обожает ловить студентов на слове Its'. Запомните: слова its' в английском языке нет. Если можно подставить 'it is', выбирайте it's. Если речь о принадлежности неодушевленного предмета — its.",
    correctExample: "The university updated its admissions policy; it's now test-optional.",
    wrongExample: "The university updated it's admissions policy; its' now test-optional.",
    miniQuiz: {
      question: "The satellite sent [ its / it's / its' ] telemetry back to Earth.",
      options: ["its", "it's", "its'"],
      correct: 0,
      explanation: "Притяжательное местоимение для неодушевленного спутника — 'its'. Вариант 'its'' не существует.",
    },
  },
  {
    id: "transitions",
    title: "Правило 6. Логические переходы (Transitions)",
    ruleShort: "Три типа связок: Контраст (However), Добавление (Furthermore), Следствие (Therefore).",
    ruleFull: "Перед выбором союза перечитайте предложение до и предложение после. 1) Мысли спорят? -> However, In contrast, Nonetheless. 2) Вторая мысль развивает первую? -> Furthermore, In addition, Moreover. 3) Вторая мысль — итог первой? -> Therefore, Consequently, Thus.",
    correctExample: "Solar panels were expensive in 2000. Therefore, few households installed them.",
    wrongExample: "Solar panels were expensive in 2000. However, few households installed them.",
    miniQuiz: {
      question: "She spent years mastering organic chemistry. [ However / Consequently / For example ], she passed the medical board exam on her first try.",
      options: ["Consequently", "However", "In contrast"],
      correct: 0,
      explanation: "Сдача экзамена — прямое логическое следствие многолетней учебы (причина -> результат).",
    },
  },
];

interface MathFormula {
  id: string;
  title: string;
  category: string;
  formula: string;
  description: string;
  secretHack: string;
}

const MATH_FORMULAS: MathFormula[] = [
  {
    id: "vieta",
    title: "Теорема Виета для квадратных уравнений",
    category: "Алгебра",
    formula: "x_1 + x_2 = -b/a,   x_1 \\cdot x_2 = c/a",
    description: "Для ax² + bx + c = 0 сумма корней равна -b/a, а произведение равно c/a.",
    secretHack: "Если в вопросе SAT спрашивают 'What is the sum of all solutions to 2x² - 12x + 7 = 0?', НЕ ищите сами корни через дискриминант! Сразу посчитайте: -(-12)/2 = 6. Экономит 2 минуты.",
  },
  {
    id: "circle-eq",
    title: "Уравнение окружности и метод полного квадрата",
    category: "Геометрия",
    formula: "(x - h)^2 + (y - k)^2 = r^2",
    description: "Центр окружности находится в точке (h, k), радиус равен r (квадрат радиуса r²).",
    secretHack: "Если дано уравнение x² + 6x + y² - 8y = 20, разделите линейные коэффициенты на 2: h = -6/2 = -3, k = -(-8)/2 = 4. Центр (-3, 4). Радиус r = √(20 + 3² + 4²) = √45.",
  },
  {
    id: "vertex-formula",
    title: "Вершина параболы (Vertex Form)",
    category: "Алгебра",
    formula: "x_v = -\\frac{b}{2a},   y = a(x - h)^2 + k",
    description: "Ось симметрии параболы всегда проходит через x = -b/(2a). В форме вершины координаты вершины — (h, k).",
    secretHack: "Если парабола касается оси x в одной точке, то дискриминант b² - 4ac = 0, а значение вершины k = 0.",
  },
  {
    id: "perpendicular-slopes",
    title: "Наклоны параллельных и перпендикулярных прямых",
    category: "Линейные уравнения",
    formula: "m_1 = m_2 \\text{ (параллельны)},   m_1 \\cdot m_2 = -1 \\text{ (перпендикулярны)}",
    description: "Параллельные прямые имеют одинаковый наклон. Перпендикулярные — отрицательно взаимно-обратный (m2 = -1/m1).",
    secretHack: "Наклон прямой ax + by = c всегда равен m = -a/b. Перпендикулярный наклон будет равен b/a.",
  },
  {
    id: "exponential-growth",
    title: "Экспоненциальный рост и спад (Interest & Decay)",
    category: "Проценты",
    formula: "A = P(1 \\pm r)^t   \\text{или}   A = P(1 \\pm r/n)^{nt}",
    description: "P — начальное значение, r — процентная ставка в десятичном виде (5% = 0.05), t — время.",
    secretHack: "Если основание больше 1 (напр. 1.08^t), величина растет на 8%. Если меньше 1 (напр. 0.85^t), величина падает на (1 - 0.85) = 15% за шаг.",
  },
];

export const Cheatsheet = () => {
  const [activeTab, setActiveTab] = useState<"desmos" | "grammar" | "math">("desmos");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playClickSound();
    toast.success("Скопировано в буфер обмена!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuizSelect = (ruleId: string, optionIdx: number, correctIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [ruleId]: optionIdx }));
    if (optionIdx === correctIdx) {
      playSuccessSound();
      toast.success("Верно! Отличное понимание правила.");
    } else {
      playErrorSound();
      toast.error("Неверно. Прочитайте разбор правила выше.");
    }
  };

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  // Filter items based on search query
  const filteredDesmos = DESMOS_HACKS.filter(
    (h) =>
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGrammar = GRAMMAR_RULES.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.ruleShort.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMath = MATH_FORMULAS.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.secretHack.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell title="Шпаргалка Digital SAT">
      <SeoHead
        title="Шпаргалка Digital SAT 2026: Desmos хаки, формулы и правила грамматики"
        description="Интерактивная шпаргалка для экзамена Digital SAT: хаки Desmos калькулятора, правила пунктуации и секретные математические формулы."
        path="/cheatsheet"
      />

      <div className="space-y-6 max-w-5xl mx-auto font-sans print:m-0 print:max-w-none print:p-0">
        {/* Header Desk */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5 print:border-neutral-300">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 text-xs font-semibold mb-1.5 print:hidden">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Digital SAT 2026 Strategy Guide</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Интерактивная шпаргалка SAT Hacks
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-normal">
              Все спасительные трюки Desmos, 10 правил грамматики и формулы быстрого счёта в одном месте.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать / PDF</span>
            </button>
          </div>
        </div>

        {/* Search bar & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          {/* Segmented Tab Control */}
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/60 gap-1 select-none">
            <button
              onClick={() => {
                setActiveTab("desmos");
                playClickSound();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 active:scale-95 ${
                activeTab === "desmos"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-amber-500" />
              <span>Desmos Matrix</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("grammar");
                playClickSound();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 active:scale-95 ${
                activeTab === "grammar"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-violet-500" />
              <span>Grammar Bible</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("math");
                playClickSound();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 active:scale-95 ${
                activeTab === "math"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Formula Hub</span>
            </button>
          </div>

          {/* Quick Filter Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по правилам и формулам..."
              className="w-full h-9 pl-8 pr-3 rounded-xl border border-border/70 bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* ============================================================= */}
        {/* TAB 1: DESMOS MATRIX */}
        {/* ============================================================= */}
        {activeTab === "desmos" && (
          <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDesmos.map((hack) => {
                const isCopied = copiedId === hack.id;
                return (
                  <div
                    key={hack.id}
                    className="rounded-2xl border border-border/80 bg-card p-5 space-y-3.5 shadow-2xs hover:border-amber-500/40 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {hack.category}
                        </span>
                        <button
                          onClick={() => handleCopy(hack.id, hack.snippet)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-border/70 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 active:scale-95 print:hidden"
                          title="Скопировать формулу в буфер"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">Скопировано</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Скопировать</span>
                            </>
                          )}
                        </button>
                      </div>

                      <h3 className="font-bold text-base text-foreground tracking-tight">
                        {hack.title}
                      </h3>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        <MathText text={hack.description} />
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {/* Code Snippet Box */}
                      <div className="p-2.5 rounded-xl bg-muted/60 border border-border/60 font-mono-tech text-xs text-foreground font-semibold flex items-center justify-between">
                        <code>{hack.snippet}</code>
                      </div>

                      <div className="text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed flex items-start gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div><strong>Как применять: </strong><MathText text={hack.explanation} /></div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-muted-foreground">
                        <strong className="text-foreground">Пример задачи: </strong>
                        <MathText text={hack.example} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: GRAMMAR BIBLE */}
        {/* ============================================================= */}
        {activeTab === "grammar" && (
          <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in duration-150">
            <div className="space-y-4">
              {filteredGrammar.map((rule) => {
                const userSelected = quizAnswers[rule.id];
                const hasAnswered = userSelected !== undefined;

                return (
                  <div
                    key={rule.id}
                    className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-2xs"
                  >
                    <div className="space-y-1.5 border-b border-border/60 pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                          {rule.title}
                        </h3>
                        <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                          SAT Reading & Writing
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {rule.ruleShort}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                      {rule.ruleFull}
                    </p>

                    {/* Right vs Wrong Examples */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Правильно на SAT:</span>
                        </div>
                        <p className="text-neutral-700 dark:text-neutral-200">{rule.correctExample}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Ловушка College Board (Неверно):</span>
                        </div>
                        <p className="text-neutral-700 dark:text-neutral-200 line-through opacity-80">{rule.wrongExample}</p>
                      </div>
                    </div>

                    {/* Interactive 10-Second Mini-Quiz */}
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2.5 print:hidden">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-foreground">
                          Мини-тренажер: Проверь себя
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-medium">{rule.miniQuiz.question}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rule.miniQuiz.options.map((opt, optIdx) => {
                          const isCorrect = optIdx === rule.miniQuiz.correct;
                          const isChosen = userSelected === optIdx;

                          let btnStyle = "bg-card border-border hover:border-amber-500/50";
                          if (hasAnswered) {
                            if (isCorrect) {
                              btnStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold";
                            } else if (isChosen) {
                              btnStyle = "bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300 line-through";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleQuizSelect(rule.id, optIdx, rule.miniQuiz.correct)}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 active:scale-[0.98] ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <p className="text-[11px] text-muted-foreground pt-1 flex items-start gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{rule.miniQuiz.explanation}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: FORMULA HUB */}
        {/* ============================================================= */}
        {activeTab === "math" && (
          <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMath.map((formula) => (
                <div
                  key={formula.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-2xs hover:border-amber-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                        {formula.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground tracking-tight">
                      {formula.title}
                    </h3>

                    {/* Formula Math Box */}
                    <div className="p-3 rounded-xl bg-muted/60 border border-border/70 text-sm text-foreground font-bold text-center tracking-wide overflow-x-auto">
                      <MathText math={formula.formula} display />
                    </div>

                    <div className="text-xs text-muted-foreground leading-relaxed">
                      <MathText text={formula.description} />
                    </div>
                  </div>

                  {/* Secret Exam Hack */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Секретный хак на тесте:</span>
                    </div>
                    <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                      <MathText text={formula.secretHack} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Cheatsheet;
