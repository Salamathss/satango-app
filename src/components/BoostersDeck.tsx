// src/components/BoostersDeck.tsx
import { useState } from "react";
import { useBoosters, BoosterType, BOOSTER_ITEMS } from "@/hooks/useBoosters";
import { useLanguage } from "@/context/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  Divide,
  Binary,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Play,
  CheckCircle2,
  Zap,
  Gem,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SolveSimilarDialog } from "@/components/SolveSimilarDialog";

const DEMO_SAT_QUESTION = {
  question_text:
    "If 3x + 2y = 18 and y = 2x - 5, what is the value of x?",
  options: ["2", "4", "6", "8"],
  correct_answer: 1, // x = 4
};

interface BoostersDeckProps {
  compact?: boolean;
}

export const BoostersDeck = ({ compact = false }: BoostersDeckProps) => {
  const { counts, gems, purchaseBooster, consumeBooster } = useBoosters();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === "ru";

  const [purchasing, setPurchasing] = useState<BoosterType | null>(null);
  const [demoSimilarOpen, setDemoSimilarOpen] = useState(false);

  const handleBuy = async (type: BoosterType) => {
    setPurchasing(type);
    await purchaseBooster(type);
    setPurchasing(null);
  };

  const getIcon = (type: BoosterType) => {
    switch (type) {
      case "fiftyFifty":
        return <Divide className="w-6 h-6" />;
      case "desmosHacks":
        return <Binary className="w-6 h-6" />;
      case "similarDrills":
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const boosterList: BoosterType[] = ["fiftyFifty", "desmosHacks", "similarDrills"];

  return (
    <div className="space-y-4">
      {/* Intro Header */}
      {!compact && (
        <div className="bg-card/70 rounded-3xl p-5 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/25 px-2.5 py-0.5 rounded-full">
                <Zap className="w-3.5 h-3.5 fill-current" />
                {isRu ? "Арсенал ускорения подготовки" : "Fast-Track Mastery Arsenal"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {isRu ? "Игровые бустеры за гемы" : "Tactical Boosters"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              {isRu
                ? "Инвестируйте заработанные алмазы в подсказки, шпаргалки и персональные тренировки на ошибках."
                : "Invest earned gems into eliminations, Desmos hacks, and AI error drills."}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/25 shrink-0 self-start sm:self-auto">
            <Gem className="w-4 h-4 text-amber-500 fill-current" />
            <span className="font-mono-tech text-xs font-extrabold text-foreground">
              {gems} {isRu ? "гемов" : "gems"}
            </span>
          </div>
        </div>
      )}

      {/* Boosters Grid */}
      <div className={cn("grid gap-4", compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
        {boosterList.map((type) => {
          const item = BOOSTER_ITEMS[type];
          const count = counts[type];
          const canAfford = gems >= item.cost;
          const isBuying = purchasing === type;

          return (
            <div
              key={type}
              className={cn(
                "rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between group relative overflow-hidden bg-gradient-to-b",
                item.gradient,
                "border-border/80 shadow-xs hover:shadow-md hover:border-foreground/20"
              )}
            >
              <div>
                {/* Top Row: Icon + In-stock badge */}
                <div className="flex items-center justify-between mb-3.5">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform",
                      item.accentColor
                    )}
                  >
                    {getIcon(type)}
                  </div>

                  <span className="font-mono-tech text-xs font-bold px-2.5 py-1 rounded-full bg-card/90 border border-border/80 text-foreground shadow-2xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{count} {isRu ? "в наличии" : "owned"}</span>
                  </span>
                </div>

                {/* Title & Tagline */}
                <h3 className="font-black text-base text-foreground tracking-tight">
                  {isRu ? item.nameRu : item.nameEn}
                </h3>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  {isRu ? item.taglineRu : item.taglineEn}
                </p>

                {/* Description */}
                <p className="text-xs text-muted-foreground/90 mt-2.5 leading-relaxed font-normal">
                  {isRu ? item.descriptionRu : item.descriptionEn}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3.5 border-t border-border/50 space-y-2">
                <Button
                  onClick={() => handleBuy(type)}
                  disabled={isBuying || !canAfford}
                  className="w-full h-10 rounded-xl bg-foreground text-background font-mono-tech text-xs uppercase font-extrabold tracking-wider shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>
                    {isBuying
                      ? isRu
                        ? "Покупка..."
                        : "Buying..."
                      : isRu
                      ? `Купить · ${item.cost} 💎`
                      : `Get · ${item.cost} 💎`}
                  </span>
                </Button>

                {/* Secondary Context Action */}
                {type === "fiftyFifty" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/exam-center")}
                    className="w-full h-8 rounded-lg text-[11px] font-bold gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Play className="w-3 h-3" />
                    <span>{isRu ? "Использовать в тестах" : "Use in Practice"}</span>
                  </Button>
                )}

                {type === "desmosHacks" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/cheatsheet")}
                    className="w-full h-8 rounded-lg text-[11px] font-bold gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{isRu ? "Открыть шпаргалку" : "Open Cheatsheet"}</span>
                  </Button>
                )}

                {type === "similarDrills" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDemoSimilarOpen(true)}
                    className="w-full h-8 rounded-lg text-[11px] font-bold gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isRu ? "Сгенерировать демо-задачу" : "Launch AI Generator"}</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo Similar Question Sheet */}
      <SolveSimilarDialog
        open={demoSimilarOpen}
        onOpenChange={setDemoSimilarOpen}
        originalQuestion={DEMO_SAT_QUESTION}
      />
    </div>
  );
};
