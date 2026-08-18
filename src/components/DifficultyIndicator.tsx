import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DifficultyIndicatorProps {
  difficulty: "easy" | "medium" | "hard";
  changed: "up" | "down" | null;
}

const DifficultyIndicator = ({ difficulty, changed }: DifficultyIndicatorProps) => {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "text-xs font-bold px-2 py-0.5 rounded-full transition-all duration-300",
          difficulty === "easy" && "bg-primary/15 text-primary",
          difficulty === "medium" && "bg-accent/15 text-accent",
          difficulty === "hard" && "bg-destructive/15 text-destructive"
        )}
      >
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
      {changed && (
        <span
          className={cn(
            "flex items-center gap-0.5 text-xs font-bold animate-bounce-in",
            changed === "up" ? "text-destructive" : "text-primary"
          )}
        >
          {changed === "up" ? (
            <><TrendingUp className="w-3.5 h-3.5" /> ↑</>
          ) : (
            <><TrendingDown className="w-3.5 h-3.5" /> ↓</>
          )}
        </span>
      )}
    </div>
  );
};

export default DifficultyIndicator;
