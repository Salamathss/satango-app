import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Sparkles,
  Infinity as InfinityIcon,
  Heart,
  FileText,
  Check,
  Tag,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
}

const PremiumUpgradeModal = ({ open, onOpenChange, reason }: PremiumUpgradeModalProps) => {
  const { upgrade } = usePremium();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<"1month" | "3month">("3month");
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const ok = await upgrade();
    setLoading(false);
    if (ok) {
      toast({ title: "Welcome to Satango Plus", description: "Enjoy unlimited learning ✨" });
      onOpenChange(false);
    } else {
      // In web app, we can redirect or inform about activation
      toast({
        title: "Selected Plan",
        description: selectedPlan === "3month" ? "3-Month Mastery ($24.99)" : "1-Month Sprint ($9.99)",
      });
      // In local dev/demo or webhook-driven system:
      onOpenChange(false);
    }
  };

  const formatPromoCode = (input: string): string => {
    let cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleaned.includes("-") && cleaned.startsWith("SATANGOPL")) {
      const remainder = cleaned.substring(9);
      if (remainder.length === 8) {
        return `SATANGOPL-${remainder.substring(0, 4)}-${remainder.substring(4)}`;
      }
    }
    return cleaned;
  };

  const handleApplyPromoCode = async () => {
    const formatted = formatPromoCode(promoCode);
    if (!formatted.startsWith("SATANGOPL-") || formatted.length !== 19) {
      toast({
        title: "Неверный формат",
        description: "Промокод должен быть формата SATANGOPL-XXXX-YYYY",
        variant: "destructive",
      });
      return;
    }

    setPromoLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("check_and_apply_promo_code", {
        input_code: formatted,
      });

      if (error) {
        toast({
          title: "Ошибка активации",
          description: error.message || "Не удалось проверить промокод.",
          variant: "destructive",
        });
      } else {
        const res = data as { ok: boolean; error?: string; message?: string };
        if (res.ok) {
          toast({
            title: "Satango Plus Активирован! 🎉",
            description: "Ваша подписка успешно активирована на 30 дней. Приятного обучения! ✨",
          });
          setPromoCode("");
          onOpenChange(false);
          queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
        } else {
          toast({
            title: "Ошибка активации",
            description: res.error || "Промокод недействителен.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      toast({
        title: "Ошибка подключения",
        description: err.message || "Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const perks = [
    { icon: Sparkles, label: "Unlimited Socratic AI Tutor (No daily limits)" },
    { icon: InfinityIcon, label: "Infinite Hearts — train without restrictions" },
    { icon: ShieldCheck, label: "Mistake Vault Pro & targeted error drills" },
    { icon: Clock, label: "Time & Pacing Analytics against College Board standard" },
    { icon: FileText, label: "Exclusive Full-Length 98-Question Diagnostic Mocks" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border border-border/80 bg-gradient-to-b from-[#FAF6EF] via-[#F4EEE3] to-[#EAE2D3] dark:from-[#1c1a18] dark:via-[#161514] dark:to-[#121110] text-foreground shadow-2xl">
        <div className="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-md text-amber-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-extrabold">
              SATANGO PLUS MEMBERSHIP
            </span>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Upgrade to Satango Plus
            </h2>
            {reason ? (
              <p className="text-xs text-muted-foreground leading-relaxed px-2">{reason}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Unlock full AI power, mistake analytics, and unlimited Digital SAT prep
              </p>
            )}
          </div>

          {/* Pricing Selector (1-Month vs 3-Month Mastery) */}
          <div className="grid grid-cols-2 gap-3">
            {/* 1-Month Sprint */}
            <button
              type="button"
              onClick={() => setSelectedPlan("1month")}
              className={cn(
                "p-3.5 rounded-2xl border text-left transition-all relative",
                selectedPlan === "1month"
                  ? "bg-card dark:bg-neutral-900 border-2 border-foreground dark:border-amber-400 shadow-md scale-[1.02]"
                  : "bg-card/60 dark:bg-neutral-900/60 border-border/80 opacity-85 hover:opacity-100"
              )}
            >
              <span className="font-mono-tech text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
                1-Month Sprint
              </span>
              <div className="text-xl font-black text-foreground mt-0.5">
                $9.99
              </div>
              <span className="text-[10px] text-muted-foreground block">
                Billed monthly
              </span>
            </button>

            {/* 3-Month Mastery (HIT) */}
            <button
              type="button"
              onClick={() => setSelectedPlan("3month")}
              className={cn(
                "p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden",
                selectedPlan === "3month"
                  ? "bg-card dark:bg-neutral-900 border-2 border-amber-500 shadow-lg scale-[1.02]"
                  : "bg-card/60 dark:bg-neutral-900/60 border-border/80 opacity-85 hover:opacity-100"
              )}
            >
              <div className="absolute top-0 right-0 bg-amber-500 text-neutral-950 font-mono-tech text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                ХИТ · SAVE 20%
              </div>
              <span className="font-mono-tech text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-extrabold block">
                3-Month Mastery
              </span>
              <div className="text-xl font-black text-foreground mt-0.5">
                $24.99
              </div>
              <span className="text-[10px] text-muted-foreground block">
                ~$8.33 / month
              </span>
            </button>
          </div>

          {/* Perks List */}
          <div className="space-y-2">
            {perks.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-card/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl px-3.5 py-2.5 border border-border/60"
              >
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-xs font-bold text-foreground flex-1 leading-snug">{label}</p>
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={3} />
              </div>
            ))}
          </div>

          {/* Promo Code Drawer/Toggle */}
          <div className="pt-2 border-t border-border/60">
            {!showPromoInput ? (
              <button
                type="button"
                onClick={() => setShowPromoInput(true)}
                className="w-full py-1 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>У меня есть промокод</span>
              </button>
            ) : (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="SATANGOPL-XXXX-YYYY"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 bg-card dark:bg-neutral-900 border border-border rounded-xl px-3 py-2 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromoCode}
                    disabled={promoLoading || !promoCode.trim()}
                    className="bg-foreground text-background px-4 rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shrink-0"
                  >
                    {promoLoading ? "..." : "Активировать"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPromoInput(false);
                    setPromoCode("");
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground block mx-auto font-medium"
                >
                  Скрыть
                </button>
              </div>
            )}
          </div>

          {/* Upgrade CTA */}
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {loading
                ? "Upgrading…"
                : selectedPlan === "3month"
                ? "Get 3-Month Mastery — $24.99"
                : "Get 1-Month Sprint — $9.99"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors text-center block"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeModal;
