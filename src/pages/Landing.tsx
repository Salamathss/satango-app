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
  { tag: "Module 01", label: "Capability", title: "Adaptive Practice", body: "Question difficulty recalibrates every submission. No filler drills — the engine targets the exact concepts you miss.", icon: BookOpen },
  { tag: "Module 02", label: "Capability", title: "Socratic AI Tutor", body: "When you miss a question, an AI coach walks you back through the reasoning — never gives the answer, always builds intuition.", icon: Brain },
  { tag: "Module 03", label: "Capability", title: "Full Mock Exams", body: "Digital SAT-format sectional and full-length simulations with scaled scoring and diagnostic reports.", icon: FileText },
  { tag: "Module 04", label: "Capability", title: "Error Ledger", body: "Every wrong answer is filed for review. Clear the ledger to consolidate mastery — hearts not spent.", icon: AlertCircle },
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

/* ---------------------------------------------------------------- helpers */

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
    // never let analytics block the CTA
  }
}

const DottedGrid = () => (
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.14]"
    style={{
      backgroundImage: "radial-gradient(hsl(var(--foreground)) 0.5px, transparent 0.5px)",
      backgroundSize: "24px 24px",
    }}
  />
);

const MonoLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-mono-tech text-[10px] uppercase tracking-[0.18em] opacity-60 ${className}`}>
    {children}
  </span>
);

/* ---------------------------------------------------------------- CTA btn */

const PrimaryCta = ({
  event,
  children,
  size = "md",
}: {
  event: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    // fire-and-forget, but wait max 300ms so navigation isn't perceptibly delayed
    await Promise.race([trackCta(event), new Promise((r) => setTimeout(r, 300))]);
    navigate("/auth");
  };
  return (
    <button
      onClick={handle}
      data-cta={event}
      className={`group inline-flex items-center justify-center gap-4 bg-foreground text-background font-medium transition-transform active:scale-[0.98] disabled:opacity-70 ${
        size === "lg" ? "px-8 py-4 text-sm" : "px-6 py-3 text-sm"
      }`}
    >
      {children}
      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2} />
    </button>
  );
};

/* ---------------------------------------------------------------- email form */

const EmailCapture = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
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
      // 23505 = unique_violation → already subscribed; treat as success
      if ((error as { code?: string }).code === "23505") {
        setStatus("success");
        return;
      }
      setStatus("error");
      setErrorMsg("Something went wrong. Try again in a moment.");
      toast({ title: "Subscription failed", description: error.message, variant: "destructive" });
      return;
    }
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 bg-card border border-border/60 px-4 py-3 text-sm">
        <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
        <span>You're on the list. Watch your inbox.</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <MonoLabel>// Early Access</MonoLabel>
      <div className="mt-2 flex flex-col sm:flex-row gap-2">
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
          className="flex-1 bg-white/80 border border-[hsl(var(--divider))] rounded-md px-3 py-2.5 font-mono-tech text-sm focus:outline-none focus:border-foreground/60 transition placeholder:opacity-40"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-70"
        >
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
        </button>
      </div>
      {status === "error" && errorMsg && (
        <p id="email-error" className="mt-2 font-mono-tech text-[11px] uppercase tracking-widest text-[hsl(var(--destructive))]">
          // {errorMsg}
        </p>
      )}
      <p className="mt-2 font-mono-tech text-[10px] uppercase tracking-widest opacity-40">
        // No spam. One weekly note on Digital SAT strategy.
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
    // Avoid scrollIntoView which causes the page to jump; use container scrolling instead.
    el.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  };

  // Auto-advance every 6s
  useEffect(() => {
    const t = setInterval(() => scrollTo(idx + 1), 6000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            className="snap-start shrink-0 w-[min(88%,520px)] bg-card border border-border/60 shadow-[6px_6px_0px_hsl(var(--foreground)/0.04)] p-8 relative"
          >
            <div className="absolute -top-3 left-6 bg-background px-3 font-mono-tech text-[11px] uppercase tracking-tighter border border-border/60">
              Field Report / {t.id}
            </div>
            <MonoLabel>{t.name}</MonoLabel>
            <blockquote className="text-lg md:text-xl font-medium tracking-tight leading-snug mt-3 mb-6">
              "{t.quote}"
            </blockquote>
            <div className="border-t border-border/60 pt-3 flex items-center justify-between">
              <span className="font-mono-tech text-[10px] uppercase opacity-60 tracking-widest">
                {t.context}
              </span>
              <span className="font-mono-tech text-[10px] uppercase opacity-40 tracking-widest">
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
                i === idx ? "w-8 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scrollTo(idx - 1)}
            aria-label="Previous testimonial"
            className="w-9 h-9 border border-border/60 hover:bg-muted transition flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => scrollTo(idx + 1)}
            aria-label="Next testimonial"
            className="w-9 h-9 border border-border/60 hover:bg-muted transition flex items-center justify-center"
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
    <div className="min-h-screen bg-background text-foreground relative">
      <SeoHead
        title="SATANGO — Digital SAT Mastery"
        description="High-fidelity Digital SAT prep: adaptive practice, Socratic AI tutor, full mock exams, and a nine-module curriculum."
        path="/"
        jsonLd={faqJsonLd}
      />

      {/* subtle top gradient */}
      <div
        className="absolute inset-x-0 top-0 h-96 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(var(--accent) / 0.4) 0%, transparent 60%)",
        }}
      />

      {/* NAV */}
      <nav className="relative z-20 border-b border-border/60">
        <DottedGrid />
        <div className="relative max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-sm">
              S
            </div>
            <span className="font-semibold tracking-tight text-lg">Satango</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/score-calculator"
              className="hidden sm:inline-flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-widest px-3 py-2 opacity-70 hover:opacity-100 transition"
            >
              <Calculator className="w-3.5 h-3.5" strokeWidth={2} />
              Calculator
            </Link>
            <Link
              to="/auth"
              className="hidden sm:inline-flex font-mono-tech text-[11px] uppercase tracking-widest px-3 py-2 opacity-70 hover:opacity-100 transition"
            >
              Sign in
            </Link>
            <PrimaryCta event="nav_start_free">Start free</PrimaryCta>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <DottedGrid />
        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:block opacity-25">
          <div className="h-56 w-px bg-foreground mb-3" />
          <span className="font-mono-tech text-[10px] rotate-90 origin-left inline-block translate-x-3 uppercase tracking-widest">
            Structural Margin
          </span>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16">
          <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/60 pb-8 mb-12 gap-6">
            <div>
              <div className="font-mono-tech text-[10px] tracking-widest uppercase opacity-60 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                System / Landing / v2.0.4
              </div>
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[0.9]">
                SATANGO
              </h1>
            </div>
            <div className="max-w-xs">
              <p className="text-lg leading-relaxed text-foreground/80">
                High-fidelity Digital SAT training for students who prefer precision over noise.
              </p>
            </div>
          </header>

          {/* Hero card */}
          <div className="bg-card border border-border/60 shadow-[8px_8px_0px_hsl(var(--foreground)/0.04)] p-8 md:p-12 relative">
            <div className="absolute -top-3 left-8 bg-background px-3 font-mono-tech text-[11px] uppercase tracking-tighter border border-border/60">
              Core Module 01
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <MonoLabel>Thesis</MonoLabel>
                  <h2 className="text-2xl md:text-3xl font-medium tracking-tight italic">
                    Engineered mastery, not test-prep theatre.
                  </h2>
                  <p className="text-sm md:text-base text-foreground/70 leading-relaxed">
                    An adaptive engine, a Socratic AI coach, and full-format mock exams — combined
                    into one structured 9-module path. You do the work; the system removes
                    everything you don't need.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <PrimaryCta event="hero_start_training">Начать подготовку</PrimaryCta>
                  <Link
                    to="/auth"
                    onClick={() => void trackCta("hero_sign_in")}
                    className="flex items-center justify-center gap-2 border border-border/70 px-6 py-3 text-sm font-medium hover:bg-muted transition"
                  >
                    Sign in
                  </Link>
                </div>

                <div className="pt-6 border-t border-border/60">
                  <EmailCapture />
                </div>
              </div>

              <div className="flex flex-col justify-end space-y-8">
                <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-8">
                  {metrics.map((m) => (
                    <div key={m.label}>
                      <div className="font-mono-tech text-[22px] mb-1">{m.value}</div>
                      <div className="font-mono-tech text-[9px] uppercase opacity-60 tracking-widest">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="relative border-t border-border/60">
        <DottedGrid />
        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between border-b border-border/60 pb-6 mb-10">
            <div>
              <MonoLabel>// Section 02</MonoLabel>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mt-2">
                Four instruments. One curriculum.
              </h3>
            </div>
            <span className="hidden md:inline font-mono-tech text-[10px] uppercase opacity-40 tracking-widest">
              04 / 04
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-border/60 border border-border/60">
            {capabilities.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="bg-card p-8 hover:bg-muted transition-colors relative">
                  <div className="flex items-start justify-between mb-6">
                    <MonoLabel>{c.tag}</MonoLabel>
                    <Icon className="w-4 h-4 opacity-60" strokeWidth={1.5} />
                  </div>
                  <MonoLabel className="!opacity-50">{c.label}</MonoLabel>
                  <h4 className="text-xl font-medium tracking-tight italic mt-1 mb-3">{c.title}</h4>
                  <p className="text-sm text-foreground/70 leading-relaxed">{c.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section className="relative border-t border-border/60">
        <DottedGrid />
        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between border-b border-border/60 pb-6 mb-10">
            <div>
              <MonoLabel>// Section 03</MonoLabel>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mt-2">
                The nine-module path.
              </h3>
            </div>
            <span className="hidden md:inline font-mono-tech text-[10px] uppercase opacity-40 tracking-widest">
              MAP / 09
            </span>
          </div>

          <ol className="border border-border/60 bg-card divide-y divide-border/60">
            {roadmap.map((title, i) => (
              <li key={title} className="flex items-center gap-6 px-6 py-4 hover:bg-muted transition-colors">
                <span className="font-mono-tech text-[11px] opacity-50 w-8">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-[15px] font-medium tracking-tight">{title}</span>
                <span className="font-mono-tech text-[10px] uppercase opacity-40 tracking-widest">
                  {i === 8 ? "Diagnostic" : "Practice → Boss"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TESTIMONIALS CAROUSEL */}
      <section className="relative border-t border-border/60">
        <DottedGrid />
        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between border-b border-border/60 pb-6 mb-10">
            <div>
              <MonoLabel>// Section 04</MonoLabel>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mt-2">
                Field reports from the ledger.
              </h3>
            </div>
            <span className="hidden md:inline font-mono-tech text-[10px] uppercase opacity-40 tracking-widest">
              {String(testimonials.length).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
            </span>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* FAQ */}
      <section className="relative border-t border-border/60">
        <DottedGrid />
        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between border-b border-border/60 pb-6 mb-10">
            <div>
              <MonoLabel>// Section 05</MonoLabel>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mt-2">
                Questions, answered.
              </h3>
            </div>
            <span className="hidden md:inline font-mono-tech text-[10px] uppercase opacity-40 tracking-widest">
              FAQ / {String(faqs.length).padStart(2, "0")}
            </span>
          </div>

          <Accordion
            type="single"
            collapsible
            className="border border-border/60 bg-card divide-y divide-border/60"
          >
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-0 px-6">
                <AccordionTrigger className="hover:no-underline py-5 text-left">
                  <div className="flex items-baseline gap-4 flex-1 pr-4">
                    <span className="font-mono-tech text-[11px] opacity-50 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] font-medium tracking-tight">{f.q}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-10 pr-4 pb-5 text-sm text-foreground/70 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative border-t border-border/60">
        <DottedGrid />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <MonoLabel>// Terminal</MonoLabel>
          <h3 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[0.95] mt-4 mb-6">
            Begin the diagnostic.
            <br />
            <span className="italic opacity-70">Ship a real score.</span>
          </h3>
          <p className="max-w-md mx-auto text-foreground/70 mb-8">
            Free to start. No credit card. Your first module unlocks in under a minute.
          </p>
          <div className="inline-flex">
            <PrimaryCta event="footer_start_training" size="lg">
              Начать подготовку
            </PrimaryCta>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-mono-tech text-[10px] uppercase opacity-50 tracking-widest">
            Session · Unauthenticated
          </span>
          <div className="flex items-center gap-6">
            <Link to="/score-calculator" className="font-mono-tech text-[10px] uppercase opacity-60 hover:opacity-100 tracking-widest transition">
              Calculator
            </Link>
            <Link to="/trust" className="font-mono-tech text-[10px] uppercase opacity-60 hover:opacity-100 tracking-widest transition">
              Trust
            </Link>
            <Link to="/auth" className="font-mono-tech text-[10px] uppercase opacity-60 hover:opacity-100 tracking-widest transition">
              Sign in
            </Link>
            <span className="font-mono-tech text-[10px] uppercase opacity-40 tracking-widest">
              © Satango · Node 042
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
