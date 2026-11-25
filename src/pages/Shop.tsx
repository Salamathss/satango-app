import { useState } from "react";
import AppShell from "@/components/AppShell";
import ShopModal from "@/components/ShopModal";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";
import ProAcademyDeck from "@/components/ProAcademyDeck";
import { BoostersDeck } from "@/components/BoostersDeck";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import { useLanguage } from "@/context/LanguageContext";
import {
  Heart,
  Snowflake,
  FileText,
  BookOpen,
  Gem,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Shop = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const { isPremium } = usePremium();

  const isRu = language === "ru";

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
      label: isRu ? "Жизни" : "Hearts",
      sublabel: isRu ? "Энергия практики" : "Practice health",
      value: (progress as any)?.hearts ?? 0,
      color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      icon: Snowflake,
      label: isRu ? "Заморозка стрика" : "Streak Freezes",
      sublabel: isRu ? "Защита серии" : "Streak protection",
      value: (progress as any)?.streak_freeze_count ?? 0,
      color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
    },
    {
      icon: FileText,
      label: isRu ? "Билеты Full Exam" : "Full Exam Tickets",
      sublabel: isRu ? "98 вопросов SAT" : "98-question mock",
      value: (progress as any)?.full_exam_tickets ?? 0,
      color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    {
      icon: BookOpen,
      label: isRu ? "Билеты секций" : "Section Tickets",
      sublabel: isRu ? "Math или R&W" : "Math or R&W",
      value: (progress as any)?.section_exam_tickets ?? 0,
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  const handleSelectPlan = (plan: "1month" | "3month") => {
    setPremiumOpen(true);
  };

  return (
    <AppShell title={isRu ? "Магазин" : "Shop"}>
      <div className="space-y-6 animate-spring-in font-sans">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full">
                {isRu ? "Магазин наград и Pro-усилителей" : "Rewards & Power-ups Store"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {isRu ? "Магазин и подписка" : "Shop & Membership"}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 font-medium">
              {isRu
                ? "Усилители, билеты на мок-тесты и полный арсенал Satango Plus"
                : "Power-ups, tickets, and Satango Plus Pro Arsenal"}
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-foreground text-background font-mono-tech text-xs uppercase tracking-wider font-extrabold shadow-md hover:opacity-90 active:scale-95 transition flex items-center gap-2 tap-feedback shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isRu ? "Магазин" : "Store"}</span>
          </button>
        </div>

        {/* Shop Tabs: Boosters vs Inventory & Plus */}
        <Tabs defaultValue="boosters" className="w-full">
          <TabsList className="grid grid-cols-2 max-w-sm h-11 p-1 rounded-2xl bg-muted/60 border border-border/70 mb-4">
            <TabsTrigger
              value="boosters"
              className="rounded-xl font-mono-tech text-xs uppercase font-extrabold flex items-center justify-center gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>{isRu ? "Бустеры" : "Boosters"}</span>
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="rounded-xl font-mono-tech text-xs uppercase font-extrabold flex items-center justify-center gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRu ? "Инвентарь & Plus" : "Vault & Plus"}</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BOOSTERS */}
          <TabsContent value="boosters" className="space-y-6 mt-0">
            <BoostersDeck />
          </TabsContent>

          {/* TAB 2: INVENTORY & MEMBERSHIP */}
          <TabsContent value="inventory" className="space-y-6 mt-0">
            {/* SATANGO PLUS PRO ARSENAL DECK (Real Features & Interactive Showcase) */}
            <ProAcademyDeck onSelectPlan={handleSelectPlan} />

            {/* Gem Balance Box with Warm High-End Styling */}
            <div className="bg-gradient-to-r from-amber-500/[0.08] via-card to-card rounded-3xl p-5 sm:p-6 border border-amber-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-neutral-950 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                  <Gem className="w-7 h-7 fill-neutral-950" />
                </div>
                <div>
                  <p className="font-mono-tech text-[10px] uppercase text-amber-700 dark:text-amber-400 font-extrabold tracking-widest">
                    {isRu ? "ДОСТУПНЫЕ ГЕМЫ" : "AVAILABLE GEMS"}
                  </p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <p className="text-3xl sm:text-4xl font-black text-foreground tabular-nums tracking-tight">
                      {progress?.gems ?? 0}
                    </p>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {isRu ? "гемов на балансе" : "gems available"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setOpen(true)}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono-tech text-xs uppercase font-black shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-2 shrink-0 tap-feedback"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isRu ? "Потратить гемы" : "Spend Gems"}</span>
              </button>
            </div>

            {/* Inventory Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-foreground" />
                  <span className="text-xs font-bold text-foreground">
                    {isRu ? "Ваш инвентарь" : "Your Inventory"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {isRu ? "Активные предметы" : "Active Items"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
                {inventoryItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="bg-card hover:bg-card/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-border/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center border mb-3 transition-transform group-hover:scale-105 shadow-xs",
                          item.color
                        )}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2.4} />
                      </div>
                      <div>
                        <p className="text-2xl sm:text-3xl font-black text-foreground tabular-nums tracking-tight">
                          {item.value}
                        </p>
                        <p className="text-xs font-bold text-foreground truncate mt-1">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate font-medium mt-0.5">
                          {item.sublabel}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Store Open Button */}
            <button
              onClick={() => setOpen(true)}
              className="w-full h-14 rounded-2xl sm:rounded-3xl bg-foreground text-background font-mono-tech font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-[0.98] transition-all tap-feedback flex items-center justify-center gap-2.5"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{isRu ? "Открыть полный каталог усилений" : "Open Full Power-Up Shop"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </TabsContent>
        </Tabs>
      </div>

      <ShopModal open={open} onOpenChange={setOpen} />
      <PremiumUpgradeModal open={premiumOpen} onOpenChange={setPremiumOpen} />
    </AppShell>
  );
};

export default Shop;
