import { cn } from "@/lib/utils";

interface ComplexityMeterProps {
  level: number; // 1=Foundation, 2=Standard, 3=Advanced
}

const labels = ["Foundation", "Standard", "Advanced"];

const ComplexityMeter = ({ level }: ComplexityMeterProps) => {
  const clampedLevel = Math.max(1, Math.min(3, level));

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Complexity</span>
      <div className="flex items-center gap-1">
        {labels.map((label, i) => {
          const step = i + 1;
          const isActive = step <= clampedLevel;
          const isCurrent = step === clampedLevel;
          return (
            <div key={label} className="flex items-center gap-1">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  isCurrent ? "w-8" : "w-4",
                  isActive
                    ? step === 1
                      ? "bg-primary"
                      : step === 2
                        ? "bg-accent"
                        : "bg-destructive"
                    : "bg-muted"
                )}
              />
            </div>
          );
        })}
      </div>
      <span
        className={cn(
          "text-xs font-bold transition-colors duration-300",
          clampedLevel === 1 && "text-primary",
          clampedLevel === 2 && "text-accent",
          clampedLevel === 3 && "text-destructive"
        )}
      >
        {labels[clampedLevel - 1]}
      </span>
    </div>
  );
};

export default ComplexityMeter;
