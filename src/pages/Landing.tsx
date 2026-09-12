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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const metrics = [
  { value: "+180", label: "Avg. Score Lift" },
  { value: "9", label: "Core Modules" },
  { value: "1.2s", label: "AI Tutor Latency" },
  { value: "12k+", label: "Practice Items" },
];

const capabilities = [
  {
    tag: "Module 01",
    label: "Capability",
    title: "Adaptive Practice",
    body: "Question difficulty recalibrates every submission. No filler drills — the engine targets the exact concepts you miss.",
    icon: BookOpen,
  },
  {
    tag: "Module 02",
    label: "Capability",
    title: "Socratic AI Tutor",
    body: "When you miss a question, an AI coach walks you back through the reasoning — never gives the answer, always builds intuition.",
    icon: Brain,
  },
  {
    tag: "Module 03",
    label: "Capability",
    title: "Full Mock Exams",
    body: "Digital SAT-format sectional and full-length simulations with scaled scoring and diagnostic reports.",
    icon: FileText,
  },
  {
    tag: "Module 04",
    label: "Capability",
    title: "Error Ledger",
    body: "Every wrong answer is filed for review. Clear the ledger to consolidate mastery — hearts not spent.",
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

const MonoLabel = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`font-mono-tech text-[10px] uppercase tracking-[0.2em] opacity-60 ${className}`}
  >
    {children}
  </span>
);

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
      <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
        <span>You're on the list. Watch your inbox.</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <div className="text-[10px] font-mono-tech uppercase tracking-widest text-neutral-400 mb-2">
        // EARLY ACCESS
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
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
          placeholder="you@school.edu"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "email-error" : undefined}
          className="flex-1 bg-neutral-900/90 border border-neutral-700/80 rounded-md px-3.5 py-2.5 font-mono-tech text-sm text-white focus:outline-none focus:border-white/50 transition placeholder:text-neutral-500"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 bg-neutral-200 hover:bg-white text-neutral-950 font-semibold px-5 py-2.5 text-xs uppercase tracking-wider rounded-md transition disabled:opacity-60 shadow-sm"
        >
          {status === "loading" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </button>
      </div>
      {status === "error" && errorMsg && (
        <p
          id="email-error"
          className="mt-2 font-mono-tech text-[10px] uppercase tracking-widest text-red-400"
        >
          // {errorMsg}
        </p>
      )}
      <p className="mt-2 font-mono-tech text-[10px] uppercase tracking-widest text-neutral-500">
        // NO SPAM, ONE WEEKLY NOTE ON DIGITAL SAT STRATEGY.
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
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-6 px-6 pb-2"
      >
        {testimonials.map((t, i) => (
          <article
            key={t.id}
            aria-hidden={i !== idx}
            className="snap-start shrink-0 w-[min(88%,520px)] bg-neutral-900/70 border border-neutral-800 rounded-2xl p-8 relative backdrop-blur-sm"
          >
            <div className="absolute -top-3 left-6 bg-neutral-950 px-3 font-mono-tech text-[10px] uppercase tracking-wider border border-neutral-800 text-neutral-400 rounded">
              Field Report / {t.id}
            </div>
            <MonoLabel className="text-neutral-400">{t.name}</MonoLabel>
            <blockquote className="text-lg md:text-xl font-medium tracking-tight leading-snug mt-3 mb-6 text-neutral-200">
              "{t.quote}"
            </blockquote>
            <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
              <span className="font-mono-tech text-[10px] uppercase text-neutral-400 tracking-widest">
                {t.context}
              </span>
              <span className="font-mono-tech text-[10px] uppercase text-neutral-500 tracking-widest">
                Verified
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1.5">
          {testimonials.map((t, i) => (
            <button
              key={t.id}
              onClick={() => scrollTo(i)}
              aria-label={`Show testimonial ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-8 bg-white" : "w-1.5 bg-neutral-700 hover:bg-neutral-500"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scrollTo(idx - 1)}
            aria-label="Previous testimonial"
            className="w-9 h-9 border border-neutral-800 rounded-lg hover:bg-neutral-800 text-neutral-300 transition flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => scrollTo(idx + 1)}
            aria-label="Next testimonial"
            className="w-9 h-9 border border-neutral-800 rounded-lg hover:bg-neutral-800 text-neutral-300 transition flex items-center justify-center"
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
    <div className="min-h-screen bg-[#11100f] text-neutral-100 relative selection:bg-amber-500/30 selection:text-white overflow-x-hidden font-sans">
      <SeoHead
        title="SATANGO — Digital SAT Mastery"
        description="High-fidelity Digital SAT training for students who prefer precision over noise. Adaptive practice, Socratic AI coach, and full mock exams."
        path="/"
        jsonLd={faqJsonLd}
      />

      {/* TOP NAVIGATION */}
      <nav className="relative z-30 border-b border-white/[0.08] bg-[#11100f]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/20 flex items-center justify-center font-black text-sm text-white shadow-sm">
              S
            </div>
            <span className="font-mono-tech font-extrabold text-base tracking-[0.2em] uppercase text-white">
              SATANGO
            </span>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/score-calculator"
              className="inline-flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-widest text-neutral-400 hover:text-white transition"
            >
              <Calculator className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Calculator</span>
            </Link>
            <Link
              to="/auth"
              className="inline-flex font-mono-tech text-[11px] uppercase tracking-widest text-neutral-400 hover:text-white transition"
            >
              Sign in
            </Link>
            <button
              onClick={() => {
                void trackCta("nav_start_free");
                navigate("/auth");
              }}
              className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-white text-neutral-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
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
          {/* Main statue image anchored to top-right on desktop */}
          <img
            src="/philosopher.jpg"
            alt="Philosopher with Golden Kintsugi"
            className="w-full h-full object-cover object-[75%_top] sm:object-right-top lg:scale-100 brightness-[0.88] contrast-[1.08] transition-transform duration-1000"
          />
          {/* Left-to-right shadow gradient for crystal clear text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#11100f] via-[#11100f]/85 to-transparent sm:via-[#11100f]/70" />
          {/* Top and bottom subtle vignettes */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#11100f]/70 via-transparent to-[#11100f]" />
        </div>

        {/* Hero content container */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-16 w-full flex-1 flex flex-col justify-between">
          {/* Top header row: System tag, SATANGO Title, Subtitle quote */}
          <div className="border-b border-white/10 pb-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className="font-mono-tech text-[11px] tracking-[0.25em] uppercase text-neutral-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
                  SYSTEM / LANDING / V2.0.4
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-white uppercase leading-[0.9]">
                  SATANGO
                </h1>
              </div>
              <div className="max-w-md">
                <p className="text-sm sm:text-base md:text-lg text-neutral-300 font-normal leading-relaxed">
                  High-fidelity Digital SAT training for students who prefer precision over noise.
                </p>
              </div>
            </div>
          </div>

          {/* Main Hero Grid: Left Card + Right Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end my-auto">
            {/* Main Floating Glass Card */}
            <div className="lg:col-span-7 bg-[#171615]/85 backdrop-blur-xl border border-white/[0.12] rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-6 relative overflow-hidden">
              {/* Top Card Badge */}
              <div className="inline-flex items-center gap-2 border border-white/15 px-3 py-1 rounded-md text-[10px] font-mono-tech uppercase tracking-widest text-neutral-300 bg-white/5">
                Core Module 01
              </div>

              {/* Thesis & Headline */}
              <div className="space-y-2.5">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  THESIS
                </div>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight italic text-white leading-snug">
                  Engineered mastery, not test-prep theatre.
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl">
                  An adaptive engine, a Socratic AI coach, and full-format mock exams — combined into one structured 9-module path. You do the work; the system removes everything you don't need.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    void trackCta("hero_start_training");
                    navigate("/auth");
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-neutral-100 hover:bg-white text-neutral-950 font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Начать подготовку</span>
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <Link
                  to="/auth"
                  onClick={() => void trackCta("hero_sign_in")}
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-white/20 text-white bg-white/5 hover:bg-white/10 transition"
                >
                  Sign in
                </Link>
              </div>

              {/* Early Access Email form inside card */}
              <div className="pt-4 border-t border-white/10">
                <EmailCapture />
              </div>
            </div>

            {/* Right Metrics Grid */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-6 p-4 sm:p-6 bg-[#171615]/50 backdrop-blur-md border border-white/[0.08] rounded-3xl">
              {metrics.map((m) => (
                <div key={m.label} className="space-y-1">
                  <div className="font-mono-tech text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {m.value}
                  </div>
                  <div className="font-mono-tech text-[10px] uppercase text-neutral-400 tracking-widest font-medium">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES SECTION */}
      <section className="relative z-10 border-t border-white/10 bg-[#141312]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 mb-12 gap-4">
            <div>
              <MonoLabel className="text-neutral-400">// Section 02</MonoLabel>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mt-2">
                Four instruments. One curriculum.
              </h3>
            </div>
            <span className="font-mono-tech text-[10px] uppercase text-neutral-500 tracking-widest">
              04 / 04
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden">
            {capabilities.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="bg-[#171615] p-8 hover:bg-[#1f1d1c] transition-colors relative space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono-tech text-[10px] uppercase text-neutral-400 tracking-wider">
                      {c.tag}
                    </span>
                    <Icon className="w-5 h-5 text-amber-500/80" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="text-xl font-medium tracking-tight italic text-white mb-2">
                      {c.title}
                    </h4>
                    <p className="text-sm text-neutral-400 leading-relaxed">
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
      <section className="relative z-10 border-t border-white/10 bg-[#11100f]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 mb-12 gap-4">
            <div>
              <MonoLabel className="text-neutral-400">// Section 03</MonoLabel>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mt-2">
                The nine-module path.
              </h3>
            </div>
            <span className="font-mono-tech text-[10px] uppercase text-neutral-500 tracking-widest">
              MAP / 09
            </span>
          </div>

          <ol className="border border-white/10 bg-[#171615] rounded-2xl overflow-hidden divide-y divide-white/10">
            {roadmap.map((title, i) => (
              <li
                key={title}
                className="flex items-center gap-6 px-6 py-4 hover:bg-white/5 transition-colors"
              >
                <span className="font-mono-tech text-xs text-neutral-500 font-bold w-8">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-[15px] font-medium tracking-tight text-neutral-200">
                  {title}
                </span>
                <span className="font-mono-tech text-[10px] uppercase text-neutral-500 tracking-widest">
                  {i === 8 ? "Diagnostic" : "Practice → Boss"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="relative z-10 border-t border-white/10 bg-[#141312]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 mb-12 gap-4">
            <div>
              <MonoLabel className="text-neutral-400">// Section 04</MonoLabel>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mt-2">
                Field reports from the ledger.
              </h3>
            </div>
            <span className="font-mono-tech text-[10px] uppercase text-neutral-500 tracking-widest">
              {String(testimonials.length).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
            </span>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="relative z-10 border-t border-white/10 bg-[#11100f]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 mb-12 gap-4">
            <div>
              <MonoLabel className="text-neutral-400">// Section 05</MonoLabel>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mt-2">
                Questions, answered.
              </h3>
            </div>
            <span className="font-mono-tech text-[10px] uppercase text-neutral-500 tracking-widest">
              FAQ / {String(faqs.length).padStart(2, "0")}
            </span>
          </div>

          <Accordion
            type="single"
            collapsible
            className="border border-white/10 bg-[#171615] rounded-2xl overflow-hidden divide-y divide-white/10"
          >
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-0 px-6">
                <AccordionTrigger className="hover:no-underline py-5 text-left text-neutral-200 hover:text-white">
                  <div className="flex items-baseline gap-4 flex-1 pr-4">
                    <span className="font-mono-tech text-xs text-neutral-500 shrink-0 font-bold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] font-medium tracking-tight">{f.q}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-10 pr-4 pb-5 text-sm text-neutral-400 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL TERMINAL CTA */}
      <section className="relative z-10 border-t border-white/10 bg-[#141312]">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
          <MonoLabel className="text-neutral-400">// Terminal</MonoLabel>
          <h3 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[0.95]">
            Begin the diagnostic.
            <br />
            <span className="italic font-normal text-neutral-400">Ship a real score.</span>
          </h3>
          <p className="max-w-md mx-auto text-neutral-400 text-sm">
            Free to start. No credit card. Your first module unlocks in under a minute.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                void trackCta("footer_start_training");
                navigate("/auth");
              }}
              className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-950 font-bold px-8 py-4 rounded-xl text-sm uppercase tracking-wider transition shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Начать подготовку</span>
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#0e0d0c]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-mono-tech text-[10px] uppercase text-neutral-500 tracking-widest">
            Session · Unauthenticated
          </span>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              to="/score-calculator"
              className="font-mono-tech text-[10px] uppercase text-neutral-400 hover:text-white tracking-widest transition"
            >
              Calculator
            </Link>
            <Link
              to="/trust"
              className="font-mono-tech text-[10px] uppercase text-neutral-400 hover:text-white tracking-widest transition"
            >
              Trust
            </Link>
            <Link
              to="/auth"
              className="font-mono-tech text-[10px] uppercase text-neutral-400 hover:text-white tracking-widest transition"
            >
              Sign in
            </Link>
            <span className="font-mono-tech text-[10px] uppercase text-neutral-600 tracking-widest">
              © Satango · Node 042
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
