import { useEffect, useState } from "react";
import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface GemAnimationProps {
  amount: number;
  show: boolean;
  onDone: () => void;
}

const GemAnimation = ({ amount, show, onDone }: GemAnimationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 2000);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <div className={cn(
        "bg-card/90 backdrop-blur-xl border border-gem/30 rounded-3xl px-8 py-6 shadow-[0_0_40px_-8px_hsl(var(--gem)/0.5)] text-center",
        "animate-bounce-in"
      )}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gem className="w-10 h-10 text-gem animate-float" />
        </div>
        <p className="text-3xl font-black text-gem">+{amount}</p>
        <p className="text-sm font-bold text-muted-foreground mt-1">Gems Earned!</p>
      </div>
    </div>
  );
};

export default GemAnimation;
