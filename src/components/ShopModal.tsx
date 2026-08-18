import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Snowflake, FileText, Gem, Check, Sparkles, BookOpen, Calculator } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  field: "hearts" | "streak_freeze_count" | "mock_exam_tickets" | "full_exam_tickets" | "section_exam_tickets";
  value: number;
  gradient: string;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "refill-hearts",
    name: "Refill Hearts",
    description: "Restore all 5 hearts immediately",
    cost: 150,
    icon: <Heart className="w-8 h-8" />,
    field: "hearts",
    value: 5,
    gradient: "from-[hsl(4,80%,58%)] to-[hsl(340,80%,55%)]",
  },
  {
    id: "streak-freeze",
    name: "Streak Freeze",
    description: "Protect your streak if you miss a day",
    cost: 200,
    icon: <Snowflake className="w-8 h-8" />,
    field: "streak_freeze_count",
    value: 1,
    gradient: "from-[hsl(200,90%,55%)] to-[hsl(220,85%,60%)]",
  },
  {
    id: "full-exam",
    name: "Full SAT Ticket",
    description: "Unlock a complete 98-question SAT exam (R&W + Math)",
    cost: 850,
    icon: <FileText className="w-8 h-8" />,
    field: "full_exam_tickets",
    value: 1,
    gradient: "from-[hsl(270,80%,60%)] to-[hsl(300,75%,55%)]",
  },
  {
    id: "section-exam",
    name: "Section Ticket",
    description: "Unlock a sectional mock test (R&W or Math)",
    cost: 400,
    icon: <BookOpen className="w-8 h-8" />,
    field: "section_exam_tickets",
    value: 1,
    gradient: "from-[hsl(var(--secondary))] to-[hsl(240,80%,55%)]",
  },
];

interface ShopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShopModal = ({ open, onOpenChange }: ShopModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<string | null>(null);

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

  const gems = progress?.gems ?? 0;

  const handlePurchase = async (item: ShopItem) => {
    if (!user || !progress || gems < item.cost) {
      toast.error(`Not enough gems! You need ${item.cost} gems.`);
      return;
    }

    setPurchasing(item.id);

    let rpcResult: { data: any; error: any };
    if (item.field === "hearts") {
      rpcResult = await (supabase as any).rpc("up_refill_hearts_with_gems");
    } else {
      rpcResult = await (supabase as any).rpc("up_purchase_item", {
        _item: item.field,
        _quantity: item.value,
      });
    }

    if (rpcResult.error || !(rpcResult.data as any)?.ok) {
      toast.error("Purchase failed. Try again.");
      setPurchasing(null);
      return;
    }

    setPurchasing(null);
    setPurchased(item.id);

    // Reset animation after 1.5s
    setTimeout(() => setPurchased(null), 1500);

    queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    toast.success(`${item.name} purchased! 🎉`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 bg-background/80 backdrop-blur-2xl shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-center">
            ✨ Shop
          </DialogTitle>
          <DialogDescription className="text-center">
            <span className="inline-flex items-center gap-1.5 font-bold text-gem">
              <Gem className="w-4 h-4" />
              {gems} Gems available
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {SHOP_ITEMS.map((item) => {
            const canAfford = gems >= item.cost;
            const isPurchasing = purchasing === item.id;
            const isPurchased = purchased === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-border/50 p-4 transition-all duration-300",
                  "bg-card/60 backdrop-blur-xl",
                  "hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] hover:border-border",
                  isPurchased && "animate-bounce-in",
                  item.id === "full-exam" && "ring-1 ring-gem/30 shadow-[0_0_20px_-4px_hsl(var(--gem)/0.3)]"
                )}
              >
                {/* Glassmorphism shimmer */}
                <div className="absolute inset-0 bg-gradient-to-br from-card/20 via-transparent to-card/10 pointer-events-none" />

                <div className="relative flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-primary-foreground bg-gradient-to-br shrink-0",
                    item.gradient
                  )}>
                    {isPurchased ? <Check className="w-8 h-8" /> : item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                      {item.name}
                      {item.id === "full-exam" && (
                        <Sparkles className="w-3.5 h-3.5 text-gem" />
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>

                  <Button
                    size="sm"
                    disabled={!canAfford || isPurchasing}
                    onClick={() => handlePurchase(item)}
                    className={cn(
                      "shrink-0 gap-1 font-bold min-w-[80px]",
                      !canAfford && "opacity-50"
                    )}
                  >
                    {isPurchasing ? (
                      <span className="animate-pulse">...</span>
                    ) : isPurchased ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <>
                        <Gem className="w-3.5 h-3.5" />
                        {item.cost}
                      </>
                    )}
                  </Button>
                </div>

                {/* Inventory count for stackable items */}
                {item.field !== "hearts" && progress && (
                  <div className="relative mt-2 text-xs text-muted-foreground font-semibold">
                    Owned: {(progress as any)[item.field] ?? 0}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopModal;
