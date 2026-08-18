import { useParams, useNavigate } from "react-router-dom";
import { SAT_MODULES } from "@/lib/modules";
import { getUnitLevels, UnitLevel } from "@/lib/unitLevels";
import { Lock, CheckCircle2, Play, ArrowLeft, BookOpen, Swords, Trophy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useQuizProgress } from "@/hooks/useQuizProgress";

const UnitDetail = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const unitNum = parseInt(unitId || "1");
  const mod = SAT_MODULES.find((m) => m.id === unitNum);
  const levels = getUnitLevels(unitNum);

  const { levelProgress, getLevelStatus, getUnitCompletion } = useQuizProgress(unitNum);
  const { completed: completedCount, total: totalLevels, percent: progressPercent } =
    getUnitCompletion(unitNum);

  const getLevelIcon = (level: UnitLevel, status: string) => {
    if (status === "locked") return <Lock className="w-5 h-5 text-muted-foreground" />;
    if (status === "completed") return <CheckCircle2 className="w-5 h-5" style={{ color: `hsl(${mod?.colorAccent || "158 64% 42%"})` }} />;
    if (level.type === "theory") return <BookOpen className="w-5 h-5" style={{ color: `hsl(${mod?.colorAccent || "158 64% 42%"})` }} />;
    if (level.type === "boss") return <Swords className="w-5 h-5" style={{ color: `hsl(${mod?.colorAccent || "158 64% 42%"})` }} />;
    return <Play className="w-5 h-5" style={{ color: `hsl(${mod?.colorAccent || "158 64% 42%"})` }} />;
  };

  const handleLevelClick = (level: UnitLevel, status: string) => {
    if (status === "locked") return;

    const basePath = `/quiz/unit-${unitNum}-level-${level.id}`;
    const baseParams = `module=${unitNum}&level=${level.id}&type=${level.type}`;

    if (status === "completed") {
      // Review mode for completed levels
      if (level.type === "theory") {
        navigate(`${basePath}?${baseParams}&topic=${level.theoryTopic || ""}&review=true`);
      } else {
        navigate(`${basePath}?${baseParams}&review=true`);
      }
    } else {
      if (level.type === "theory") {
        navigate(`${basePath}?${baseParams}&topic=${level.theoryTopic || ""}`);
      } else {
        navigate(`${basePath}?${baseParams}`);
      }
    }
  };

  if (!mod) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Unit not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold flex items-center gap-2">
              <span className="text-2xl">{mod.icon}</span> {mod.name}
            </h1>
            <p className="text-sm text-muted-foreground">{mod.subtitle}</p>
          </div>
        </div>

        {/* Unit Progress Circle */}
        <div className="bg-card rounded-2xl p-5 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={`hsl(${mod.colorAccent})`}
                strokeWidth="3"
                strokeDasharray={`${progressPercent}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black">{progressPercent}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Unit Progress</p>
            <p className="text-xs text-muted-foreground">{completedCount}/{totalLevels} levels completed</p>
            <Progress value={progressPercent} className="h-2 mt-2" />
          </div>
          {progressPercent === 100 && (
            <Trophy className="w-8 h-8 text-accent shrink-0 animate-bounce" />
          )}
        </div>

        {/* Level Path */}
        <div className="relative flex flex-col items-center gap-0">
          {levels.map((level, index) => {
            const status = getLevelStatus(level);
            const isEven = index % 2 === 0;
            const lp = levelProgress?.find((p: any) => p.level_id === level.id);

            return (
              <div key={level.id} className="relative w-full max-w-sm">
                {index > 0 && (
                  <div className="flex justify-center -mt-1 mb-1">
                    <div
                      className="w-0.5 h-6"
                      style={{
                        backgroundColor: status !== "locked"
                          ? `hsl(${mod.colorAccent} / 0.4)`
                          : "hsl(var(--border))",
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={() => handleLevelClick(level, status)}
                  disabled={status === "locked"}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.97]",
                    "border-2",
                    status === "completed" && "bg-card",
                    status === "available" && "bg-card shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)] cursor-pointer",
                    status === "locked" && "bg-muted/40 opacity-55 cursor-not-allowed border-transparent",
                    isEven ? "flex-row" : "flex-row-reverse text-right"
                  )}
                  style={{
                    borderColor: status !== "locked" ? `hsl(${mod.colorAccent} / ${status === "available" ? 0.6 : 0.25})` : undefined,
                  }}
                >
                  <div
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
                      status === "available" && "animate-pulse"
                    )}
                    style={{
                      backgroundColor: status !== "locked"
                        ? `hsl(${mod.colorAccent} / 0.12)`
                        : "hsl(var(--muted))",
                    }}
                  >
                    {getLevelIcon(level, status)}
                  </div>

                  <div className={cn("flex-1 min-w-0", !isEven && "text-right")}>
                    <p className="font-bold text-sm truncate">{level.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{level.description}</p>
                    {status === "completed" && lp && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-[10px] font-bold" style={{ color: `hsl(${mod.colorAccent})` }}>
                          {lp.score_correct}/{lp.score_total} correct • +{lp.xp_earned} XP
                        </p>
                        <RotateCcw className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                      level.type === "theory" && "bg-secondary/10 text-secondary-foreground",
                      level.type === "practice" && "bg-primary/10 text-primary",
                      level.type === "boss" && "bg-destructive/10 text-destructive"
                    )}
                  >
                    {status === "completed" ? "Review" : level.type === "theory" ? "Theory" : level.type === "boss" ? "Boss" : "Practice"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UnitDetail;
