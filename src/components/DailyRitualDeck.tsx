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
      reward: "+20 XP",
      done: quizDoneToday,
      icon: BookOpen,
    },
    {
      id: "chest",
      label: t("questClaimChest"),
      reward: "+Gems",
      done: chestClaimedToday || alreadyClaimed,
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

  const completedQuestsCount = quests.filter((q) => q.done).length;
  const allQuestsCompleted = completedQuestsCount === quests.length;

  const xpForNextLevel = progress ? progress.level * 100 : 100;
  const currentLevelXP = progress ? progress.xp % xpForNextLevel : 0;
  const xpPercent = Math.min((currentLevelXP / xpForNextLevel) * 100, 100);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/70 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400/80 dark:hover:border-zinc-700 text-foreground p-6 sm:p-7 shadow-xs hover:shadow-md transition-all space-y-5 font-sans">
        {/* Subtle Ambient Depth */}
        <div className="absolute top-0 right-0 w-52 h-52 bg-zinc-200/30 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

        {/* TOP ROW: Level XP Header & Live Progress */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tech text-[10px] uppercase tracking-widest text-zinc-700 dark:text-zinc-300 font-bold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-xs">
                    LEVEL {progress?.level ?? 1}
                  </span>
                  <span className="font-black text-sm text-foreground">Scholar Rank</span>
                </div>
                <p className="text-[11px] font-mono-tech text-muted-foreground mt-0.5 font-medium">
                  {currentLevelXP} / {xpForNextLevel} XP до уровня {(progress?.level ?? 1) + 1}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono-tech text-2xl sm:text-3xl font-black text-foreground tabular-nums">
                {progress?.xp ?? 0}
              </span>
              <span className="font-mono-tech text-xs text-muted-foreground ml-1 uppercase font-bold">XP</span>
            </div>
          </div>

          {/* Clean Progress Bar */}
          <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-700">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-200 rounded-full transition-all duration-700"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* TAB CONTROLS: Segmented switcher between Daily Chest & Daily Quests */}
        <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 relative z-10">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 w-full sm:w-auto shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab("chest")}
                className={cn(
                  "flex-1 sm:flex-initial px-4 py-2 rounded-xl font-mono-tech text-xs font-bold transition-all flex items-center justify-center gap-2",
                  activeTab === "chest"
                    ? "bg-white dark:bg-zinc-900 text-foreground shadow-xs border border-zinc-200 dark:border-zinc-700"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Gem className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span>{language === "ru" ? "Сундук дня" : "Daily Chest"}</span>
                {!alreadyClaimed && (
                  <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("quests")}
                className={cn(
                  "flex-1 sm:flex-initial px-4 py-2 rounded-xl font-mono-tech text-xs font-bold transition-all flex items-center justify-center gap-2",
                  activeTab === "quests"
                    ? "bg-white dark:bg-zinc-900 text-foreground shadow-xs border border-zinc-200 dark:border-zinc-700"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Trophy className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span>{language === "ru" ? "Квесты дня" : "Daily Quests"}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-mono-tech font-extrabold",
                    allQuestsCompleted
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35"
                      : "bg-muted text-muted-foreground border border-border/60"
                  )}
                >
                  {completedQuestsCount}/{quests.length}
                </span>
              </button>
            </div>

            <span className="hidden sm:block font-mono-tech text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
              {language === "ru" ? "ЕЖЕДНЕВНЫЙ ПРОТОКОЛ" : "DAILY PROTOCOL"}
            </span>
          </div>

          {/* TAB 1: DAILY CHEST */}
          {activeTab === "chest" && (
            <div className="space-y-4 animate-fadeIn">
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
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground font-bold text-xs px-3 py-1.5 rounded-xl shrink-0 shadow-xs">
                    <Gem className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                    <span>+{reward}</span>
                  </div>
                )}
              </div>

              {/* 7-day grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 w-full">
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
                        "flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl text-center transition-all duration-200 border",
                        isPast && "bg-zinc-100 dark:bg-zinc-800/90 text-foreground border-zinc-200 dark:border-zinc-700 font-bold",
                        isCurrent &&
                          "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-2 border-zinc-900 dark:border-white shadow-sm scale-[1.03] font-black",
                        !isPast &&
                          !isCurrent &&
                          "bg-white/80 dark:bg-zinc-900/60 text-muted-foreground border-zinc-200/80 dark:border-zinc-800 font-semibold"
                      )}
                    >
                      <span className="text-[9px] font-mono-tech uppercase tracking-wider opacity-80 mb-0.5 font-bold">
                        {language === "ru" ? `Д${i + 1}` : `D${i + 1}`}
                      </span>
                      {isPast ? (
                        <div className="w-4 h-4 rounded-full bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900 flex items-center justify-center my-0.5">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 my-0.5">
                          <Gem
                            className={cn(
                              "w-3 h-3",
                              isCurrent
                                ? "text-white dark:text-zinc-900"
                                : "text-muted-foreground/80"
                            )}
                          />
                        </div>
                      )}
                      <span className="text-[10px] font-mono-tech leading-tight font-bold">+{r}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              {alreadyClaimed ? (
                <div className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground font-mono-tech">
                  <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
                  <span>{t("claimedToday")} · {t("claimedNotice")}</span>
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full h-11 rounded-2xl font-black text-xs uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-sm flex items-center justify-center gap-2 hover:scale-[1.004] active:scale-[0.99] transition-all"
                >
                  {claiming ? (
                    <span className="animate-pulse font-mono-tech">
                      {language === "ru" ? "Получаем..." : "Claiming..."}
                    </span>
                  ) : (
                    <>
                      <Gem className="w-4 h-4 fill-current" />
                      <span>
                        {language === "ru"
                          ? `Забрать награду (+${reward} 💎)`
                          : `Claim Reward (+${reward} 💎)`}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: DAILY QUESTS */}
          {activeTab === "quests" && (
            <div className="space-y-3 animate-fadeIn">
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
                      : "bg-white dark:bg-zinc-900 text-muted-foreground border-zinc-200 dark:border-zinc-800"
                  )}
                >
                  {completedQuestsCount} / {quests.length} DONE
                </span>
              </div>

              <div className="space-y-2">
                {quests.map((q) => (
                  <div
                    key={q.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border transition-all duration-150 shadow-xs",
                      q.done
                        ? "bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/30 text-foreground"
                        : "bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {q.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.5} />
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

                    <span className="font-mono-tech text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 shrink-0 ml-2">
                      {q.reward}
                    </span>
                  </div>
                ))}
              </div>

              {allQuestsCompleted && (
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center font-mono-tech text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-xs">
                  ✨ {t("allQuestsDone")} +50 Bonus XP
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
