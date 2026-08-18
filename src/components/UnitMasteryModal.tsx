import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Gem, Zap } from "lucide-react";

interface UnitMasteryModalProps {
  open: boolean;
  onClose: () => void;
  unitName: string;
  unitIcon: string;
  colorAccent?: string;
}

const Confetti = () => {
  const [particles] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.5,
      size: 6 + Math.random() * 8,
      color: [
        "hsl(var(--primary))",
        "hsl(var(--accent))",
        "hsl(45 93% 58%)",
        "hsl(280 80% 60%)",
        "hsl(158 64% 52%)",
        "hsl(200 80% 60%)",
      ][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const UnitMasteryModal = ({ open, onClose, unitName, unitIcon, colorAccent }: UnitMasteryModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <>
      {showConfetti && <Confetti />}
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-sm text-center border-none bg-gradient-to-b from-card to-background shadow-2xl">
          <div className="space-y-5 py-4">
            <div className="relative mx-auto w-24 h-24">
              <div
                className="absolute inset-0 rounded-full animate-pulse opacity-30"
                style={{ backgroundColor: colorAccent ? `hsl(${colorAccent})` : "hsl(var(--primary))" }}
              />
              <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center shadow-lg">
                <span className="text-4xl">{unitIcon}</span>
              </div>
              <Trophy
                className="absolute -bottom-1 -right-1 w-8 h-8 text-yellow-500 drop-shadow-lg"
              />
            </div>

            <div>
              <h2 className="text-2xl font-black">Unit Mastered! 🏆</h2>
              <p className="text-muted-foreground text-sm mt-1">{unitName}</p>
            </div>

            <div className="flex justify-center gap-4">
              <div className="bg-primary/10 rounded-xl px-4 py-3 text-center">
                <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-black text-primary">+100</p>
                <p className="text-[10px] font-bold text-muted-foreground">BONUS XP</p>
              </div>
              <div className="bg-gem/10 rounded-xl px-4 py-3 text-center">
                <Gem className="w-5 h-5 text-gem mx-auto mb-1" />
                <p className="text-lg font-black text-gem">+100</p>
                <p className="text-[10px] font-bold text-muted-foreground">BONUS GEMS</p>
              </div>
            </div>

            <Button onClick={onClose} className="w-full h-12 font-bold text-base">
              Continue 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnitMasteryModal;
