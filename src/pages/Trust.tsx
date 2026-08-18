import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, Database, Mail, EyeOff } from "lucide-react";
import SeoHead from "@/components/SeoHead";

const SECTIONS = [
  {
    icon: ShieldCheck,
    title: "Access & authentication",
    body: "Accounts are protected by email/password and Google sign-in. Sessions use industry-standard token-based authentication and signed-in users can only access their own progress, hearts, gems, and answer history.",
  },
  {
    icon: Lock,
    title: "Platform & hosting context",
    body: "SATango is built and hosted on Lovable Cloud. Database access is gated by row-level rules and server-side functions so sensitive fields like premium status, XP, gems, and scoring cannot be modified directly from the browser.",
  },
  {
    icon: Database,
    title: "Data we collect & how we use it",
    body: "We store the data needed to run the learning experience: profile (display name, optional avatar), study progress (modules, levels, answers, streaks, hearts), and AI Tutor usage counts. Data is used to power the lessons, analytics, and gamification you see in the app.",
  },
  {
    icon: EyeOff,
    title: "Cookies & analytics",
    body: "We use functional cookies/local storage to keep you signed in and remember UI preferences. We do not sell personal data to third parties.",
  },
  {
    icon: Mail,
    title: "Privacy requests & contact",
    body: "To request data export, correction, or deletion of your account, contact the app owner using the in-app support link. We aim to respond within a reasonable timeframe.",
  },
];

const Trust = () => {
  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Trust, Security & Privacy — SATANGO"
        description="How SATANGO handles authentication, data storage, cookies, and privacy for Digital SAT prep users."
        path="/trust"
      />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <header className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ lineHeight: "1.15" }}>
            Trust, Security & Privacy
          </h1>
          <p className="text-sm text-muted-foreground">
            This page is maintained by the SATango team to answer common security and privacy
            questions about the app. It describes controls and practices currently enabled in the
            product — it is not an independent certification or audit report.
          </p>
        </header>

        <div className="space-y-4">
          {SECTIONS.map(({ icon: Icon, title, body }) => (
            <section
              key={title}
              className="bg-card rounded-2xl p-5 border border-border/50 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-bold text-base">{title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="bg-muted/40 rounded-2xl p-5 border border-border/50">
          <h2 className="font-bold text-base mb-2">Shared responsibility</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lovable Cloud provides the underlying hosting, database, and authentication
            infrastructure. The SATango team is responsible for app-level data handling, content,
            and user-facing controls described above. You are responsible for keeping your account
            credentials secure and reporting suspicious activity.
          </p>
        </section>

        <p className="text-xs text-muted-foreground text-center">
          Last reviewed by the SATango team on the page above. For security concerns, please reach
          out via the in-app support link.
        </p>
      </main>
    </div>
  );
};

export default Trust;
