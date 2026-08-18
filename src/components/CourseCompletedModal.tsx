import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Gem, Zap, Crown } from "lucide-react";

interface CourseCompletedModalProps {
  open: boolean;
  onClose: () => void;
}

const GoldenConfetti = () => {
  const [particles] = useState(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 10,
      color: [
        "hsl(45 90% 55%)",
        "hsl(45 95% 65%)",
        "hsl(35 90% 50%)",
        "hsl(50 85% 60%)",
        "hsl(40 100% 50%)",
        "hsl(0 0% 95%)",
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

const CourseCompletedModal = ({ open, onClose }: CourseCompletedModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <>
      {showConfetti && <GoldenConfetti />}
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-sm text-center border-none bg-gradient-to-b from-[hsl(45,90%,55%,0.1)] via-card to-background shadow-2xl">
          <div className="space-y-5 py-4">
            {/* Golden certificate */}
            <div className="relative mx-auto w-28 h-28">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(45,90%,55%)] to-[hsl(35,85%,45%)] animate-pulse opacity-30" />
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[hsl(45,95%,65%)] to-[hsl(40,90%,50%)] flex items-center justify-center shadow-lg">
                <Crown className="w-12 h-12 text-[hsl(220,20%,15%)]" />
              </div>
              <Award className="absolute -bottom-1 -right-1 w-10 h-10 text-[hsl(45,90%,55%)] drop-shadow-lg" />
            </div>

            <div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-[hsl(45,90%,55%)] to-[hsl(35,85%,45%)] bg-clip-text text-transparent">
                SAT Master! 👑
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                You've completed all 9 units. You are truly prepared!
              </p>
            </div>

            {/* Golden Certificate visual */}
            <div className="border-2 border-[hsl(45,90%,55%,0.4)] rounded-xl p-4 bg-gradient-to-b from-[hsl(45,90%,55%,0.05)] to-transparent">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(45,90%,55%)]">Certificate of Completion</p>
              <p className="text-xs text-muted-foreground mt-1">SAT Preparation Course</p>
              <div className="w-16 h-0.5 bg-[hsl(45,90%,55%,0.4)] mx-auto my-2" />
              <p className="text-xs font-bold">All 9 Units Mastered</p>
            </div>

            <div className="flex justify-center gap-4">
              <div className="bg-[hsl(45,90%,55%,0.1)] rounded-xl px-4 py-3 text-center">
                <Crown className="w-5 h-5 text-[hsl(45,90%,55%)] mx-auto mb-1" />
                <p className="text-sm font-black text-[hsl(45,90%,55%)]">SAT Master</p>
                <p className="text-[10px] font-bold text-muted-foreground">PROFILE FRAME</p>
              </div>
              <div className="bg-gem/10 rounded-xl px-4 py-3 text-center">
                <Gem className="w-5 h-5 text-gem mx-auto mb-1" />
                <p className="text-sm font-black text-gem">50% OFF</p>
                <p className="text-[10px] font-bold text-muted-foreground">MOCK TESTS</p>
              </div>
            </div>

            <Button onClick={onClose} className="w-full h-12 font-bold text-base bg-gradient-to-r from-[hsl(45,90%,55%)] to-[hsl(35,85%,45%)] text-[hsl(220,20%,10%)] hover:opacity-90">
              Claim Rewards 🏆
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CourseCompletedModal;
