import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  FileText,
  AlertCircle,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DreamUniversityCalculator } from "@/components/DreamUniversityCalculator";

const metrics = [
  { value: "+180", label: "Средний рост балла" },
  { value: "1540+", label: "Топ-результат учеников" },
  { value: "100%", label: "Формат Bluebook & Desmos" },
  { value: "12,000+", label: "Официальных вопросов" },
];

const capabilities = [
  {
    tag: "Индивидуальный темп",
    title: "Адаптивные тренировки",
    body: "Сложность заданий калибруется под ваш уровень. Никаких шаблонных тестов — система бьет ровно по темам, где вы теряете баллы.",
    icon: BookOpen,
  },
  {
    tag: "Пошаговый разбор",
    title: "Сократический ИИ-наставник",
    body: "При ошибке наставник не вываливает готовый ответ, а задает наводящие вопросы, вырабатывая глубокую интуицию решения задач.",
    icon: Brain,
  },
  {
    tag: "Официальный Bluebook",
    title: "Полноформатные мок-тесты",
    body: "Точная симуляция интерфейса College Board: двухмодульная адаптивность, реальный таймер и встроенный графический Desmos.",
    icon: FileText,
  },
  {
    tag: "Банк ошибок",
    title: "Умное повторение",
    body: "Каждая допущенная ошибка автоматически отправляется в ваш персональный тренажер для закрепления до 100% уверенности.",
    icon: AlertCircle,
  },
];

const roadmap = [
  "Foundations of Algebra",
  "Advanced Math",
  "Problem Solving & Data",
  "Geometry & Trigonometry",
  "Craft & Structure",
  "Information & Ideas",
  "Standard English Conventions",
  "Expression of Ideas",
  "Full Mock Diagnostic",
];

const testimonials = [
  {
    id: "01",
    name: "Anya K.",
    context: "11th grade · Baseline 1230 → 1440",
    quote:
      "I stopped grinding random problem sets. The error ledger and the AI tutor turned every mistake into a lesson. My score climbed 210 points in nine weeks.",
  },
  {
    id: "02",
    name: "Marcus L.",
    context: "12th grade · Baseline 1310 → 1510",
    quote:
      "The adaptive engine is uncanny — it kept feeding me the exact problem types I was avoiding. Two months in, my math section jumped 110 points.",
  },
  {
    id: "03",
    name: "Priya S.",
    context: "10th grade · Baseline 1180 → 1390",
    quote:
      "The nine-module path made SAT prep feel like a real curriculum instead of a Reddit thread. I always knew what to do next.",
  },
  {
    id: "04",
    name: "Daniel R.",
    context: "12th grade · Baseline 1400 → 1560",
    quote:
      "The mock exams matched the real Digital SAT format exactly. When test day came, nothing surprised me. First 1560 in my class.",
  },
];

const faqs = [
  {
    q: "Is Satango free to start?",
    a: "Yes. You can complete the first module, take a diagnostic quiz, and use the AI tutor without a card on file. Premium unlocks unlimited hearts, full mock exams, and advanced analytics.",
  },
  {
    q: "How accurate is the score estimate?",
    a: "The Score Calculator uses a published-curve approximation calibrated against College Board concordance tables. Full mock exams inside the app produce a scaled score within about ±30 points of a real Digital SAT.",
  },
  {
    q: "Does Satango match the Digital SAT format?",
    a: "Every practice item and mock exam mirrors the adaptive, module-based Digital SAT introduced by the College Board — same section timing, same question types, same scaled scoring band.",
  },
  {
    q: "Can I use Satango on mobile?",
    a: "Yes. The app is a responsive PWA — install it to your home screen for a fullscreen native-like experience on iOS and Android.",
  },
  {
    q: "How does the AI tutor work?",
    a: "The Socratic AI coach never hands you the answer. When you miss a question, it walks you back through the reasoning step by step so you rebuild the intuition and won't miss the pattern again.",
  },
];

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

async function trackCta(event: string) {
  try {
    await supabase.from("cta_events").insert({
      event,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    // Analytics fallback
  }
}

/* ---------------------------------------------------------------- email form */

const EmailCapture = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed) || trimmed.length > 254) {
      setStatus("error");
      setErrorMsg("Enter a valid email address.");
      return;
    }
    setStatus("loading");
    setErrorMsg(null);
    const { error } = await supabase.from("email_subscriptions").insert({
      email: trimmed,
      source: "landing_hero",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        setStatus("success");
        return;
      }
      setStatus("error");
      setErrorMsg("Something went wrong. Try again in a moment.");
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
        <span>Вы в списке! Гайд отправлен на вашу почту.</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Email для получения гайда по Desmos"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "email-error" : undefined}
          className="flex-1 bg-[#0C0C0E]/90 border border-neutral-800 hover:border-neutral-700 focus:border-blue-500/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-colors duration-150"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 font-bold px-5 py-2.5 text-xs rounded-xl transition-all duration-150 disabled:opacity-60 shadow-md shadow-white/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {status === "loading" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Получить гайд"
          )}
        </button>
      </div>
      {status === "error" && errorMsg && (
        <p
          id="email-error"
          className="mt-2 text-xs text-rose-400"
        >
          {errorMsg}
        </p>
      )}
      <p className="mt-2 text-xs text-neutral-400">
        Отправим PDF-гайд сразу после отправки. Без спама и навязчивой рекламы.
      </p>
    </form>
  );
};

/* ---------------------------------------------------------------- testimonial carousel */

const TestimonialCarousel = () => {
  const [idx, setIdx] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollTo = (i: number) => {
    const clamped = (i + testimonials.length) % testimonials.length;
    setIdx(clamped);
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.children[clamped] as HTMLElement | undefined;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  };

  useEffect(() => {
    const t = setInterval(() => scrollTo(idx + 1), 6000);
    return () => clearInterval(t);
  }, [idx]);

  return (
    <div>
      <div
        ref={scrollerRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-6 px-6 pb-2"
      >
        {testimonials.map((t, i) => (
          <article
            key={t.id}
            aria-hidden={i !== idx}
            className="snap-start shrink-0 w-[min(88%,520px)] bg-[#151518] border border-white/[0.08] hover:border-white/20 rounded-2xl p-7 sm:p-8 relative backdrop-blur-md transition-colors duration-200 shadow-xl shadow-black/40"
          >
            <div className="absolute -top-3 left-6 bg-[#0C0C0E] px-2.5 py-0.5 font-mono-tech text-xs uppercase tracking-wider border border-white/15 text-neutral-300 rounded-md font-semibold tabular-nums shadow-sm">
              Field Report / {t.id}
            </div>
            <div className="font-mono-tech text-xs tracking-wider uppercase text-neutral-200 font-bold">
              {t.name}
            </div>
            <blockquote className="text-base sm:text-lg font-normal tracking-tight leading-relaxed mt-3 mb-6 text-neutral-200 text-pretty">
              "{t.quote}"
            </blockquote>
            <div className="border-t border-white/[0.08] pt-3.5 flex items-center justify-between">
              <span className="font-mono-tech text-xs text-neutral-400 tracking-wide font-medium tabular-nums">
                {t.context}
              </span>
              <span className="font-mono-tech text-xs uppercase text-emerald-400 tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Verified
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2 items-center">
          {testimonials.map((t, i) => (
            <button
              key={t.id}
              onClick={() => scrollTo(i)}
              aria-label={`Show testimonial ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${
                i === idx ? "w-8 bg-white" : "w-2 bg-neutral-800 hover:bg-neutral-700"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scrollTo(idx - 1)}
            aria-label="Previous testimonial"
            className="w-9 h-9 border border-white/10 hover:border-white/25 rounded-xl hover:bg-white/5 text-neutral-300 hover:text-white transition-colors duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => scrollTo(idx + 1)}
            aria-label="Next testimonial"
            className="w-9 h-9 border border-white/10 hover:border-white/25 rounded-xl hover:bg-white/5 text-neutral-300 hover:text-white transition-colors duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- page */

const Landing = () => {
  const navigate = useNavigate();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-neutral-100 relative selection:bg-blue-500/30 selection:text-white overflow-x-hidden font-sans">
      <SeoHead
        title="SATANGO — Digital SAT Mastery"
        description="High-fidelity Digital SAT training for students who prefer precision over noise. Adaptive practice, Socratic AI coach, and full mock exams."
        path="/"
        jsonLd={faqJsonLd}
      />

      {/* TOP NAVIGATION */}
      <nav className="relative z-30 border-b border-white/[0.08] bg-[#0C0C0E]/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/15 flex items-center justify-center font-black text-sm text-white shadow-sm">
              S
            </div>
            <span className="font-mono-tech font-extrabold text-sm tracking-[0.18em] uppercase text-white">
              SATANGO
            </span>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/score-calculator"
              className="inline-flex items-center gap-1.5 font-mono-tech text-xs uppercase tracking-wider text-neutral-400 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              <Calculator className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Calculator</span>
            </Link>
            <Link
              to="/auth"
              className="inline-flex font-mono-tech text-xs uppercase tracking-wider text-neutral-400 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              Sign in
            </Link>
            <button
              onClick={() => {
                void trackCta("nav_start_free");
                navigate("/auth");
              }}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-neutral-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Start free</span>
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[calc(100vh-64px)] flex flex-col justify-between overflow-hidden">
        {/* Full-screen Philosopher Background with subtle cinematic overlay */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img
            src="/philosopher.jpg"
            alt="Philosopher with Golden Kintsugi"
            className="w-full h-full object-cover object-[75%_top] sm:object-right-top lg:scale-100 brightness-[0.88] contrast-[1.08] transition-transform duration-1000"
          />
          {/* Left-to-right shadow gradient for crystal clear text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0E] via-[#0C0C0E]/85 to-transparent sm:via-[#0C0C0E]/70" />
          {/* Top and bottom subtle vignettes */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0E]/70 via-transparent to-[#0C0C0E]" />
        </div>

        {/* Hero content container */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-16 w-full flex-1 flex flex-col justify-between">
          {/* Top header row: SATANGO Title, Subtitle quote */}
          <div className="border-b border-white/[0.08] pb-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-white uppercase leading-[0.9] text-balance">
                  SATANGO
                </h1>
              </div>
              <div className="max-w-md">
                <p className="text-sm sm:text-base md:text-lg text-neutral-300 font-normal leading-relaxed text-pretty">
                  Премиальная платформа подготовки к Digital SAT: адаптивные тесты, официальный симулятор Bluebook и умный банк ошибок.
                </p>
              </div>
            </div>
          </div>

          {/* Main Hero Grid: Left Card + Right Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end my-auto">
            {/* Main Floating Glass Card */}
            <div className="lg:col-span-7 bg-[#141417]/85 backdrop-blur-xl border border-white/[0.12] rounded-3xl p-6 sm:p-8 md:p-9 shadow-2xl shadow-black/60 space-y-6 relative overflow-hidden">
              {/* Headline & Subtitle */}
              <div className="space-y-2.5">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug text-balance">
                  Осознанная подготовка на 1500+ без зубрежки и хаоса
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl text-pretty">
                  Адаптивный банк задач, персональный Сократический наставник и симулятор реального экзамена Bluebook с Desmos. Занимайтесь только тем, что действительно увеличивает ваш итоговый результат.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    void trackCta("hero_start_training");
                    navigate("/auth");
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 font-bold px-6 py-3.5 rounded-xl text-sm transition-all duration-150 shadow-lg shadow-white/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span>Начать подготовку</span>
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <Link
                  to="/auth"
                  onClick={() => void trackCta("hero_sign_in")}
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-white/15 hover:border-white/30 text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Sign in
                </Link>
              </div>

              {/* Early Access Email form inside card */}
              <div className="pt-4 border-t border-white/[0.08]">
                <EmailCapture />
              </div>
            </div>

            {/* Right Metrics Grid */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-6 p-6 sm:p-7 bg-[#141417]/70 backdrop-blur-md border border-white/[0.08] rounded-3xl shadow-xl shadow-black/40">
              {metrics.map((m) => (
                <div key={m.label} className="space-y-1">
                  <div className="font-mono-tech text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                    {m.value}
                  </div>
                  <div className="font-mono-tech text-xs uppercase text-neutral-400 tracking-wider font-semibold mt-1">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DREAM UNIVERSITY SCORE CALCULATOR */}
      <DreamUniversityCalculator />

      {/* CAPABILITIES SECTION */}
      <section className="relative z-10 border-t border-white/[0.08] bg-[#0E0E11]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="border-b border-white/[0.08] pb-6 mb-12">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
              Четыре ключевых инструмента. Один четкий путь к 1500+.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.06] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl shadow-black/30">
            {capabilities.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="bg-[#151518] p-7 sm:p-8 hover:bg-[#1A1A1E] transition-colors duration-200 relative space-y-4 group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/[0.06] text-neutral-200 border border-white/10">
                      {c.tag}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 transition-colors duration-200">
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold tracking-tight text-white mb-2">
                      {c.title}
                    </h4>
                    <p className="text-sm text-neutral-300 leading-relaxed text-pretty">
                      {c.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CURRICULUM ROADMAP SECTION */}
      <section className="relative z-10 border-t border-white/[0.08] bg-[#0C0C0E]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="border-b border-white/[0.08] pb-6 mb-12">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
              9 модулей от фундаментальной базы до сложных ловушек
            </h3>
          </div>

          <ol className="border border-white/[0.08] bg-[#141417] rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-xl shadow-black/30">
            {roadmap.map((title, i) => (
              <li
                key={title}
                className="flex items-center gap-4 sm:gap-6 px-6 py-4.5 hover:bg-white/[0.03] transition-colors duration-150 group"
              >
                <span className="font-mono-tech text-xs text-neutral-500 group-hover:text-blue-400 font-bold w-7 tabular-nums transition-colors duration-150">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm sm:text-base font-semibold tracking-tight text-neutral-200 group-hover:text-white transition-colors duration-150">
                  {title}
                </span>
                <span
                  className={`font-mono-tech text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-md ${
                    i === 8
                      ? "text-blue-300 bg-blue-500/15 border border-blue-500/30"
                      : "text-neutral-400 bg-white/[0.04] border border-white/[0.08]"
                  }`}
                >
                  {i === 8 ? "Diagnostic" : "Practice → Boss"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="relative z-10 border-t border-white/[0.08] bg-[#0E0E11]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="border-b border-white/[0.08] pb-6 mb-12">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
              Реальный рост на 150–210 баллов
            </h3>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="relative z-10 border-t border-white/[0.08] bg-[#0C0C0E]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="border-b border-white/[0.08] pb-6 mb-12">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
              Прозрачные тарифы без скрытых платежей
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Tier 1: 1-Month Sprint */}
            <div className="bg-[#141417] border border-white/[0.08] hover:border-white/15 rounded-3xl p-7 sm:p-8 flex flex-col justify-between space-y-6 transition-colors duration-200 shadow-xl shadow-black/30">
              <div className="space-y-4">
                <h4 className="text-2xl font-bold text-white tracking-tight">1-Month Sprint</h4>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed text-pretty">
                  Ideal for students with an exam in 30 days who need intense practice and unlimited Socratic AI coach guidance.
                </p>
                <div className="pt-2">
                  <span className="text-4xl font-black text-white tabular-nums">$9.99</span>
                  <span className="text-xs text-neutral-400 font-mono-tech ml-2">/ month</span>
                </div>
                <ul className="space-y-3 pt-4 border-t border-white/[0.08] text-xs sm:text-sm text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                    <span>Unlimited Socratic AI Tutor</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                    <span>Mistake Vault Pro & targeted drills</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                    <span>Time & Pacing Analytics</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                    <span>Infinite Hearts & Full Mocks</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  void trackCta("pricing_sprint");
                  navigate("/auth");
                }}
                className="w-full py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-100 font-mono-tech text-xs uppercase tracking-wider font-bold transition-colors duration-150 border border-white/10 hover:border-white/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Choose 1-Month Sprint
              </button>
            </div>

            {/* Tier 2: 3-Month Mastery (HIT) */}
            <div className="bg-gradient-to-b from-[#181a24] via-[#14141b] to-[#121216] border border-blue-500/40 hover:border-blue-400/60 rounded-3xl p-7 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-2xl shadow-blue-950/30 transition-colors duration-200">
              <div className="absolute top-0 right-0 bg-blue-600 text-white font-mono-tech text-xs font-black px-3.5 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-sm">
                ХИТ · POPULAR · SAVE 20%
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-bold text-white tracking-tight">3-Month Mastery</h4>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed text-pretty">
                  Complete preparation cycle from baseline diagnostic to target 1500+ score.
                </p>
                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tabular-nums">$24.99</span>
                  <span className="text-xs text-neutral-400 font-mono-tech tabular-nums">for 3 months (~$8.33/mo)</span>
                </div>
                <ul className="space-y-3 pt-4 border-t border-white/[0.08] text-xs sm:text-sm text-neutral-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                    <span className="font-semibold text-white">All Pro features included</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                    <span>Built-in Streak Freeze Protection</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                    <span>Personalized weak-spot recovery path</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
                    <span>Priority Support via Telegram @sltrn0l</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  void trackCta("pricing_mastery");
                  navigate("/auth");
                }}
                className="w-full py-3.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-mono-tech text-xs uppercase tracking-wider font-black transition-all duration-150 shadow-lg shadow-white/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Get 3-Month Mastery
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="relative z-10 border-t border-white/[0.08] bg-[#0E0E11]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="border-b border-white/[0.08] pb-6 mb-12">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
              Ответы на главные вопросы об экзамене и платформе
            </h3>
          </div>

          <Accordion
            type="single"
            collapsible
            className="border border-white/[0.08] bg-[#141417] rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-xl shadow-black/30"
          >
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-0 px-6">
                <AccordionTrigger className="hover:no-underline py-5 text-left text-neutral-200 hover:text-white transition-colors duration-150 group">
                  <div className="flex items-baseline gap-4 flex-1 pr-4">
                    <span className="font-mono-tech text-xs text-neutral-500 group-hover:text-blue-400 shrink-0 font-bold tabular-nums transition-colors duration-150">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm sm:text-base font-semibold tracking-tight text-neutral-200 group-hover:text-white transition-colors duration-150">
                      {f.q}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-9 pr-4 pb-5 text-sm text-neutral-300 leading-relaxed text-pretty">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL HERO CTA */}
      <section className="relative z-10 border-t border-white/[0.08] bg-[#0C0C0E] overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
          <h3 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[0.95] text-balance">
            Пройди диагностику.
            <br />
            <span className="italic font-normal text-neutral-400">Получи свой реальный балл уже сегодня.</span>
          </h3>
          <p className="max-w-md mx-auto text-neutral-300 text-sm sm:text-base leading-relaxed text-pretty">
            Бесплатно. Без банковской карты. Твой первый адаптивный модуль откроется менее чем за минуту.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                void trackCta("footer_start_training");
                navigate("/auth");
              }}
              className="inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 font-bold px-8 py-4 rounded-xl text-sm transition-all duration-150 shadow-xl shadow-white/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Начать подготовку</span>
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-[#080809]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-neutral-400 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Платформа обновлена под стандарты College Board 2026
          </span>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              to="/score-calculator"
              className="text-xs text-neutral-400 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              Калькулятор
            </Link>
            <Link
              to="/trust"
              className="text-xs text-neutral-400 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              Методология
            </Link>
            <Link
              to="/auth"
              className="text-xs text-neutral-400 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              Войти
            </Link>
            <a
              href="https://t.me/sltrn0l"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors duration-150 flex items-center gap-1 font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              Поддержка: @sltrn0l
            </a>
            <span className="text-xs text-neutral-500">
              © 2026 SATANGO. Все права защищены.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
