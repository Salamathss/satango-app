import { useState } from "react";
import AppShell from "@/components/AppShell";
import DailyCheckIn from "@/components/DailyCheckIn";
import { StreakRepairDialog } from "@/components/StreakRepairDialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useHearts } from "@/hooks/useHearts";
import { useUserErrors } from "@/hooks/useUserErrors";
import { usePremium } from "@/hooks/usePremium";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SAT_TOPICS } from "@/lib/topics";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Flame,
  Gem,
  Zap,
  Sparkles,
  BarChart3,
  AlertCircle,
  Trophy,
  LogOut,
  ChevronRight,
  Target,
  Swords,
  MessageCircle,
  Sun,
  Moon,
  Languages,
  Snowflake,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { hearts, maxHearts } = useHearts();
  const { pendingCount: errorCount } = useUserErrors();
  const { isPremium } = usePremium();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [streakRepairOpen, setStreakRepairOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
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

  const { data: weakTopics } = useQuery({
    queryKey: ["weakness-practice", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_answers")
        .select("is_correct, questions!inner(topic)")
        .eq("user_id", user.id);

      if (!data || data.length === 0) return [];

      const map: Record<string, { total: number; correct: number }> = {};
      for (const a of data as any[]) {
        const topic = a.questions?.topic;
        if (!topic) continue;
        if (!map[topic]) map[topic] = { total: 0, correct: 0 };
        map[topic].total++;
        if (a.is_correct) map[topic].correct++;
      }

      return Object.entries(map)
        .filter(([, s]) => s.total >= 3)
        .map(([topic, s]) => {
          const tItem = SAT_TOPICS.find((tItem) => tItem.id === topic);
          return {
            topic,
            topicName: tItem?.name || topic,
            icon: tItem?.icon || "📝",
            accuracy: Math.round((s.correct / s.total) * 100),
            total: s.total,
          };
        })
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3);
    },
    enabled: !!user,
  });

  const nickname = (profile as any)?.nickname || profile?.display_name?.split(" ")[0] || t("learner");
  const initial = nickname.charAt(0).toUpperCase();

  const streakValue = Math.max((progress as any)?.streak ?? 0, (profile as any)?.streak_days ?? 0);

  const stats = [
    { icon: Heart, label: t("hearts"), value: `${hearts}/${maxHearts}`, color: "text-destructive" },
    { icon: Flame, label: t("streak"), value: streakValue, color: "text-streak" },
    { icon: Gem, label: t("gems"), value: progress?.gems ?? 0, color: "text-gem" },
    { icon: Zap, label: t("xp"), value: progress?.xp ?? 0, color: "text-xp" },
  ];

  return (
    <AppShell title={t("profile")}>
      <div className="space-y-6 animate-spring-in">
        {/* Hero */}
        <div className="text-center pt-2">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-3xl mx-auto bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-4xl font-black text-neutral-950 shadow-lg shadow-amber-500/25 ring-4 ring-card">
              {initial}
            </div>
            {isPremium && (
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 flex items-center justify-center shadow-md ring-2 ring-card">
                <Sparkles className="w-3.5 h-3.5 fill-neutral-950" />
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{nickname}</h1>
            {isPremium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-sm">
                <Sparkles className="w-2.5 h-2.5 fill-neutral-950" />
                PLUS
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            {t("level")} {progress?.level ?? 1} · {progress?.xp ?? 0} {t("xp")}
          </p>

          <div className="flex items-center justify-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-tech font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 shadow-2xs">
              <Snowflake className="w-3.5 h-3.5" />
              {((progress as any)?.streak_freeze_count ?? 0) > 0
                ? `${(progress as any)?.streak_freeze_count} Streak Freeze Equipped 🛡️`
                : "Streak Freeze: Inactive (0 in Vault)"}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: "hearts", icon: Heart, label: t("hearts"), value: `${hearts}/${maxHearts}`, bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
            { id: "streak", icon: Flame, label: t("streak"), value: streakValue, bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", clickable: true },
            { id: "gems", icon: Gem, label: t("gems"), value: progress?.gems ?? 0, bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
            { id: "xp", icon: Zap, label: t("xp"), value: progress?.xp ?? 0, bg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                onClick={s.clickable ? () => setStreakRepairOpen(true) : undefined}
                className={cn(
                  "bg-card hover:bg-card/90 rounded-2xl sm:rounded-3xl p-4 text-center border border-border/80 shadow-2xs hover:shadow-xs transition-all",
                  s.clickable && "cursor-pointer active:scale-95 group"
                )}
                title={s.clickable ? (language === "ru" ? "Нажмите для восстановления стрика" : "Click to repair streak") : undefined}
              >
                <div className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center border ${s.bg} mb-2 ${s.clickable ? "group-hover:scale-110 transition-transform" : ""}`}>
                  <Icon className="w-4 h-4" strokeWidth={2.4} />
                </div>
                <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums tracking-tight">{s.value}</p>
                <p className="text-[11px] text-muted-foreground font-bold mt-0.5 flex items-center justify-center gap-1">
                  <span>{s.label}</span>
                  {s.clickable && <span className="text-[10px] text-amber-500">🛠️</span>}
                </p>
              </div>
            );
          })}
        </div>

        {/* Streak Repair Action Box */}
        <div className="bg-gradient-to-r from-amber-500/[0.12] via-card to-card rounded-3xl p-4 sm:p-5 border border-amber-500/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-2xs">
              <Flame className="w-6 h-6 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                  {language === "ru" ? "Streak Repair (Восстановление)" : "Streak Repair"}
                </h3>
                <span className="font-mono-tech text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  150 💎
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {language === "ru"
                  ? "Спасите серию занятий или восстановите сгоревший стрик за гемы."
                  : "Protect or restore your daily study momentum for gems."}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setStreakRepairOpen(true)}
            className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono-tech text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all shrink-0 gap-1.5"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>{language === "ru" ? "Восстановить стрик" : "Repair Streak"}</span>
          </Button>
        </div>

        <DailyCheckIn />

        {/* Weakness Practice Block */}
        {weakTopics && weakTopics.length > 0 && (
          <div className="bg-card rounded-3xl p-4 border border-border/50 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-destructive" />
              <h3 className="font-extrabold text-sm">{t("weakAreas")}</h3>
            </div>
            {weakTopics.map((tItem) => (
              <div key={tItem.topic} className="flex items-center gap-3">
                <span className="text-lg shrink-0">{tItem.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-bold truncate">{tItem.topicName}</span>
                    <span className="text-[10px] font-black text-destructive">{tItem.accuracy}%</span>
                  </div>
                  <Progress value={tItem.accuracy} className="h-1.5" />
                </div>
              </div>
            ))}
            <Button
              onClick={() => {
                const topicIds = weakTopics.map((tItem) => tItem.topic);
                const firstTopic = topicIds[0] || "linear-equations";
                const topicMeta = SAT_TOPICS.find((tItem) => tItem.id === firstTopic);
                navigate(`/quiz/${firstTopic}?category=${topicMeta?.category || "math"}&review=true`);
              }}
              className="w-full h-11 rounded-2xl font-bold text-xs gap-1.5"
              variant="outline"
            >
              <Target className="w-4 h-4" />
              Train Weak Topics
            </Button>
          </div>
        )}

        {/* Appearance & Language Settings Card */}
        <div className="bg-card rounded-3xl p-4 border border-border/50 space-y-3">
          <h3 className="font-extrabold text-sm text-foreground">{t("settings")}</h3>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              {theme === "dark" ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
              <span className="text-xs font-bold">{t("theme")}</span>
            </div>
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="sm"
              className="h-8 rounded-xl font-bold text-xs gap-1.5"
            >
              {theme === "dark" ? t("darkMode") : t("lightMode")}
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <div className="flex items-center gap-2.5">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold">{t("language")}</span>
            </div>
            <Button
              onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
              variant="outline"
              size="sm"
              className="h-8 rounded-xl font-bold font-mono-tech text-xs gap-1.5"
            >
              {language === "ru" ? t("russian") : t("english")}
            </Button>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-card rounded-3xl divide-y divide-border/50 border border-border/50 overflow-hidden">
          <button
            onClick={() => navigate("/errors")}
            className="w-full flex items-center gap-3 p-4 tap-feedback active:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">{t("reviewMistakes")}</p>
              <p className="text-xs text-muted-foreground">
                ({errorCount}) {t("errorsPending")}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate("/analytics")}
            className="w-full flex items-center gap-3 p-4 tap-feedback active:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">{t("analytics")}</p>
              <p className="text-xs text-muted-foreground">Performance insights</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate("/leaderboard")}
            className="w-full flex items-center gap-3 p-4 tap-feedback active:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-accent/20 text-accent-foreground flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">Leaderboard</p>
              <p className="text-xs text-muted-foreground">See top learners</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate("/battle")}
            className="w-full flex items-center gap-3 p-4 tap-feedback active:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Swords className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">SAT Battle</p>
              <p className="text-xs text-muted-foreground">Challenge a friend to a duel</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate("/exam-center")}
            className="w-full flex items-center gap-3 p-4 tap-feedback active:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-gem/15 text-gem flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">{t("examHall")}</p>
              <p className="text-xs text-muted-foreground">{t("examHallDesc")}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <a
            href="https://t.me/sltrn0l"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 p-4 tap-feedback active:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center dark:bg-sky-950 dark:text-sky-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">Telegram Support</p>
              <p className="text-xs text-muted-foreground">Get help and ask questions</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </a>
        </div>

        <Button
          onClick={signOut}
          variant="outline"
          className="w-full h-12 rounded-2xl gap-2 font-bold"
        >
          <LogOut className="w-4 h-4" />
          {t("signOut")}
        </Button>
      </div>

      <StreakRepairDialog
        open={streakRepairOpen}
        onOpenChange={setStreakRepairOpen}
      />
    </AppShell>
  );
};

export default Profile;
