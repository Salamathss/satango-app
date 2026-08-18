import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { SAT_TOPICS } from "@/lib/topics";
import { ArrowLeft, TrendingUp, Target, AlertTriangle, CheckCircle2, BarChart3, Download, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TopicStat {
  topic: string;
  topicName: string;
  icon: string;
  category: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface DayTrend {
  date: string;
  total: number;
  correct: number;
  accuracy: number;
}

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: answers, isLoading } = useQuery({
    queryKey: ["analytics-answers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_answers")
        .select("*, questions!inner(topic, category, question_text)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      return (data as any[]) || [];
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

  // Compute topic stats
  const topicStats: TopicStat[] = (() => {
    if (!answers || answers.length === 0) return [];
    const map: Record<string, { total: number; correct: number; category: string }> = {};
    for (const a of answers) {
      const topic = a.questions?.topic;
      const category = a.questions?.category || "math";
      if (!topic) continue;
      if (!map[topic]) map[topic] = { total: 0, correct: 0, category };
      map[topic].total++;
      if (a.is_correct) map[topic].correct++;
    }
    return Object.entries(map)
      .map(([topic, s]) => {
        const t = SAT_TOPICS.find((t) => t.id === topic);
        return {
          topic,
          topicName: t?.name || topic,
          icon: t?.icon || "📝",
          category: s.category,
          total: s.total,
          correct: s.correct,
          accuracy: Math.round((s.correct / s.total) * 100),
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy);
  })();

  // Compute daily trends (last 14 days)
  const dayTrends: DayTrend[] = (() => {
    if (!answers || answers.length === 0) return [];
    const map: Record<string, { total: number; correct: number }> = {};
    for (const a of answers) {
      const day = a.created_at.split("T")[0];
      if (!map[day]) map[day] = { total: 0, correct: 0 };
      map[day].total++;
      if (a.is_correct) map[day].correct++;
    }
    return Object.entries(map)
      .map(([date, s]) => ({
        date,
        total: s.total,
        correct: s.correct,
        accuracy: Math.round((s.correct / s.total) * 100),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  })();

  // Overall stats
  const totalAnswered = answers?.length || 0;
  const totalCorrect = answers?.filter((a: any) => a.is_correct).length || 0;
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Weak areas (bottom 3 by accuracy, min 3 answers)
  const weakAreas = topicStats.filter((t) => t.total >= 3).slice(0, 3);

  // Strong areas (top 3)
  const strongAreas = [...topicStats].filter((t) => t.total >= 3).sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);

  // Predicted SAT Score (200-800 per section)
  const computePredictedScore = (category: string): number => {
    const categoryAnswers = answers?.filter((a: any) => a.questions?.category === category) || [];
    if (categoryAnswers.length < 5) return 0; // not enough data
    // Take last 100 answers for prediction
    const recent = categoryAnswers.slice(-100);
    const correct = recent.filter((a: any) => a.is_correct).length;
    const accuracy = correct / recent.length;
    // Map accuracy (0.0 - 1.0) → SAT scale (200 - 800)
    return Math.round(200 + accuracy * 600);
  };

  const predictedMath = computePredictedScore("math");
  const predictedRW = computePredictedScore("reading_writing");
  const predictedTotal = predictedMath > 0 && predictedRW > 0 ? predictedMath + predictedRW : 0;

  // Category breakdown: Math vs RW subtotals
  const mathStats = topicStats.filter((t) => t.category === "math");
  const rwStats = topicStats.filter((t) => t.category === "reading_writing");

  const handlePrint = () => {
    toast.info("Opening print dialog...");
    window.print();
  };

  const handleShare = async () => {
    const text = `My SATANGO Progress Report:\n📊 Overall Accuracy: ${overallAccuracy}%\n📝 Questions Answered: ${totalAnswered}\n${predictedTotal > 0 ? `🎯 Predicted SAT Score: ${predictedTotal} (Math ${predictedMath} + RW ${predictedRW})` : ""}\n\nPractice at https://satango-app.vercel.app`;

    if (navigator.share) {
      try {
        await navigator.share({ text, title: "SATANGO Score Report" });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Report copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Analytics">
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground font-semibold">Loading analytics...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Analytics">
      <main className="space-y-6 print:space-y-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors print:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ lineHeight: "1.15" }}>
              📊 Progress Analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your performance breakdown across all topics
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={handlePrint} title="Export PDF">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={handleShare} title="Share Report">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {totalAnswered === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
            <span className="text-4xl block mb-3">📝</span>
            <p className="font-bold text-lg">No data yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Complete some quizzes to see your analytics!
            </p>
          </div>
        ) : (
          <>
            {/* Predicted SAT Score */}
            {predictedTotal > 0 && (
              <div className="bg-card rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] border border-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-extrabold">Predicted SAT Score</h2>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-primary/5 rounded-xl p-3">
                    <p className="text-3xl font-black text-primary">{predictedMath}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Math</p>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-3">
                    <p className="text-3xl font-black text-primary">{predictedRW}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">R&W</p>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                    <p className="text-3xl font-black text-primary">{predictedTotal}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  Based on your recent answer accuracy. Keep practicing to improve!
                </p>
              </div>
            )}

            {/* Overview cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded-2xl p-3 text-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
                <p className="text-2xl font-black text-primary">{overallAccuracy}%</p>
                <p className="text-xs text-muted-foreground font-semibold">Accuracy</p>
              </div>
              <div className="bg-card rounded-2xl p-3 text-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
                <p className="text-2xl font-black text-foreground">{totalAnswered}</p>
                <p className="text-xs text-muted-foreground font-semibold">Answered</p>
              </div>
              <div className="bg-card rounded-2xl p-3 text-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
                <p className="text-2xl font-black text-primary">{totalCorrect}</p>
                <p className="text-xs text-muted-foreground font-semibold">Correct</p>
              </div>
            </div>

            {/* Category Breakdown: Math */}
            {mathStats.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧮</span>
                  <h2 className="text-lg font-extrabold">Math Categories</h2>
                </div>
                {mathStats.map((t) => (
                  <div key={t.topic} className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.icon}</span>
                        <span className="font-bold text-sm">{t.topicName}</span>
                      </div>
                      <span className={`text-sm font-black ${t.accuracy >= 70 ? "text-primary" : t.accuracy >= 40 ? "text-streak" : "text-destructive"}`}>
                        {t.accuracy}%
                      </span>
                    </div>
                    <Progress value={t.accuracy} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.correct}/{t.total} correct
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Category Breakdown: Reading & Writing */}
            {rwStats.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📖</span>
                  <h2 className="text-lg font-extrabold">Reading & Writing Categories</h2>
                </div>
                {rwStats.map((t) => (
                  <div key={t.topic} className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.icon}</span>
                        <span className="font-bold text-sm">{t.topicName}</span>
                      </div>
                      <span className={`text-sm font-black ${t.accuracy >= 70 ? "text-primary" : t.accuracy >= 40 ? "text-streak" : "text-destructive"}`}>
                        {t.accuracy}%
                      </span>
                    </div>
                    <Progress value={t.accuracy} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.correct}/{t.total} correct
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Weak areas */}
            {weakAreas.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="text-lg font-extrabold">Weak Areas</h2>
                </div>
                {weakAreas.map((t) => (
                  <div
                    key={t.topic}
                    className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] border-l-4 border-destructive"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{t.icon}</span>
                        <span className="font-bold text-sm">{t.topicName}</span>
                      </div>
                      <span className="text-sm font-black text-destructive">{t.accuracy}%</span>
                    </div>
                    <Progress value={t.accuracy} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.correct}/{t.total} correct
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Strong areas */}
            {strongAreas.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-extrabold">Strongest Topics</h2>
                </div>
                {strongAreas.map((t) => (
                  <div
                    key={t.topic}
                    className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] border-l-4 border-primary"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{t.icon}</span>
                        <span className="font-bold text-sm">{t.topicName}</span>
                      </div>
                      <span className="text-sm font-black text-primary">{t.accuracy}%</span>
                    </div>
                    <Progress value={t.accuracy} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.correct}/{t.total} correct
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Daily trend */}
            {dayTrends.length > 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-foreground" />
                  <h2 className="text-lg font-extrabold">Daily Trend</h2>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
                  <div className="flex items-end gap-1 h-32">
                    {dayTrends.map((d) => (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-foreground">{d.accuracy}%</span>
                        <div className="w-full bg-muted rounded-t-sm relative" style={{ height: "100%" }}>
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm transition-all"
                            style={{ height: `${d.accuracy}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-muted-foreground">
                          {d.date.slice(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Questions answered per day with accuracy %
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
};

export default Analytics;
