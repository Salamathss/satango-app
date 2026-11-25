// src/components/DailyCheckIn.tsx
import { useState } from "react";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useLanguage } from "@/context/LanguageContext";
import { Gem, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import GemAnimation from "@/components/GemAnimation";
import { playChestRewardSound } from "@/utils/audio";

const DailyCheckIn = () => {
  const {
    dailyCheckInStreak,
    lastCheckInDate,
    claimDailyCheckIn,
    DAILY_REWARDS,
  } = useGameEconomy();
  const { t, language } = useLanguage();

  const [claiming, setClaiming] = useState(false);
  const [showGemAnim, setShowGemAnim] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);

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

  return (
    <>
      <div className="rounded-xl bg-card border border-border/80 text-foreground p-4 sm:p-5 shadow-2xs space-y-3.5 select-none font-sans">
        {/* Header with clean title and reward badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-secondary text-secondary-foreground border border-border/70 flex items-center justify-center shrink-0 shadow-2xs">
              <Gem className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {t("dailyChest")}
              </h3>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                {t("dailyChestDesc")}
              </p>
            </div>
          </div>

          {!alreadyClaimed && (
            <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-mono-tech text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
              <Gem className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="tabular-nums">+{reward}</span>
            </div>
          )}
        </div>

        {/* 7-day progress grid */}
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
                  isPast && "bg-muted/40 text-muted-foreground border-border/60",
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

        {/* Claim / Status action */}
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

      <GemAnimation
        amount={earnedAmount}
        show={showGemAnim}
        onDone={() => setShowGemAnim(false)}
      />
    </>
  );
};

export default DailyCheckIn;
