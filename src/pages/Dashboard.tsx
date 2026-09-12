import AppShell from "@/components/AppShell";
import MobileRoadmap from "@/components/MobileRoadmap";
import XPBar from "@/components/XPBar";
import DailyCheckIn from "@/components/DailyCheckIn";
import DailyQuests from "@/components/DailyQuests";
import DailyWisdom from "@/components/DailyWisdom";
import QuickHub from "@/components/QuickHub";
import StreakWarning from "@/components/StreakWarning";
import SeoHead from "@/components/SeoHead";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Sparkles, AlertCircle, ChevronRight, Flame, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUserErrors } from "@/hooks/useUserErrors";

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pendingCount: errorCount } = useUserErrors();

  const greetingText = () => {
    const h = new Date().getHours();
    if (h < 5) return t("goodNight");
    if (h < 12) return t("goodMorning");
    if (h < 18) return t("goodAfternoon");
    return t("goodEvening");
  };

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
        <div className="relative z-10 space-y-5">
          {/* Personalized Greeting Header */}
          <div className="flex items-center justify-between pt-1 border-b border-border/60 pb-4">
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] uppercase text-amber-500 font-bold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                SYSTEM / SCHOLAR / ACTIVE
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
                {nickname} 👋
              </h1>
            </div>

            {progress && progress.streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono-tech text-xs font-black shadow-sm">
                <Flame className="w-4 h-4 fill-amber-500/40" />
                <span>{progress.streak}D STREAK</span>
              </div>
            )}
          </div>

          {/* Daily Philosophy & Mindset Quote */}
          <DailyWisdom targetScore={(profile as any)?.target_score ?? 1500} />

          {/* Level XP Progress Bar */}
          <XPBar />

          {/* Daily Diamond Collector */}
          <DailyCheckIn />

          {/* Daily SAT Objectives & Quests */}
          <DailyQuests
            quizDoneToday={quizDoneToday}
            chestClaimedToday={chestClaimedToday}
            errorsReviewDone={errorsReviewDone}
          />

          {/* Quick Launch Hub (1v1 Battle, Vocab, Calculator) */}
          <QuickHub />

          {/* Streak Warning if streak at risk */}
          <StreakWarning />

          {/* Exam hall CTA — Obsidian & Gold Kintsugi Glow */}
          <button
            onClick={() => navigate("/exam-center")}
            className="w-full p-6 rounded-3xl text-left tap-feedback active:scale-[0.98] transition-all relative overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-800 to-amber-950 dark:from-neutral-900 dark:via-[#1c1a18] dark:to-amber-950/80 border border-amber-500/30 text-white shadow-xl group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-shimmer pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono-tech text-[10px] uppercase tracking-widest text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/25">
                    DIAGNOSTIC
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h3 className="font-black text-lg sm:text-xl text-white mt-1">
                  {t("examHall")}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 opacity-90 mt-0.5">
                  {t("examHallDesc")}
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </button>

          {/* Error Log card — "Карцер" */}
          {errorCount > 0 && (
            <button
              onClick={() => navigate("/errors")}
              className="w-full p-5 rounded-3xl bg-card/90 dark:bg-[#171615]/90 backdrop-blur-xl border border-red-500/25 tap-feedback active:scale-[0.98] transition-all flex items-center gap-3 text-left shadow-sm group"
            >
              <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0 border border-destructive/25 group-hover:scale-105 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-tech text-[10px] uppercase text-red-500 font-bold">
                    RECOVERY ZONE
                  </span>
                </div>
                <p className="font-black text-base text-foreground mt-0.5">
                  {t("reviewMistakes")}
                </p>
                <p className="text-xs text-muted-foreground font-semibold">
                  ({errorCount}) {t("errorsPending")}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-all shrink-0" />
            </button>
          )}

          {/* Learning Path (Interactive Map) */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold">
                  // CURRICULUM ROADMAP
                </span>
                <h2 className="text-lg font-black tracking-tight text-foreground mt-0.5">
                  {t("learningPath")}
                </h2>
              </div>
              <span className="font-mono-tech text-xs text-muted-foreground font-bold">
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
