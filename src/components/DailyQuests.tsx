import { CheckCircle2, Circle, Trophy, Flame, Gem, BookOpen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface DailyQuestsProps {
  quizDoneToday: boolean;
  chestClaimedToday: boolean;
  errorsReviewDone: boolean;
}

const DailyQuests = ({
  quizDoneToday,
  chestClaimedToday,
  errorsReviewDone,
}: DailyQuestsProps) => {
  const { t } = useLanguage();

  const quests = [
    {
      id: "lesson",
      label: t("questCompleteLesson"),
      reward: "+20 XP",
      done: quizDoneToday,
      icon: BookOpen,
    },
    {
      id: "chest",
      label: t("questClaimChest"),
      reward: "+Gems",
      done: chestClaimedToday,
      icon: Gem,
    },
    {
      id: "ledger",
      label: t("questReviewMistakes"),
      reward: "+30 XP",
      done: errorsReviewDone,
      icon: Flame,
    },
  ];

  const completedCount = quests.filter((q) => q.done).length;
  const allCompleted = completedCount === quests.length;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card/90 dark:bg-[#171615]/90 backdrop-blur-xl border border-border/80 dark:border-white/[0.12] p-5 shadow-sm space-y-4 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono-tech text-[10px] uppercase tracking-widest text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              DAILY PROTOCOL
            </span>
            <h3 className="font-extrabold text-base text-foreground mt-0.5">
              {t("dailyQuests")}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono-tech text-xs font-bold">
          <span
            className={cn(
              "px-3 py-1 rounded-xl border text-xs font-mono-tech",
              allCompleted
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-muted/70 dark:bg-neutral-900 text-muted-foreground border-border/70 dark:border-white/10"
            )}
          >
            {completedCount} / {quests.length} DONE
          </span>
        </div>
      </div>

      {/* Quest items list */}
      <div className="space-y-2">
        {quests.map((q) => {
          return (
            <div
              key={q.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-2xl border transition-all duration-150",
                q.done
                  ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/25 text-foreground"
                  : "bg-muted/40 dark:bg-neutral-900/40 border-border/70 dark:border-white/5 text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {q.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-xs font-bold truncate",
                    q.done ? "text-foreground line-through opacity-75" : "text-foreground"
                  )}
                >
                  {q.label}
                </span>
              </div>

              <span className="font-mono-tech text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-card dark:bg-neutral-900 border border-border/80 dark:border-white/10 text-primary dark:text-amber-400 shrink-0 ml-2">
                {q.reward}
              </span>
            </div>
          );
        })}
      </div>

      {allCompleted && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center font-mono-tech text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
          ✨ {t("allQuestsDone")} +50 Bonus XP
        </div>
      )}
    </div>
  );
};

export default DailyQuests;
