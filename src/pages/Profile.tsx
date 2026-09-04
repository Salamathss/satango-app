import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Trophy, BarChart3, Flame, Gem, Zap, Heart, ChevronRight, Sparkles, AlertCircle, MessageCircle, Swords, Target } from "lucide-react";
import DailyCheckIn from "@/components/DailyCheckIn";
import { useNavigate } from "react-router-dom";
import { useHearts } from "@/hooks/useHearts";
import { useUserErrors } from "@/hooks/useUserErrors";
import { usePremium } from "@/hooks/usePremium";
import { SAT_TOPICS } from "@/lib/topics";
import { Progress } from "@/components/ui/progress";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { hearts, maxHearts } = useHearts();
  const { pendingCount: errorCount } = useUserErrors();
  const { isPremium } = usePremium();

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

  // Weakness Practice: fetch user_answers to compute topic accuracy
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
          const t = SAT_TOPICS.find((t) => t.id === topic);
          return {
            topic,
            topicName: t?.name || topic,
            icon: t?.icon || "📝",
            accuracy: Math.round((s.correct / s.total) * 100),
            total: s.total,
          };
        })
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3);
    },
    enabled: !!user,
  });

  const nickname = (profile as any)?.nickname || profile?.display_name?.split(" ")[0] || "Learner";
  const initial = nickname.charAt(0).toUpperCase();

  const streakValue = (progress as any)?.streak ?? (profile as any)?.streak_days ?? 0;

  const stats = [
    { icon: Heart, label: "Hearts", value: `${hearts}/${maxHearts}`, color: "text-destructive" },
    { icon: Flame, label: "Streak", value: streakValue, color: "text-streak" },
    { icon: Gem, label: "Gems", value: progress?.gems ?? 0, color: "text-gem" },
    { icon: Zap, label: "XP", value: progress?.xp ?? 0, color: "text-xp" },
  ];

  return (
    <AppShell title="Profile">
      <div className="space-y-5 animate-spring-in">
        {/* Hero */}
        <div className="text-center pt-2">
          <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-black text-primary-foreground shadow-lg">
            {initial}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <h1 className="text-2xl font-extrabold tracking-tight">{nickname}</h1>
            {isPremium && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-gradient-to-br from-[#D9CFC0] to-[#B8AC97] text-[#1F1B16] shadow-sm">
                <Sparkles className="w-2.5 h-2.5" />
                Plus
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Level {progress?.level ?? 1} · {progress?.xp ?? 0} XP</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card rounded-3xl p-3 text-center border border-border/50">
                <Icon className={`w-5 h-5 mx-auto ${s.color}`} />
                <p className="text-base font-black mt-1">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{s.label}</p>
              </div>
            );
          })}
        </div>

        <DailyCheckIn />

        {/* Weakness Practice Block */}
        {weakTopics && weakTopics.length > 0 && (
          <div className="bg-card rounded-3xl p-4 border border-border/50 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-destructive" />
              <h3 className="font-extrabold text-sm">Weak Areas</h3>
            </div>
            {weakTopics.map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <span className="text-lg shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-bold truncate">{t.topicName}</span>
                    <span className="text-[10px] font-black text-destructive">{t.accuracy}%</span>
                  </div>
                  <Progress value={t.accuracy} className="h-1.5" />
                </div>
              </div>
            ))}
            <Button
              onClick={() => {
                const topicIds = weakTopics.map((t) => t.topic);
                const firstTopic = topicIds[0] || "linear-equations";
                const topicMeta = SAT_TOPICS.find((t) => t.id === firstTopic);
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
              <p className="font-bold text-sm">Review My Mistakes</p>
              <p className="text-xs text-muted-foreground">
                ({errorCount}) error{errorCount === 1 ? "" : "s"} pending
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
              <p className="font-bold text-sm">Analytics</p>
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
              <p className="font-bold text-sm">Exam Hall</p>
              <p className="text-xs text-muted-foreground">Full & section mocks</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <a
            href="https://t.me/Jukizavr"
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
          Sign Out
        </Button>
      </div>
    </AppShell>
  );
};

export default Profile;
