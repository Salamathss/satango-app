import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface DesmosCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesmosCalculator = ({ isOpen, onClose }: DesmosCalculatorProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden bg-background border rounded-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <DialogTitle className="text-base font-extrabold flex items-center gap-2">
            <span>🧮</span> Desmos Digital SAT Calculator
          </DialogTitle>
          <DialogDescription className="sr-only">
            Official Digital SAT Desmos Graphing Calculator
          </DialogDescription>
          <button 
            onClick={onClose}
            className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 w-full h-[500px] min-h-[400px] relative bg-white">
          <iframe 
            src="https://www.desmos.com/testing/cb-digital-sat/graphing" 
            className="w-full h-full border-0 rounded-b-2xl"
            title="Desmos SAT Calculator"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
