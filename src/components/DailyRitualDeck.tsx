// src/components/DailyRitualDeck.tsx
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
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import GemAnimation from "@/components/GemAnimation";
import { playChestRewardSound } from "@/utils/audio";

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
        playChestRewardSound();
        toast.success(
          language === "ru"
            ? `Ежедневная награда получена! +${earned} кристаллов`
            : `Daily reward claimed! +${earned} gems`
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
      color: "text-violet-500 dark:text-violet-400",
    },
    {
      id: "chest",
      label: t("questClaimChest"),
      done: chestClaimedToday,
      reward: "+10 XP",
      icon: Gem,
      color: "text-amber-500 dark:text-amber-400",
    },
    {
      id: "errors",
      label: t("questReviewMistakes"),
      done: errorsReviewDone,
      reward: "+20 XP",
      icon: Flame,
      color: "text-rose-500 dark:text-rose-400",
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
      <div className="rounded-xl bg-card border border-border/80 text-foreground p-4 sm:p-5 shadow-2xs space-y-4 font-sans select-none">
        {/* TOP ROW: Level XP Header & Live Progress */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-secondary text-secondary-foreground border border-border/70 flex items-center justify-center shrink-0 shadow-2xs">
                <Zap className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-tech text-[11px] text-foreground font-semibold bg-muted/60 px-2 py-0.5 rounded border border-border/60">
                    Level {level}
                  </span>
                  <span className="font-medium text-xs text-muted-foreground">Scholar Rank</span>
                </div>
                <p className="text-[11px] font-mono-tech text-muted-foreground mt-0.5">
                  {currentLevelXP} / {xpForNextLevel} XP {language === "ru" ? "до уровня " + (level + 1) : "to Level " + (level + 1)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono-tech text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {xp}
              </span>
              <span className="font-mono-tech text-xs text-muted-foreground ml-1">XP</span>
            </div>
          </div>

          {/* Clean Progress Bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/60">
            <div
              className="h-full w-full bg-foreground/80 dark:bg-primary rounded-full motion-safe:transition-transform duration-500 origin-left"
              style={{ transform: `scaleX(${xpPercent / 100})` }}
            />
          </div>
        </div>

        {/* TAB CONTROLS: Segmented switcher between Daily Chest & Daily Quests */}
        <div className="pt-3 border-t border-border/60">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="inline-flex items-center p-0.5 bg-muted/50 rounded-lg border border-border/60 w-full sm:w-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("chest")}
                className={cn(
                  "flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-mono-tech text-xs font-medium motion-safe:transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted disabled:opacity-50 disabled:pointer-events-none",
                  activeTab === "chest"
                    ? "bg-background text-foreground shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                )}
              >
                <Gem className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>{language === "ru" ? "Сундук дня" : "Daily Chest"}</span>
                {!alreadyClaimed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("quests")}
                className={cn(
                  "flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-mono-tech text-xs font-medium motion-safe:transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted disabled:opacity-50 disabled:pointer-events-none",
                  activeTab === "quests"
                    ? "bg-background text-foreground shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                )}
              >
                <Trophy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>{language === "ru" ? "Квесты дня" : "Daily Quests"}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded font-mono-tech tabular-nums font-semibold shrink-0",
                    allQuestsCompleted
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground border border-border/60"
                  )}
                >
                  {completedQuestsCount}/{quests.length}
                </span>
              </button>
            </div>

            <span className="hidden sm:block font-mono-tech text-[11px] text-muted-foreground font-medium">
              {language === "ru" ? "Ежедневный протокол" : "Daily Protocol"}
            </span>
          </div>

          {/* TAB 1: DAILY CHEST */}
          {activeTab === "chest" && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {t("dailyChest")}
                  </h4>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    {language === "ru"
                      ? "Заходи каждый день и забирай кристаллы для открытий"
                      : "Check in daily to build your streak and earn gems"}
                  </p>
                </div>

                {!alreadyClaimed && (
                  <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-mono-tech text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
                    <Gem className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
                    <span className="tabular-nums">+{reward}</span>
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
                        "flex flex-col items-center justify-center py-2 px-1 rounded-md text-center border motion-safe:transition-colors duration-150",
                        isPast &&
                          "bg-muted/40 text-muted-foreground border-border/60",
                        isCurrent &&
                          "bg-amber-50/70 dark:bg-amber-500/10 text-foreground border-amber-500/40 shadow-2xs",
                        !isPast &&
                          !isCurrent &&
                          "bg-muted/20 text-muted-foreground border-border/50"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-mono-tech mb-0.5 font-medium",
                          isCurrent
                            ? "text-amber-800 dark:text-amber-300 font-semibold"
                            : "text-muted-foreground"
                        )}
                      >
                        {language === "ru" ? `Д${i + 1}` : `D${i + 1}`}
                      </span>

                      {isPast ? (
                        <div className="w-4 h-4 rounded-full bg-foreground/10 text-foreground flex items-center justify-center my-0.5 shadow-2xs">
                          <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 my-0.5">
                          <Gem
                            className={cn(
                              "w-3.5 h-3.5",
                              isCurrent
                                ? "text-amber-500 dark:text-amber-400"
                                : "text-muted-foreground/40"
                            )}
                          />
                        </div>
                      )}

                      <span
                        className={cn(
                          "text-xs font-mono-tech tabular-nums leading-tight",
                          isCurrent ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                        )}
                      >
                        +{r}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              {alreadyClaimed ? (
                <div className="w-full py-2.5 px-3 rounded-md bg-muted/40 border border-border/70 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground font-mono-tech">
                  <Check className="w-3.5 h-3.5 text-foreground/70" strokeWidth={2} />
                  <span>{t("claimedToday")} · {t("claimedNotice")}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full h-10 rounded-md font-mono-tech text-xs sm:text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-950 border border-transparent shadow-2xs flex items-center justify-center gap-2 motion-safe:transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-neutral-800 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {claiming ? (
                    <span className="font-mono-tech">
                      {language === "ru" ? "Получаем..." : "Claiming..."}
                    </span>
                  ) : (
                    <>
                      <Gem className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500 shrink-0" strokeWidth={2} />
                      <span>
                        {language === "ru"
                          ? `Забрать награду (+${reward} алмазов)`
                          : `Claim reward (+${reward} gems)`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-white/70 dark:text-neutral-950/70 shrink-0" strokeWidth={2} />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: DAILY QUESTS */}
          {activeTab === "quests" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {t("dailyQuests")}
                  </h4>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    {language === "ru"
                      ? "Выполни 3 цели за день для бонуса +50 XP"
                      : "Complete 3 daily goals to unlock +50 bonus XP"}
                  </p>
                </div>

                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md border text-[11px] font-mono-tech font-medium tabular-nums shadow-2xs",
                    allQuestsCompleted
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-muted/50 text-muted-foreground border-border/60"
                  )}
                >
                  {completedQuestsCount} / {quests.length} done
                </span>
              </div>

              <div className="space-y-1.5">
                {quests.map((q) => {
                  const Icon = q.icon;
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "flex items-center justify-between p-2.5 sm:p-3 rounded-md border motion-safe:transition-colors duration-150 shadow-2xs",
                        q.done
                          ? "bg-muted/40 border-border/70 text-foreground"
                          : "bg-muted/20 border-border/60 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("w-6 h-6 rounded flex items-center justify-center bg-muted/60 shrink-0", q.color)}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className={cn(
                            "text-xs font-medium truncate block",
                            q.done && "line-through opacity-70"
                          )}
                        >
                          {q.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-tech text-[11px] font-medium px-2 py-0.5 rounded bg-muted/60 border border-border/60 text-muted-foreground tabular-nums">
                          {q.reward}
                        </span>
                        {q.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2} />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {allQuestsCompleted && (
                <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-center font-mono-tech text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-2xs">
                  {t("allQuestsDone")} +50 Bonus XP Claimed!
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
