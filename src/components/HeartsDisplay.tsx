import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeartsDisplayProps {
  hearts: number;
  maxHearts: number;
  compact?: boolean;
}

const HeartsDisplay = ({ hearts, maxHearts, compact = false }: HeartsDisplayProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-destructive">
        <Heart className={cn("w-4 h-4 fill-current", hearts <= 2 && "animate-pulse")} />
        <span className="font-bold text-sm">{hearts}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxHearts }).map((_, i) => (
        <Heart
          key={i}
          className={cn(
            "w-5 h-5 transition-all duration-300",
            i < hearts
              ? "text-destructive fill-destructive"
              : "text-muted-foreground/30",
            hearts <= 2 && i < hearts && "animate-pulse"
          )}
        />
      ))}
    </div>
  );
};

export default HeartsDisplay;
