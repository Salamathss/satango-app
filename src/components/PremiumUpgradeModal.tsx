import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, Infinity as InfinityIcon, Heart, FileText, Check, Tag } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

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
      toast({ title: "Upgrade failed", description: "Please try again later.", variant: "destructive" });
    }
  };

  const formatPromoCode = (input: string): string => {
    // 1. Trim spaces, remove multiple spaces, make uppercase
    let cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
    
    // 2. Insert hyphens if missing (e.g., SATANGOPL9K3A77X2 -> SATANGOPL-9K3A-77X2)
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
      const { data, error } = await supabase.rpc("check_and_apply_promo_code", {
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
          // Invalidate profile status
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
    { icon: Sparkles, label: "Unlimited AI Desmos Tutor" },
    { icon: InfinityIcon, label: "Infinite Hearts — never lose progress" },
    { icon: Heart, label: "No more wait timers" },
    { icon: FileText, label: "Exclusive Mock Exams" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-0 bg-gradient-to-b from-[#FBF7F1] via-[#F5F1EA] to-[#EDE7DC] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)]">
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#D9CFC0] to-[#B8AC97] flex items-center justify-center shadow-md">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1F1B16]">Satango Plus</h2>
            {reason ? (
              <p className="text-sm text-[#6B6457] leading-relaxed px-2">{reason}</p>
            ) : (
              <p className="text-sm text-[#6B6457]">Unlock the full Satango experience</p>
            )}
          </div>

          <div className="space-y-2">
            {perks.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/80">
                <div className="w-8 h-8 rounded-xl bg-[#1F1B16]/5 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#1F1B16]" />
                </div>
                <p className="text-sm font-semibold text-[#1F1B16]">{label}</p>
                <Check className="w-4 h-4 text-[#1F1B16]/40 ml-auto" />
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-3xl font-black text-[#1F1B16]">4,900 ₸ <span className="text-sm font-semibold text-[#6B6457]">/ month</span></p>
            <p className="text-xs text-[#6B6457] mt-0.5">Cancel anytime</p>
          </div>

          {/* Promo code toggle or input */}
          <div className="pt-2 border-t border-[#D9CFC0]/40">
            {!showPromoInput ? (
              <button
                onClick={() => setShowPromoInput(true)}
                className="w-full py-1 text-xs font-bold text-[#6B6457] hover:text-[#1F1B16] flex items-center justify-center gap-1.5 transition-colors"
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
                    className="flex-1 bg-white/70 border border-[#D9CFC0] rounded-xl px-3 py-2 text-xs text-[#1F1B16] placeholder:text-[#6B6457]/50 font-mono tracking-wider uppercase focus:outline-none focus:border-[#1F1B16] focus:ring-1 focus:ring-[#1F1B16]/20 transition-all"
                  />
                  <button
                    onClick={handleApplyPromoCode}
                    disabled={promoLoading || !promoCode.trim()}
                    className="bg-[#1F1B16] text-white px-4 rounded-xl text-xs font-bold hover:bg-[#1F1B16]/90 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shrink-0"
                  >
                    {promoLoading ? "..." : "Ввод"}
                  </button>
                </div>
                <button
                  onClick={() => { setShowPromoInput(false); setPromoCode(""); }}
                  className="text-[10px] text-[#6B6457] hover:text-[#1F1B16] block mx-auto font-medium"
                >
                  Скрыть
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-13 py-3.5 rounded-2xl bg-[#1F1B16] text-white font-bold text-base shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {loading ? "Upgrading…" : "Upgrade Now"}
          </button>
          
          <button
            onClick={() => onOpenChange(false)}
            className="w-full text-xs font-semibold text-[#6B6457] hover:text-[#1F1B16] transition-colors"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeModal;
