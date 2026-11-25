// src/components/StreakRepairDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Gem, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { playSuccessSound, playClickSound } from "@/utils/audio";
import { useLanguage } from "@/context/LanguageContext";

interface StreakRepairDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const STREAK_REPAIR_COST = 150;

export const StreakRepairDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: StreakRepairDialogProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isRu = language === "ru";
  const [loading, setLoading] = useState(false);

  const { data: progress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ data: progData }, { data: profData }] = await Promise.all([
        supabase
          .from("user_progress")
          .select("streak, gems, last_activity_date, streak_freeze_count")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("streak_days")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const streak = Math.max(progData?.streak ?? 0, profData?.streak_days ?? 0);
      const gems = progData?.gems ?? 0;
      return {
        streak,
        gems,
        lastActivityDate: progData?.last_activity_date,
        streakFreezeCount: progData?.streak_freeze_count ?? 0,
      };
    },
    enabled: !!user && open,
  });

  const streak = progress?.streak ?? 0;
  const gems = progress?.gems ?? 0;
  const canAfford = gems >= STREAK_REPAIR_COST;

  const handleRepair = async () => {
    if (!canAfford) {
      toast.error(
        isRu
          ? `Недостаточно гемов! Нужно ${STREAK_REPAIR_COST} 💎 (у вас ${gems} 💎)`
          : `Not enough gems! Need ${STREAK_REPAIR_COST} 💎 (you have ${gems} 💎)`
      );
      return;
    }

    setLoading(true);
    playClickSound();

    try {
      if (user) {
        // 1. Spend gems via verified security-definer RPC
        const { data: spendData, error: spendError } = await (supabase as any).rpc("up_spend_gems", {
          _amount: STREAK_REPAIR_COST,
        });

        if (spendError || (spendData && !(spendData as any).ok)) {
          // If user doesn't have enough gems on server
          toast.error(isRu ? "Ошибка списания гемов (недостаточно средств)" : "Failed to spend gems (insufficient balance)");
          setLoading(false);
          return;
        }

        // 2. Repair streak: increase streak by at least 1 or restore to active
        const newStreak = Math.max(1, streak + 1);
        await supabase
          .from("profiles")
          .update({ streak_days: newStreak })
          .eq("user_id", user.id);

        try {
          // Also bump progress streak via RPC if eligible
          await (supabase as any).rpc("up_bump_streak_on_activity");
        } catch {
          // Soft ignore
        }
      }

      // Celebrate
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      playSuccessSound();

      await queryClient.invalidateQueries({ queryKey: ["user-progress"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast.success(
        isRu
          ? "🔥 Стрик успешно восстановлен! Серия спасена."
          : "🔥 Streak repaired successfully! Day chain restored."
      );

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Streak repair failed:", err);
      toast.error(isRu ? "Произошла ошибка при ремонте стрика" : "Failed to repair streak");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-border/80 bg-background/95 backdrop-blur-xl p-6 shadow-2xl rounded-3xl">
        <DialogHeader className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl mx-auto bg-gradient-to-tr from-amber-500 to-amber-400 text-neutral-950 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-4 ring-amber-500/10">
            <Flame className="w-8 h-8 fill-current" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {isRu ? "Восстановление стрика" : "Streak Repair"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground font-medium">
            {isRu
              ? "Пропустили день? Не дайте вашей серии занятий сгореть. Восстановите стрик прямо сейчас за гемы."
              : "Missed a day? Don't let your daily momentum die. Repair and safeguard your streak instantly."}
          </DialogDescription>
        </DialogHeader>

        {/* Current Status Box */}
        <div className="bg-card/90 rounded-2xl p-4 border border-border/70 my-3 divide-y divide-border/60">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {isRu ? "Текущий стрик" : "Current Streak"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {streak === 0
                    ? isRu
                      ? "Серия прервана (0 дней)"
                      : "Streak lost (0 days)"
                    : isRu
                    ? `${streak} дн. подряд`
                    : `${streak} days active`}
                </p>
              </div>
            </div>
            <span className="text-2xl font-black font-mono-tech tabular-nums text-foreground">
              {streak} 🔥
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Gem className="w-4 h-4 fill-current" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {isRu ? "Ваш баланс" : "Your Balance"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isRu ? "Стоимость ремонта:" : "Repair cost:"} {STREAK_REPAIR_COST} 💎
                </p>
              </div>
            </div>
            <span className="text-xl font-black font-mono-tech tabular-nums text-emerald-600 dark:text-emerald-400">
              {gems} 💎
            </span>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-muted/40 rounded-xl p-3 border border-border/50 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{isRu ? "Что даёт Streak Repair:" : "What Streak Repair does:"}</span>
          </div>
          <p className="text-[11px] leading-relaxed pl-6">
            {isRu
              ? "• Моментально спасает серию дней от сброса до нуля."
              : "• Instantly rescues your streak from resetting to zero."}
          </p>
          <p className="text-[11px] leading-relaxed pl-6">
            {isRu
              ? "• Сохраняет прогресс еженедельных наград и буст XP."
              : "• Preserves weekly league multipliers and check-in rewards."}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-4 space-y-2">
          <Button
            onClick={handleRepair}
            disabled={loading || !canAfford}
            className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono-tech font-extrabold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>
              {loading
                ? isRu
                  ? "Восстанавливаем..."
                  : "Repairing..."
                : isRu
                ? `Восстановить стрик · ${STREAK_REPAIR_COST} 💎`
                : `Repair Streak · ${STREAK_REPAIR_COST} 💎`}
            </span>
          </Button>

          {!canAfford && (
            <p className="text-center text-[11px] font-semibold text-rose-500">
              {isRu
                ? `Вам не хватает ${STREAK_REPAIR_COST - gems} 💎 для восстановления.`
                : `You need ${STREAK_REPAIR_COST - gems} more 💎 to repair.`}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
