import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useLanguage } from "@/context/LanguageContext";
import {
  Zap,
  Gem,
  Check,
  Trophy,
  CheckCircle2,
  Circle,
  BookOpen,
  Flame,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import GemAnimation from "@/components/GemAnimation";

interface DailyRitualDeckProps {
  quizDoneToday: boolean;
  chestClaimedToday: boolean;
  errorsReviewDone: boolean;
}

export const DailyRitualDeck = ({
  quizDoneToday,
  chestClaimedToday,
  errorsReviewDone,
}: DailyRitualDeckProps) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"chest" | "quests">("chest");

  const {
    dailyCheckInStreak,
    lastCheckInDate,
    claimDailyCheckIn,
    DAILY_REWARDS,
  } = useGameEconomy();

  const [claiming, setClaiming] = useState(false);
  const [showGemAnim, setShowGemAnim] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);

  // User XP & Level progress
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

  // Daily Chest Calculation
  const today = new Date().toISOString().split("T")[0];
  const alreadyClaimed = lastCheckInDate === today;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const continuesStreak = lastCheckInDate === yesterday;
  const currentDay = continuesStreak ? Math.min(dailyCheckInStreak, 6) : 0;
  const reward = DAILY_REWARDS[currentDay];

  const handleClaim = async () => {
    if (alreadyClaimed) return;
    setClaiming(true);
    try {
      const earned = await claimDailyCheckIn();
      if (earned > 0) {
        setEarnedAmount(earned);
        setShowGemAnim(true);
        toast.success(
          language === "ru"
            ? `Ежедневная награда получена! +${earned} кристаллов 💎`
            : `Daily reward claimed! +${earned} gems 💎`
        );
      }
    } catch {
      toast.error(
        language === "ru"
          ? "Не удалось забрать награду. Попробуйте снова."
          : "Couldn't claim daily reward. Try again."
      );
    } finally {
      setClaiming(false);
    }
  };

  // Daily Quests Calculation
  const quests = [
    {
      id: "lesson",
      label: t("questCompleteLesson"),
      done: quizDoneToday,
      reward: "+30 XP",
      icon: BookOpen,
      color: "text-violet-500",
    },
    {
      id: "chest",
      label: t("questDailyChest"),
      done: chestClaimedToday,
      reward: "+10 XP",
      icon: Gem,
      color: "text-amber-500",
    },
    {
      id: "errors",
      label: t("questReviewErrors"),
      done: errorsReviewDone,
      reward: "+20 XP",
      icon: Flame,
      color: "text-rose-500",
    },
  ];

  const completedQuestsCount = quests.filter((q) => q.done).length;
  const allQuestsCompleted = completedQuestsCount === quests.length;

  // XP calculation
  const xp = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const xpForNextLevel = level * 100;
  const currentLevelXP = xp % 100;
  const xpPercent = Math.min(Math.round((currentLevelXP / xpForNextLevel) * 100), 100);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/80 text-foreground p-5 sm:p-7 shadow-sm hover:shadow-md transition-all space-y-5 font-sans">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/[0.05] rounded-full blur-3xl pointer-events-none" />

        {/* TOP ROW: Level XP Header & Live Progress */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Zap className="w-5 h-5 fill-neutral-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tech text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300 font-black bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30 shadow-2xs">
                    LEVEL {progress?.level ?? 1}
                  </span>
                  <span className="font-black text-sm text-foreground">Scholar Rank</span>
                </div>
                <p className="text-[11px] font-mono-tech text-muted-foreground mt-0.5 font-semibold">
                  {currentLevelXP} / {xpForNextLevel} XP до уровня {(progress?.level ?? 1) + 1}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono-tech text-2xl sm:text-3xl font-black text-foreground tabular-nums">
                {progress?.xp ?? 0}
              </span>
              <span className="font-mono-tech text-xs text-amber-600 dark:text-amber-400 ml-1 uppercase font-black">XP</span>
            </div>
          </div>

          {/* Clean Radiant Progress Bar */}
          <div className="h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border/70">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-full transition-all duration-700 shadow-xs"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* TAB CONTROLS: Segmented switcher between Daily Chest & Daily Quests */}
        <div className="pt-3 border-t border-border/60 relative z-10">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center p-1 bg-muted/60 rounded-2xl border border-border/60 w-full sm:w-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("chest")}
                className={cn(
                  "flex-1 sm:flex-initial px-4 py-2 rounded-xl font-mono-tech text-xs font-extrabold transition-all flex items-center justify-center gap-2 tap-feedback",
                  activeTab === "chest"
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Gem className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                <span>{language === "ru" ? "Сундук дня" : "Daily Chest"}</span>
                {!alreadyClaimed && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("quests")}
                className={cn(
                  "flex-1 sm:flex-initial px-4 py-2 rounded-xl font-mono-tech text-xs font-extrabold transition-all flex items-center justify-center gap-2 tap-feedback",
                  activeTab === "quests"
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === "ru" ? "Квесты дня" : "Daily Quests"}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-mono-tech font-black",
                    allQuestsCompleted
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35"
                      : "bg-muted text-muted-foreground border border-border/60"
                  )}
                >
                  {completedQuestsCount}/{quests.length}
                </span>
              </button>
            </div>

            <span className="hidden sm:block font-mono-tech text-[10px] uppercase text-muted-foreground font-extrabold tracking-wider">
              {language === "ru" ? "ЕЖЕДНЕВНЫЙ ПРОТОКОЛ" : "DAILY PROTOCOL"}
            </span>
          </div>

          {/* TAB 1: DAILY CHEST */}
          {activeTab === "chest" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-foreground">
                    {t("dailyChest")}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    {language === "ru"
                      ? "Заходи каждый день и забирай кристаллы для открытий"
                      : "Check in daily to build your streak and earn gems"}
                  </p>
                </div>

                {!alreadyClaimed && (
                  <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs px-3 py-1.5 rounded-xl shrink-0 shadow-2xs">
                    <Gem className="w-3.5 h-3.5 fill-current" />
                    <span>+{reward}</span>
                  </div>
                )}
              </div>

              {/* 7-day grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 w-full">
                {DAILY_REWARDS.map((r, i) => {
                  let isPast = false;
                  let isCurrent = false;

                  if (alreadyClaimed) {
                    isPast = i < Math.min(dailyCheckInStreak, 7);
                  } else if (continuesStreak) {
                    isPast = i < Math.min(dailyCheckInStreak, 7);
                    isCurrent = i === Math.min(dailyCheckInStreak, 6);
                  } else {
                    isPast = false;
                    isCurrent = i === 0;
                  }

                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col items-center justify-center py-3 px-1 rounded-2xl text-center transition-all duration-200 border",
                        isPast &&
                          "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-bold",
                        isCurrent &&
                          "bg-gradient-to-b from-amber-500 to-amber-600 text-neutral-950 border-2 border-amber-400 shadow-md shadow-amber-500/25 scale-[1.04] font-black",
                        !isPast &&
                          !isCurrent &&
                          "bg-muted/30 text-muted-foreground border-border/60 font-semibold"
                      )}
                    >
                      <span className="text-[9px] font-mono-tech uppercase tracking-wider opacity-90 mb-0.5 font-bold">
                        {language === "ru" ? `Д${i + 1}` : `D${i + 1}`}
                      </span>
                      {isPast ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center my-0.5 shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 my-0.5">
                          <Gem
                            className={cn(
                              "w-3.5 h-3.5",
                              isCurrent
                                ? "text-neutral-950 fill-neutral-950"
                                : "text-amber-500/60"
                            )}
                          />
                        </div>
                      )}
                      <span className="text-[10px] font-mono-tech leading-tight font-extrabold">
                        +{r}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              {alreadyClaimed ? (
                <div className="w-full py-3 px-4 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground font-mono-tech">
                  <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                  <span>{t("claimedToday")} · {t("claimedNotice")}</span>
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full h-12 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 hover:scale-[1.004] active:scale-[0.99] transition-all tap-feedback"
                >
                  {claiming ? (
                    <span className="animate-pulse font-mono-tech">
                      {language === "ru" ? "Получаем..." : "Claiming..."}
                    </span>
                  ) : (
                    <>
                      <Gem className="w-4 h-4 fill-neutral-950" />
                      <span>
                        {language === "ru"
                          ? `Забрать награду (+${reward} 💎)`
                          : `Claim Daily Reward (+${reward} 💎)`}
                      </span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: DAILY QUESTS */}
          {activeTab === "quests" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-foreground">
                    {t("dailyQuests")}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    {language === "ru"
                      ? "Выполни 3 цели за день для бонуса +50 XP"
                      : "Complete 3 daily goals to unlock +50 bonus XP"}
                  </p>
                </div>

                <span
                  className={cn(
                    "px-2.5 py-1 rounded-xl border text-[11px] font-mono-tech font-bold shadow-xs",
                    allQuestsCompleted
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-muted/50 text-muted-foreground border-border/60"
                  )}
                >
                  {completedQuestsCount} / {quests.length} DONE
                </span>
              </div>

              <div className="space-y-2">
                {quests.map((q) => {
                  const Icon = q.icon;
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-150 shadow-2xs",
                        q.done
                          ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                          : "bg-card border-border/70 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-muted/60", q.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span
                            className={cn(
                              "text-xs font-extrabold truncate block",
                              q.done && "line-through opacity-70"
                            )}
                          >
                            {q.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono-tech text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-muted border border-border text-foreground shrink-0">
                          {q.reward}
                        </span>
                        {q.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {allQuestsCompleted && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center font-mono-tech text-xs font-black text-emerald-700 dark:text-emerald-300 shadow-xs">
                  ✨ {t("allQuestsDone")} +50 Bonus XP Claimed!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <GemAnimation
        amount={earnedAmount}
        show={showGemAnim}
        onDone={() => setShowGemAnim(false)}
      />
    </>
  );
};

export default DailyRitualDeck;
