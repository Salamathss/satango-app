import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Lock, FileText, BookOpen, Calculator, AlertTriangle, Gem, Sparkles, Clock, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface ExamType {
  id: "full" | "rw" | "math";
  title: string;
  subtitle: string;
  questions: number;
  duration: string;
  durationMin: number;
  cost: number;
  ticketField: "full_exam_tickets" | "section_exam_tickets";
  icon: React.ReactNode;
  gradient: string;
  categories: string[];
}

const EXAM_TYPES: ExamType[] = [
  {
    id: "full",
    title: "Full SAT Exam",
    subtitle: "Complete Digital SAT simulation",
    questions: 98,
    duration: "2 hrs 14 min",
    durationMin: 134,
    cost: 850,
    ticketField: "full_exam_tickets",
    icon: <FileText className="w-8 h-8" />,
    gradient: "from-[hsl(var(--gem))] to-[hsl(300,75%,50%)]",
    categories: ["reading_writing", "math"],
  },
  {
    id: "rw",
    title: "Reading & Writing",
    subtitle: "54 questions · Module 1 & 2",
    questions: 54,
    duration: "64 min",
    durationMin: 64,
    cost: 400,
    ticketField: "section_exam_tickets",
    icon: <BookOpen className="w-8 h-8" />,
    gradient: "from-[hsl(var(--secondary))] to-[hsl(240,80%,55%)]",
    categories: ["reading_writing"],
  },
  {
    id: "math",
    title: "Math Section",
    subtitle: "44 questions · Module 1 & 2",
    questions: 44,
    duration: "70 min",
    durationMin: 70,
    cost: 400,
    ticketField: "section_exam_tickets",
    icon: <Calculator className="w-8 h-8" />,
    gradient: "from-[hsl(var(--primary))] to-[hsl(180,60%,40%)]",
    categories: ["math"],
  },
];

const ExamCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmExam, setConfirmExam] = useState<ExamType | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const { data: progress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Check merit discount: >90% accuracy overall
  const { data: accuracyData } = useQuery({
    queryKey: ["user-accuracy", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_answers")
        .select("is_correct")
        .eq("user_id", user.id);
      if (!data || data.length < 10) return null;
      const correct = data.filter((a) => a.is_correct).length;
      return { accuracy: correct / data.length, total: data.length };
    },
    enabled: !!user,
  });

  // Check SAT Master (all 9 modules completed) for lifetime 50% discount
  const { data: moduleProgress } = useQuery({
    queryKey: ["module-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("module_progress")
        .select("module, is_completed")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const isSATMaster = moduleProgress && moduleProgress.length >= 9 &&
    [1,2,3,4,5,6,7,8,9].every(id => moduleProgress.find((mp: any) => mp.module === id && mp.is_completed));

  const hasScholarship = accuracyData && accuracyData.accuracy >= 0.9;
  const discountRate = isSATMaster ? 0.5 : (hasScholarship ? 0.2 : 0);
  const discountLabel = isSATMaster ? "👑 SAT Master -50%" : "🎓 -20%";

  const gems = progress?.gems ?? 0;

  const getTickets = (exam: ExamType): number => {
    if (!progress) return 0;
    return (progress as any)[exam.ticketField] ?? 0;
  };

  const getDiscountedCost = (exam: ExamType): number => {
    return Math.round(exam.cost * (1 - discountRate));
  };

  const handlePurchase = async (exam: ExamType) => {
    if (!user || !progress) return;
    const expectedCost = getDiscountedCost(exam);
    if (gems < expectedCost) {
      toast.error(`Not enough gems! You need ${expectedCost} gems.`);
      return;
    }

    setPurchasing(exam.id);

    // Cost & discount are computed server-side; we only pass item + quantity.
    const { data, error } = await (supabase as any).rpc("up_purchase_item", {
      _item: exam.ticketField,
      _quantity: 1,
    });

    setPurchasing(null);

    if (error || !(data as any)?.ok) {
      toast.error("Purchase failed. Try again.");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    toast.success(`${exam.title} ticket purchased! 🎫${isSATMaster ? " (50% SAT Master discount!)" : hasScholarship ? " (20% Scholarship applied!)" : ""}`);
  };

  const handleStartExam = async (exam: ExamType) => {
    const tickets = getTickets(exam);
    if (tickets <= 0) {
      toast.error("You need a ticket! Purchase one first.");
      return;
    }

    // Consume ticket
    await (supabase as any).rpc("up_consume_ticket", { _ticket: exam.ticketField });

    queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    setConfirmExam(null);
    navigate(`/mock-exam?type=${exam.id}`);
  };

  return (
    <AppShell title="Exam Hall">
      <main className="space-y-6 animate-spring-in">
        <div className="border-b border-border/60 pb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono-tech text-[10px] uppercase tracking-widest font-extrabold text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              CAMPUS EXAMINATION HALL // DIGITAL SAT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Exam Hall 📝</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium leading-relaxed">
            Официальный формат Digital SAT: адаптивные модули, таймер College Board и встроенный калькулятор Desmos.
          </p>
        </div>

        <div className="space-y-4">
          {EXAM_TYPES.map((exam) => {
            const tickets = getTickets(exam);
            const hasTicket = tickets > 0;

            const iconColors = {
              full: "from-amber-400 to-amber-600 text-neutral-950 shadow-amber-500/25",
              rw: "from-violet-500 to-indigo-600 text-white shadow-violet-500/25",
              math: "from-sky-500 to-cyan-600 text-white shadow-sky-500/25",
            };

            return (
              <div
                key={exam.id}
                className={cn(
                  "relative rounded-3xl border overflow-hidden transition-all duration-200 shadow-2xs hover:shadow-md",
                  hasTicket
                    ? "border-border/80 bg-card hover:bg-card/90"
                    : "border-border/60 bg-card/60 hover:bg-card/80"
                )}
              >
                {/* Header gradient bar */}
                <div
                  className={cn(
                    "h-1.5 bg-gradient-to-r",
                    exam.id === "full"
                      ? "from-amber-500 via-amber-400 to-amber-600"
                      : exam.id === "rw"
                      ? "from-violet-500 to-indigo-600"
                      : "from-sky-500 to-cyan-600"
                  )}
                />

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shrink-0 shadow-md",
                        iconColors[exam.id]
                      )}
                    >
                      {exam.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg text-foreground">{exam.title}</h3>
                        {exam.id === "full" && (
                          <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono-tech text-[9px] uppercase font-black px-2 py-0.5 rounded border border-amber-500/30">
                            FULL TEST
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">{exam.subtitle}</p>
                    </div>

                    {hasTicket && (
                      <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-xl px-3 py-1 text-xs font-mono-tech font-black shrink-0 shadow-2xs">
                        {tickets} {tickets === 1 ? "билет" : "билета"}
                      </span>
                    )}
                  </div>

                  {/* Info chips */}
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground pt-1 border-t border-border/50">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      {exam.questions} вопросов
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Clock className="w-4 h-4 text-sky-500" />
                      {exam.duration}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {hasTicket ? (
                      <Button
                        onClick={() => setConfirmExam(exam)}
                        className={cn(
                          "flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-wider gap-2 shadow-md tap-feedback",
                          exam.id === "full"
                            ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/25"
                            : "bg-foreground text-background hover:opacity-90"
                        )}
                      >
                        <span>Начать экзамен</span>
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePurchase(exam)}
                        disabled={gems < getDiscountedCost(exam) || purchasing === exam.id}
                        variant="outline"
                        className="flex-1 h-12 rounded-2xl font-mono-tech font-extrabold text-xs uppercase tracking-wider gap-2 border-border/80 hover:bg-muted/70 tap-feedback"
                      >
                        {purchasing === exam.id ? (
                          <span className="animate-pulse">Оформление...</span>
                        ) : (
                          <>
                            {gems < getDiscountedCost(exam) ? <Lock className="w-4 h-4" /> : <Gem className="w-4 h-4 text-gem" />}
                            {hasScholarship && (
                              <span className="line-through text-muted-foreground mr-1">{exam.cost}</span>
                            )}
                            {getDiscountedCost(exam)} Gems
                            {(isSATMaster || hasScholarship) && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1">{discountLabel}</span>
                            )}
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Gem progress hint */}
                  {!hasTicket && gems < getDiscountedCost(exam) && (
                    <div className="text-xs text-muted-foreground font-semibold">
                      You need <span className="text-gem font-bold">{getDiscountedCost(exam) - gems} more gems</span> for this exam
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Discount notice */}
        {isSATMaster && (
          <div className="bg-gradient-to-r from-[hsl(45,90%,55%,0.1)] to-[hsl(35,85%,45%,0.1)] border border-[hsl(45,90%,55%,0.3)] rounded-xl px-4 py-2.5 text-sm font-semibold text-[hsl(45,90%,55%)] text-center">
            👑 SAT Master Discount! 50% off all exams forever
          </div>
        )}
        {!isSATMaster && hasScholarship && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary text-center">
            🎓 Merit Scholarship Active! 20% off all exams (90%+ accuracy)
          </div>
        )}

        {/* Gem balance footer */}
        <div className="text-center text-sm text-muted-foreground font-semibold">
          <Gem className="w-4 h-4 inline-block text-gem mr-1" />
          You have <span className="text-gem font-bold">{gems}</span> gems
        </div>
      </main>

      {/* Warning dialog before starting */}
      <Dialog open={!!confirmExam} onOpenChange={() => setConfirmExam(null)}>
        <DialogContent className="max-w-sm border-0 bg-background/80 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-accent" />
              Ready to begin?
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p className="font-semibold text-foreground">
                This is a timed exam. Once started, you cannot pause.
              </p>
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li>• <strong>{confirmExam?.questions}</strong> questions</li>
                <li>• <strong>{confirmExam?.duration}</strong> time limit</li>
                <li>• Auto-submits when time runs out</li>
                <li>• This will consume <strong>1 ticket</strong></li>
              </ul>
              <p className="text-xs text-muted-foreground">
                Make sure you have enough uninterrupted time before starting.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmExam(null)} className="flex-1 font-bold">
              Cancel
            </Button>
            <Button
              onClick={() => confirmExam && handleStartExam(confirmExam)}
              className="flex-1 font-bold"
            >
              Begin Exam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default ExamCenter;
