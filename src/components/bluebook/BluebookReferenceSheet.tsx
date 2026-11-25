// src/components/bluebook/BluebookReferenceSheet.tsx
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface BluebookReferenceSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BluebookReferenceSheet = ({
  isOpen,
  onClose,
}: BluebookReferenceSheetProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] p-0 flex flex-col bg-white text-slate-800 border border-neutral-300 rounded-lg overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
          <div>
            <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
              SAT Math Reference Sheet
            </DialogTitle>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Official formulas provided for the Digital SAT Math section
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Reference Sheet"
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-neutral-200 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 active:bg-neutral-300 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Formulas Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-sm text-slate-800 leading-relaxed">
          {/* Section 1: 2D Geometry */}
          <div>
            <h4 className="font-bold text-xs text-slate-700 mb-3 border-b border-neutral-200 pb-1">
              2D shapes and formulas
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {/* Circle */}
              <div className="p-3 border border-neutral-200 rounded-md bg-neutral-50/50 flex flex-col items-center">
                <svg aria-hidden="true" className="w-16 h-16 text-slate-700 my-1" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="50" cy="50" r="38" />
                  <line x1="50" y1="50" x2="88" y2="50" strokeDasharray="3 3" />
                  <text x="66" y="44" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">r</text>
                  <circle cx="50" cy="50" r="2" fill="currentColor" />
                </svg>
                <span className="font-serif font-bold text-xs mt-1">A = πr²</span>
                <span className="font-serif text-xs text-slate-600">C = 2πr</span>
              </div>

              {/* Rectangle */}
              <div className="p-3 border border-neutral-200 rounded-md bg-neutral-50/50 flex flex-col items-center">
                <svg aria-hidden="true" className="w-16 h-16 text-slate-700 my-1" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="15" y="30" width="70" height="40" />
                  <text x="48" y="24" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">l</text>
                  <text x="89" y="54" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">w</text>
                </svg>
                <span className="font-serif font-bold text-xs mt-1">A = lw</span>
              </div>

              {/* Triangle */}
              <div className="p-3 border border-neutral-200 rounded-md bg-neutral-50/50 flex flex-col items-center">
                <svg aria-hidden="true" className="w-16 h-16 text-slate-700 my-1" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="20,75 80,75 60,25" />
                  <line x1="60" y1="25" x2="60" y2="75" strokeDasharray="3 3" />
                  <text x="48" y="88" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">b</text>
                  <text x="64" y="55" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">h</text>
                </svg>
                <span className="font-serif font-bold text-xs mt-1">A = ½bh</span>
              </div>

              {/* Pythagorean theorem */}
              <div className="p-3 border border-neutral-200 rounded-md bg-neutral-50/50 flex flex-col items-center">
                <svg aria-hidden="true" className="w-16 h-16 text-slate-700 my-1" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="25,75 75,75 25,25" />
                  <rect x="25" y="65" width="10" height="10" />
                  <text x="48" y="88" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">a</text>
                  <text x="12" y="55" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">b</text>
                  <text x="56" y="46" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">c</text>
                </svg>
                <span className="font-serif font-bold text-xs mt-1">c² = a² + b²</span>
              </div>
            </div>
          </div>

          {/* Section 2: Special Right Triangles */}
          <div>
            <h4 className="font-bold text-xs text-slate-700 mb-3 border-b border-neutral-200 pb-1">
              Special right triangles
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 30-60-90 */}
              <div className="p-4 border border-neutral-200 rounded-md bg-neutral-50/50 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-900 mb-1">30°-60°-90° Triangle</h5>
                  <p className="text-xs text-slate-600 font-serif">Short leg = x</p>
                  <p className="text-xs text-slate-600 font-serif">Long leg = x√3</p>
                  <p className="text-xs text-slate-600 font-serif">Hypotenuse = 2x</p>
                </div>
                <svg aria-hidden="true" className="w-24 h-20 text-slate-700 shrink-0" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="20,80 100,80 20,20" />
                  <rect x="20" y="70" width="10" height="10" />
                  <text x="55" y="93" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif">x√3</text>
                  <text x="6" y="55" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif">x</text>
                  <text x="65" y="46" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif">2x</text>
                  <text x="24" y="32" fontSize="10" fill="currentColor" stroke="none">30°</text>
                  <text x="80" y="75" fontSize="10" fill="currentColor" stroke="none">60°</text>
                </svg>
              </div>

              {/* 45-45-90 */}
              <div className="p-4 border border-neutral-200 rounded-md bg-neutral-50/50 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-900 mb-1">45°-45°-90° Triangle</h5>
                  <p className="text-xs text-slate-600 font-serif">Leg = s</p>
                  <p className="text-xs text-slate-600 font-serif">Leg = s</p>
                  <p className="text-xs text-slate-600 font-serif">Hypotenuse = s√2</p>
                </div>
                <svg aria-hidden="true" className="w-24 h-20 text-slate-700 shrink-0" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="25,80 85,80 25,20" />
                  <rect x="25" y="70" width="10" height="10" />
                  <text x="50" y="93" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif">s</text>
                  <text x="12" y="55" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif">s</text>
                  <text x="62" y="46" fontSize="12" fill="currentColor" stroke="none" fontFamily="serif">s√2</text>
                  <text x="30" y="34" fontSize="10" fill="currentColor" stroke="none">45°</text>
                  <text x="68" y="75" fontSize="10" fill="currentColor" stroke="none">45°</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Section 3: 3D Solids Volume */}
          <div>
            <h4 className="font-bold text-xs text-slate-700 mb-3 border-b border-neutral-200 pb-1">
              3D solids and volume
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              {/* Rectangular prism */}
              <div className="p-2.5 border border-neutral-200 rounded-md bg-neutral-50/50 flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-700 mb-1">Rectangular Prism</span>
                <span className="font-serif font-bold text-xs mt-auto">V = lwh</span>
              </div>

              {/* Cylinder */}
              <div className="p-2.5 border border-neutral-200 rounded-md bg-neutral-50/50 flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-700 mb-1">Right Cylinder</span>
                <span className="font-serif font-bold text-xs mt-auto">V = πr²h</span>
              </div>

              {/* Sphere */}
              <div className="p-2.5 border border-neutral-200 rounded-md bg-neutral-50/50 flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-700 mb-1">Sphere</span>
                <span className="font-serif font-bold text-xs mt-auto">V = ⁴⁄₃πr³</span>
              </div>

              {/* Cone */}
              <div className="p-2.5 border border-neutral-200 rounded-md bg-neutral-50/50 flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-700 mb-1">Right Cone</span>
                <span className="font-serif font-bold text-xs mt-auto">V = ⅓πr²h</span>
              </div>

              {/* Pyramid */}
              <div className="p-2.5 border border-neutral-200 rounded-md bg-neutral-50/50 flex flex-col items-center col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-slate-700 mb-1">Pyramid</span>
                <span className="font-serif font-bold text-xs mt-auto">V = ⅓lwh</span>
              </div>
            </div>
          </div>

          {/* Section 4: Key Angular Facts */}
          <div className="p-3.5 bg-neutral-50 rounded-md border border-neutral-200 text-xs text-slate-700 space-y-1 font-sans">
            <p>• The number of degrees of arc in a circle is <strong>360</strong>.</p>
            <p>• The number of radians of arc in a circle is <strong>2π</strong>.</p>
            <p>• The sum of the measures in degrees of the angles of a triangle is <strong>180</strong>.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BluebookReferenceSheet;
