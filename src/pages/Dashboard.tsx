import AppShell from "@/components/AppShell";
import MobileRoadmap from "@/components/MobileRoadmap";
import XPBar from "@/components/XPBar";
import DailyCheckIn from "@/components/DailyCheckIn";
import StreakWarning from "@/components/StreakWarning";
import SeoHead from "@/components/SeoHead";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Sparkles, AlertCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUserErrors } from "@/hooks/useUserErrors";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pendingCount: errorCount } = useUserErrors();


  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: progress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Streak freeze auto-check
  useEffect(() => {
    if (!user || !progress) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const lastActivity = progress.last_activity_date;
    const freezeCount = (progress as any).streak_freeze_count ?? 0;
    if (lastActivity && lastActivity < yesterday && progress.streak > 0 && freezeCount > 0) {
      (supabase as any).rpc("up_use_streak_freeze").then(() => {});
    }
  }, [user, progress]);

  const nickname =
    (profile as any)?.nickname || profile?.display_name?.split(" ")[0] || "Learner";

  return (
    <AppShell>
      <SeoHead
        title="SATANGO — Digital SAT Mastery Dashboard"
        description="Track your Digital SAT prep progress: adaptive practice modules, boss levels, AI tutoring, and diagnostic mock exams."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: "SATANGO Digital SAT Mastery",
          description: "Structured 9-module Digital SAT preparation with adaptive practice, boss levels, AI Socratic tutoring, and full-length diagnostic mock exams.",
          provider: {
            "@type": "Organization",
            name: "SATANGO",
            sameAs: "https://score-scape-journey.lovable.app/",
          },
        }}
      />
      <div className="space-y-5 animate-spring-in">
        {/* Personalized greeting */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {greeting()}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight truncate max-w-[280px]" style={{ lineHeight: "1.1" }}>
            {nickname} 👋
          </h1>
        </div>

        <XPBar />
        <DailyCheckIn />
        <StreakWarning />

        {/* Exam hall CTA */}
        <button
          onClick={() => navigate("/exam-center")}
          className="w-full p-5 rounded-3xl text-left tap-feedback active:scale-[0.97] transition-transform mock-exam-glow relative overflow-hidden bg-gradient-to-br from-[hsl(var(--gem))] to-[hsl(300,75%,50%)] text-primary-foreground"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-lg">Exam Hall</h3>
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-sm opacity-80">Full SAT & sectional mock tests</p>
            </div>
          </div>
        </button>

        {/* Error Log card — "Карцер" */}
        {errorCount > 0 && (
          <button
            onClick={() => navigate("/errors")}
            className="w-full p-4 rounded-3xl bg-card border border-border/60 tap-feedback active:scale-[0.98] transition-all flex items-center gap-3 text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-[15px]">Review My Mistakes</p>
              <p className="text-xs text-muted-foreground font-semibold">
                ({errorCount}) error{errorCount === 1 ? "" : "s"} pending · No hearts lost
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        )}


        <div className="pt-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-4">
            Your Learning Path
          </h2>
          <MobileRoadmap />
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
