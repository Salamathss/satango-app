import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";

interface DesmosCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesmosCalculator = ({ isOpen, onClose }: DesmosCalculatorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if ((window as any).Desmos) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById("desmos-calculator-script");
    if (existingScript) {
      const handleLoad = () => setScriptLoaded(true);
      existingScript.addEventListener("load", handleLoad);
      return () => {
        existingScript.removeEventListener("load", handleLoad);
      };
    }

    const script = document.createElement("script");
    script.id = "desmos-calculator-script";
    script.src = "https://www.desmos.com/api/v1.8/calculator.js?apiKey=d3a2a36339a7a187a0bab3b2b1500d72";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {};
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scriptLoaded && containerRef.current && (window as any).Desmos) {
      if (!calcRef.current) {
        calcRef.current = (window as any).Desmos.GraphingCalculator(containerRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
          zoomButtons: true,
        });
      }
    }

    return () => {
      if (!isOpen && calcRef.current) {
        calcRef.current.destroy();
        calcRef.current = null;
      }
    };
  }, [isOpen, scriptLoaded]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden bg-background border rounded-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <DialogTitle className="text-base font-extrabold flex items-center gap-2">
            <span>🧮</span> Desmos Graphing Calculator
          </DialogTitle>
          <DialogDescription className="sr-only">
            Interactive Desmos Graphing Calculator for solving math problems
          </DialogDescription>
          <button 
            onClick={onClose}
            className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 relative bg-white">
          {!scriptLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
