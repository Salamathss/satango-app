import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Gem, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import GemAnimation from "@/components/GemAnimation";
import { useGameEconomy } from "@/hooks/useGameEconomy";

const DailyCheckIn = () => {
  const {
    dailyCheckInStreak,
    lastCheckInDate,
    claimDailyCheckIn,
    DAILY_REWARDS,
  } = useGameEconomy();
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
        toast.success(`Daily reward claimed! +${earned} gems 💎`);
      }
    } catch {
      toast.error("Couldn't claim daily reward. Try again.");
    } finally {
      setClaiming(false);
    }
  };

  const streak = dailyCheckInStreak;

  return (
    <>
      <div className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-accent" />
            <h3 className="font-extrabold text-sm">Daily Chest</h3>
          </div>
          {!alreadyClaimed && (
            <span className="text-xs font-bold text-gem flex items-center gap-1">
              <Gem className="w-3 h-3" /> +{reward}
            </span>
          )}
        </div>

        {/* 7-day progress */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full max-w-full overflow-x-auto">
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
                  "flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
                  isPast && "bg-primary/20 text-primary",
                  isCurrent && "bg-gem/20 text-gem ring-2 ring-gem/30",
                  !isPast && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isPast ? <Check className="w-3 h-3" /> : `${r}`}
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleClaim}
          disabled={alreadyClaimed || claiming}
          className="w-full font-bold gap-1.5"
          size="sm"
        >
          {alreadyClaimed ? (
            <>
              <Check className="w-4 h-4" />
              Claimed Today
            </>
          ) : claiming ? (
            <span className="animate-pulse">Claiming...</span>
          ) : (
            <>
              <Gift className="w-4 h-4" />
              Open Daily Chest
            </>
          )}
        </Button>
      </div>

      <GemAnimation amount={earnedAmount} show={showGemAnim} onDone={() => setShowGemAnim(false)} />
    </>
  );
};

export default DailyCheckIn;
