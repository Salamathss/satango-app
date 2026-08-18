import { useState } from "react";
import AppShell from "@/components/AppShell";
import ShopModal from "@/components/ShopModal";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import { Heart, Snowflake, FileText, BookOpen, Gem, ShoppingBag, Sparkles, Check, Infinity as InfinityIcon } from "lucide-react";

const Shop = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const { isPremium } = usePremium();

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

  const inventoryItems = [
    { icon: Heart, label: "Hearts", value: (progress as any)?.hearts ?? 0, color: "text-destructive bg-destructive/10" },
    { icon: Snowflake, label: "Streak Freezes", value: (progress as any)?.streak_freeze_count ?? 0, color: "text-secondary bg-secondary/10" },
    { icon: FileText, label: "Full Exam Tickets", value: (progress as any)?.full_exam_tickets ?? 0, color: "text-gem bg-gem/10" },
    { icon: BookOpen, label: "Section Tickets", value: (progress as any)?.section_exam_tickets ?? 0, color: "text-secondary bg-secondary/10" },
  ];

  return (
    <AppShell title="Shop">
      <div className="space-y-5 animate-spring-in">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Shop</h1>
          <p className="text-muted-foreground text-sm mt-1">Spend gems on power-ups and tickets</p>
        </div>

        {/* Satango Plus card */}
        {isPremium ? (
          <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#FBF7F1] via-[#F5F1EA] to-[#EDE7DC] border border-white/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D9CFC0] to-[#B8AC97] flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-wide uppercase text-[#6B6457]">Active subscription</p>
                <p className="text-xl font-extrabold text-[#1F1B16]">Satango Plus</p>
              </div>
            </div>
            <p className="text-xs text-[#6B6457] mt-3">You're enjoying unlimited AI Tutor, infinite hearts and exclusive mocks. ✨</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#FBF7F1] via-[#F5F1EA] to-[#EDE7DC] border border-white/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D9CFC0] to-[#B8AC97] flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold tracking-wide uppercase text-[#6B6457]">Premium</p>
                <p className="text-xl font-extrabold text-[#1F1B16]">Satango Plus</p>
              </div>
              <p className="text-sm font-extrabold text-[#1F1B16]">4,900 ₸<span className="text-[10px] font-semibold text-[#6B6457]"> /mo</span></p>
            </div>

            <ul className="mt-4 space-y-1.5">
              {[
                { icon: Sparkles, text: "Unlimited AI Desmos Tutor" },
                { icon: InfinityIcon, text: "Infinite Hearts — never lose progress" },
                { icon: FileText, text: "Exclusive Mock Exams" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-[#1F1B16]">
                  <Check className="w-3.5 h-3.5 text-[#1F1B16]/50" />
                  <span className="font-medium">{text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setPremiumOpen(true)}
              className="mt-4 w-full h-12 rounded-2xl bg-[#1F1B16] text-white font-bold text-sm shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade Now
            </button>
          </div>
        )}


        <div className="bg-gradient-to-br from-gem/15 to-gem/5 rounded-3xl p-5 border border-gem/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gem/20 flex items-center justify-center">
              <Gem className="w-6 h-6 text-gem" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Your balance</p>
              <p className="text-2xl font-black text-gem">{progress?.gems ?? 0}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground mb-3">Inventory</h2>
          <div className="grid grid-cols-2 gap-3">
            {inventoryItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-card rounded-3xl p-4 border border-border/50">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-black mt-2">{item.value}</p>
                  <p className="text-xs text-muted-foreground font-semibold">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="w-full h-14 rounded-3xl bg-primary text-primary-foreground font-extrabold text-base shadow-lg active:scale-[0.97] transition-transform tap-feedback flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Browse Store
        </button>
      </div>

      <ShopModal open={open} onOpenChange={setOpen} />
      <PremiumUpgradeModal open={premiumOpen} onOpenChange={setPremiumOpen} />
    </AppShell>
  );
};

export default Shop;
