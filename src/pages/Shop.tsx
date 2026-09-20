import { useState } from "react";
import AppShell from "@/components/AppShell";
import ShopModal from "@/components/ShopModal";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";
import ProAcademyDeck from "@/components/ProAcademyDeck";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import {
  Heart,
  Snowflake,
  FileText,
  BookOpen,
  Gem,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

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
    {
      icon: Heart,
      label: "Hearts",
      value: (progress as any)?.hearts ?? 0,
      color: "text-destructive bg-destructive/10",
    },
    {
      icon: Snowflake,
      label: "Streak Freezes",
      value: (progress as any)?.streak_freeze_count ?? 0,
      color: "text-sky-500 bg-sky-500/10",
    },
    {
      icon: FileText,
      label: "Full Exam Tickets",
      value: (progress as any)?.full_exam_tickets ?? 0,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      icon: BookOpen,
      label: "Section Tickets",
      value: (progress as any)?.section_exam_tickets ?? 0,
      color: "text-secondary bg-secondary/10",
    },
  ];

  const handleSelectPlan = (plan: "1month" | "3month") => {
    setPremiumOpen(true);
  };

  return (
    <AppShell title="Shop">
      <div className="space-y-6 animate-spring-in font-sans">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Shop & Membership
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
              Power-ups, tickets, and Satango Plus Pro Arsenal
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-foreground text-background font-mono-tech text-xs uppercase tracking-wider font-bold shadow-md hover:opacity-90 transition flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Store</span>
          </button>
        </div>

        {/* SATANGO PLUS PRO ARSENAL DECK (Real Features & Interactive Showcase) */}
        <ProAcademyDeck onSelectPlan={handleSelectPlan} />

        {/* Gem Balance Box */}
        <div className="bg-card/90 dark:bg-[#171615]/90 backdrop-blur-xl rounded-3xl p-5 border border-border/80 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
              <Gem className="w-6 h-6 fill-amber-500/40" />
            </div>
            <div>
              <p className="font-mono-tech text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                AVAILABLE GEMS
              </p>
              <p className="text-3xl font-black text-foreground tabular-nums">
                {progress?.gems ?? 0}
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono-tech text-xs uppercase font-extrabold shadow-md transition"
          >
            Spend Gems
          </button>
        </div>

        {/* Inventory */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
              // YOUR INVENTORY
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {inventoryItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-card/90 dark:bg-[#171615]/90 backdrop-blur-xl rounded-3xl p-4 border border-border/80 dark:border-white/10 shadow-sm flex flex-col justify-between"
                >
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${item.color} mb-3`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-foreground tabular-nums">{item.value}</p>
                    <p className="text-xs text-muted-foreground font-semibold truncate mt-0.5">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Store Open Button */}
        <button
          onClick={() => setOpen(true)}
          className="w-full h-14 rounded-3xl bg-primary text-primary-foreground font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl active:scale-[0.98] transition-all tap-feedback flex items-center justify-center gap-2.5"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Open Full Power-Up Shop</span>
        </button>
      </div>

      <ShopModal open={open} onOpenChange={setOpen} />
      <PremiumUpgradeModal open={premiumOpen} onOpenChange={setPremiumOpen} />
    </AppShell>
  );
};

export default Shop;
