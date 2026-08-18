import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Brain, Calendar, TrendingUp, Award, Share2, Check, Timer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TopicScore {
  correct: number;
  total: number;
  percentage: number;
}

interface PacingEntry { totalTime: number; count: number; avg: number; }
interface WeakSpot { topic: string; accuracy: number; missed: number; }

interface ReportData {
  estimatedScore: number;
  correctCount: number;
  totalCount: number;
  weakAreas: string[];
  studyPlan: string[];
  topicBreakdown: Record<string, TopicScore>;
  sectionScores?: { rw: number; math: number };
  pacing?: Record<string, PacingEntry>;
  weakSpots?: WeakSpot[];
}

interface MockExamReportProps {
  report: ReportData;
  examType?: string;
  onBack: () => void;
}

const PACING_THRESHOLDS: Record<string, number> = { math: 95, reading_writing: 71 };
const CAT_LABEL: Record<string, string> = { math: "Math", reading_writing: "Reading & Writing" };

const MockExamReport = ({ report, examType = "full", onBack }: MockExamReportProps) => {
  const [copied, setCopied] = useState(false);
  const isFull = examType === "full";
  const scoreMax = isFull ? 1600 : 800;
  const scoreMin = isFull ? 400 : 200;
  const scoreLabel = isFull ? "400–1600" : "200–800";

  const scoreColor =
    report.estimatedScore >= (scoreMax * 0.75) ? "text-primary" :
    report.estimatedScore >= (scoreMax * 0.5) ? "text-accent" :
    "text-destructive";

  const topicEntries = Object.entries(report.topicBreakdown || {});

  const handleShare = async () => {
    const accuracy = Math.round((report.correctCount / report.totalCount) * 100);
    const text = `🎯 My SAT ${isFull ? "Full" : examType === "rw" ? "R&W" : "Math"} Score: ${report.estimatedScore}/${scoreMax}\n📊 Accuracy: ${accuracy}%\n${report.sectionScores ? `📖 R&W: ${report.sectionScores.rw} | 🧮 Math: ${report.sectionScores.math}\n` : ""}🏆 Preparing with ScoreScape!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "My SAT Score", text });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Score copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,8%)] text-[hsl(0,0%,95%)]">
      <div className="container max-w-lg mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-[hsl(0,0%,60%)] hover:text-[hsl(0,0%,90%)] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back</span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-[hsl(0,0%,70%)] hover:text-[hsl(0,0%,95%)]"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied!" : "Share"}
          </Button>
        </div>

        {/* Premium Score Hero */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-5 h-5 text-[hsl(45,90%,55%)]" />
            <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(45,90%,55%)]">
              Premium Score Report
            </h1>
            <Award className="w-5 h-5 text-[hsl(45,90%,55%)]" />
          </div>
          <p className="text-[10px] font-semibold text-[hsl(0,0%,40%)] uppercase tracking-widest">
            {isFull ? "SAT Score Report" : examType === "rw" ? "R&W Section Report" : "Math Section Report"}
          </p>
          <div className="relative">
            <p className={`text-7xl font-black ${scoreColor}`}>
              {report.estimatedScore}
            </p>
            <p className="text-sm text-[hsl(0,0%,50%)] font-semibold mt-1">
              Estimated Score ({scoreLabel})
            </p>
          </div>
        </div>

        {/* Section scores for full exam */}
        {isFull && report.sectionScores && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[hsl(220,15%,13%)] rounded-2xl p-4 border border-[hsl(220,15%,20%)] text-center">
              <p className="text-xs font-bold text-[hsl(0,0%,50%)] uppercase tracking-wider mb-1">Reading & Writing</p>
              <p className="text-3xl font-black text-[hsl(var(--secondary))]">{report.sectionScores.rw}</p>
              <p className="text-xs text-[hsl(0,0%,45%)]">out of 800</p>
            </div>
            <div className="bg-[hsl(220,15%,13%)] rounded-2xl p-4 border border-[hsl(220,15%,20%)] text-center">
              <p className="text-xs font-bold text-[hsl(0,0%,50%)] uppercase tracking-wider mb-1">Math</p>
              <p className="text-3xl font-black text-[hsl(var(--primary))]">{report.sectionScores.math}</p>
              <p className="text-xs text-[hsl(0,0%,45%)]">out of 800</p>
            </div>
          </div>
        )}

        {/* Accuracy */}
        <div className="bg-[hsl(220,15%,13%)] rounded-2xl p-5 border border-[hsl(220,15%,20%)]">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-gem" />
            <h2 className="font-extrabold">Accuracy</h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">
              {report.correctCount}/{report.totalCount}
            </span>
            <span className="text-[hsl(0,0%,50%)] font-semibold">
              ({Math.round((report.correctCount / report.totalCount) * 100)}%)
            </span>
          </div>
        </div>

        {/* Pacing — Average time per question (premium diagnostic) */}
        {report.pacing && Object.keys(report.pacing).length > 0 && (
          <div className="bg-[hsl(220,15%,13%)] rounded-2xl p-5 border border-[hsl(220,15%,20%)]">
            <div className="flex items-center gap-3 mb-4">
              <Timer className="w-5 h-5 text-[hsl(45,90%,55%)]" />
              <h2 className="font-extrabold">Time Tracking Intel</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(report.pacing).map(([cat, p]) => {
                const limit = PACING_THRESHOLDS[cat] ?? 90;
                const rushing = p.avg > 0 && p.avg < limit * 0.4;
                const slow = p.avg > limit;
                const tip = rushing ? "You are rushing!" : slow ? "Slow down — review accuracy." : "Optimal pacing!";
                const color = rushing || slow ? "text-[hsl(45,90%,55%)]" : "text-primary";
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{CAT_LABEL[cat] ?? cat}</span>
                    <span className={`text-sm font-bold ${color}`}>{p.avg}s / question · {tip}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weak Spots — top 2 modules where the user lost the most points */}
        {report.weakSpots && report.weakSpots.length > 0 && (
          <div className="bg-[hsl(220,15%,13%)] rounded-2xl p-5 border border-[hsl(220,15%,20%)]">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-destructive" />
              <h2 className="font-extrabold">Weak Spots This Session</h2>
            </div>
            <div className="space-y-2">
              {report.weakSpots.map((w) => (
                <div key={w.topic} className="flex items-center justify-between text-sm">
                  <span className="font-semibold truncate mr-2">{w.topic}</span>
                  <span className="font-bold text-destructive shrink-0">
                    {w.accuracy}% · −{w.missed} pts
                  </span>
                </div>
              ))}
            </div>
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full h-10 mt-4 font-bold text-sm border-[hsl(220,15%,25%)] bg-[hsl(220,15%,13%)] hover:bg-[hsl(220,15%,18%)] text-[hsl(0,0%,90%)]"
            >
              Review These Topics
            </Button>
          </div>
        )}


        {/* Topic Breakdown */}
        {topicEntries.length > 0 && (
          <div className="bg-[hsl(220,15%,13%)] rounded-2xl p-5 border border-[hsl(220,15%,20%)]">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-extrabold">Diagnostic Breakdown</h2>
            </div>
            <div className="space-y-3">
              {topicEntries.map(([topic, data]) => (
                <div key={topic}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold truncate mr-2">{topic}</span>
                    <span className={`font-bold shrink-0 ${data.percentage >= 80 ? "text-primary" : data.percentage >= 60 ? "text-[hsl(45,90%,55%)]" : "text-destructive"}`}>
                      {data.correct}/{data.total} ({data.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-[hsl(220,15%,20%)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${data.percentage >= 80 ? "bg-gradient-to-r from-primary to-[hsl(158,64%,52%)]" : data.percentage >= 60 ? "bg-gradient-to-r from-[hsl(45,90%,45%)] to-[hsl(45,90%,55%)]" : "bg-gradient-to-r from-destructive to-[hsl(0,70%,55%)]"}`}
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak Areas */}
        <div className="bg-[hsl(220,15%,13%)] rounded-2xl p-5 border border-[hsl(220,15%,20%)]">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-destructive" />
            <h2 className="font-extrabold">Areas to Improve</h2>
          </div>
          <ul className="space-y-2">
            {report.weakAreas?.map((area: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-destructive mt-0.5">•</span>
                <span className="text-[hsl(0,0%,70%)]">{area}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Study Plan */}
        <div className="bg-[hsl(220,15%,13%)] rounded-2xl p-5 border border-[hsl(220,15%,20%)]">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-accent" />
            <h2 className="font-extrabold">7-Day Study Plan</h2>
          </div>
          <ol className="space-y-2">
            {report.studyPlan?.map((step: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-[hsl(220,15%,20%)] flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-[hsl(0,0%,70%)]">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Share CTA */}
        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full h-12 font-bold text-base gap-2 border-[hsl(220,15%,25%)] bg-[hsl(220,15%,13%)] hover:bg-[hsl(220,15%,18%)] text-[hsl(0,0%,90%)]"
        >
          <Share2 className="w-5 h-5" />
          Share My Score
        </Button>

        <Button onClick={onBack} className="w-full h-12 font-bold text-base">
          Back to Exam Center
        </Button>
      </div>
    </div>
  );
};

export default MockExamReport;
