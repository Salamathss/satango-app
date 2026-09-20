import AppShell from "@/components/AppShell";
import MobileRoadmap from "@/components/MobileRoadmap";
import DailyWisdom from "@/components/DailyWisdom";
import StreakWarning from "@/components/StreakWarning";
import { PersonalPlanCard } from "@/components/PersonalPlanCard";
import DailyRitualDeck from "@/components/DailyRitualDeck";
import CommandHub from "@/components/CommandHub";
import SeoHead from "@/components/SeoHead";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame } from "lucide-react";
import { useEffect } from "react";
import { useUserErrors } from "@/hooks/useUserErrors";

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { pendingCount: errorCount } = useUserErrors();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: progress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();
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
    (profile as any)?.nickname ||
    profile?.display_name?.split(" ")[0] ||
    t("learner");

  const today = new Date().toISOString().split("T")[0];
  const quizDoneToday = progress?.last_activity_date === today;
  const chestClaimedToday = progress?.last_check_in_date === today;
  const errorsReviewDone = errorCount === 0;

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
          description:
            "Structured 9-module Digital SAT preparation with adaptive practice, boss levels, AI Socratic tutoring, and full-length diagnostic mock exams.",
          provider: {
            "@type": "Organization",
            name: "SATANGO",
            sameAs: "https://score-scape-journey.lovable.app/",
          },
        }}
      />

      <div className="relative space-y-6 animate-spring-in">
        {/* Full-screen Philosopher Background with subtle contrast overlay */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <img
            src="/philosopher.jpg"
            alt="Philosopher background wallpaper"
            className="w-full h-full object-cover object-[75%_top] sm:object-right-top filter brightness-[0.85] contrast-[1.05] opacity-20 dark:opacity-30 transition-opacity duration-500 scale-105"
          />
          {/* Gradients to keep content razor sharp */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        </div>

        {/* Dashboard content */}
        <div className="relative z-10 space-y-6">
          {/* Top Header Deck */}
          <div className="flex items-center justify-between pt-1 border-b border-border/60 pb-4">
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400 font-bold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                SYSTEM / SCHOLAR / ACTIVE
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
                {nickname} 👋
              </h1>
            </div>

            {progress && progress.streak > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground font-mono-tech text-xs font-bold shadow-xs">
                <Flame className="w-4 h-4 fill-zinc-500 text-zinc-600 dark:text-zinc-300" />
                <span>{progress.streak}D STREAK</span>
              </div>
            )}
          </div>

          {/* Streak Warning if streak at risk */}
          <StreakWarning />

          {/* Philosophy & Mindset Quote */}
          <DailyWisdom targetScore={(profile as any)?.target_score ?? 1500} />

          {/* Personal Study Plan & Diagnostic Hero Deck */}
          <PersonalPlanCard />

          {/* Daily Ritual Deck: XP Progress + Interactive Daily Chest & Quests */}
          <DailyRitualDeck
            quizDoneToday={quizDoneToday}
            chestClaimedToday={chestClaimedToday}
            errorsReviewDone={errorsReviewDone}
          />

          {/* Command Hub: Exam Simulation, Error Recovery, and Fast Utilities */}
          <CommandHub errorCount={errorCount} />

          {/* Learning Path (Interactive Map) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 font-bold">
                  // CURRICULUM ROADMAP
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground mt-0.5">
                  {t("learningPath")}
                </h2>
              </div>
              <span className="font-mono-tech text-xs text-muted-foreground font-bold bg-muted/60 dark:bg-zinc-900 px-3 py-1 rounded-xl border border-border/60 dark:border-zinc-800">
                9 MODULES
              </span>
            </div>
            <MobileRoadmap />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
