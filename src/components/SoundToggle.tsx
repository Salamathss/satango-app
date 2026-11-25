import React, { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, toggleSound, playClickSound } from "@/utils/audio";

interface SoundToggleProps {
  className?: string;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ className = "" }) => {
  const [enabled, setEnabled] = useState<boolean>(() => isSoundEnabled());

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setEnabled(custom.detail);
    };

    window.addEventListener("satango_sound_toggled", handleToggle);
    return () => {
      window.removeEventListener("satango_sound_toggled", handleToggle);
    };
  }, []);

  const handleClick = () => {
    const next = toggleSound();
    setEnabled(next);
    if (next) {
      playClickSound();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={enabled ? "Выключить звук интерфейса" : "Включить звук интерфейса"}
      title={enabled ? "Звуковые эффекты: Включены" : "Звуковые эффекты: Выключены"}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md border border-border/70 bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted/60 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted disabled:opacity-50 disabled:pointer-events-none shadow-2xs ${className}`}
    >
      {enabled ? (
        <Volume2 className="w-3.5 h-3.5 text-foreground" />
      ) : (
        <VolumeX className="w-3.5 h-3.5 text-muted-foreground/60" />
      )}
    </button>
  );
};
