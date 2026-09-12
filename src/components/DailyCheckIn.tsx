import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gem, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import GemAnimation from "@/components/GemAnimation";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useLanguage } from "@/context/LanguageContext";

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
        toast.success(
          language === "ru"
            ? `Ежедневная награда получена! +${earned} алмазов 💎`
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

  return (
    <>
      <div className="relative z-10 bg-card/90 dark:bg-[#171615]/90 backdrop-blur-xl border border-border/80 dark:border-white/[0.12] rounded-3xl p-5 shadow-sm space-y-4 transition-all">
        {/* Header with high contrast title and reward badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Gem className="w-5 h-5 fill-amber-500/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  REWARD CHEST
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <h3 className="font-extrabold text-base text-foreground mt-0.5">
                {t("dailyChest")}
              </h3>
            </div>
          </div>

          {!alreadyClaimed && (
            <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs px-3 py-1.5 rounded-xl shrink-0 animate-pulse">
              <Gem className="w-3.5 h-3.5 fill-amber-500/40" />
              <span>+{reward}</span>
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
                  "flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl text-center transition-all duration-200 border",
                  isPast && "bg-primary/10 text-primary border-primary/25 font-bold",
                  isCurrent &&
                    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-2 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)] scale-[1.04] font-extrabold",
                  !isPast &&
                    !isCurrent &&
                    "bg-muted/50 dark:bg-neutral-900/60 text-muted-foreground border-border/70 dark:border-white/5 font-semibold"
                )}
              >
                <span className="text-[9px] font-mono-tech uppercase tracking-wider opacity-70 mb-0.5">
                  {language === "ru" ? `Д${i + 1}` : `D${i + 1}`}
                </span>
                {isPast ? (
                  <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center my-0.5">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 my-0.5">
                    <Gem
                      className={cn(
                        "w-3 h-3",
                        isCurrent
                          ? "text-amber-500 fill-amber-500/40"
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

        {/* Claim / Status action */}
        {alreadyClaimed ? (
          <div className="w-full py-3 px-4 rounded-2xl bg-secondary/80 dark:bg-neutral-900 border border-border/80 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground font-mono-tech">
            <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
            <span>{t("claimedToday")} · {t("claimedNotice")}</span>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full h-12 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider bg-neutral-100 hover:bg-white text-neutral-950 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            {claiming ? (
              <span className="animate-pulse font-mono-tech">
                {language === "ru" ? "Получаем..." : "Claiming..."}
              </span>
            ) : (
              <>
                <Gem className="w-4 h-4 text-amber-500 fill-amber-500/30" />
                <span>
                  {language === "ru"
                    ? `Забрать ${reward} алмазов`
                    : `Claim ${reward} Gems`}
                </span>
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
