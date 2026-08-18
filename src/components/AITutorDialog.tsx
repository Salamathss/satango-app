import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { fetchAITutorExplanation, buildFallbackExplanation } from "@/services/aiTutor";
import ReactMarkdown from "react-markdown";
import { useAITutorLimit } from "@/hooks/useAITutorLimit";
import { useAuth } from "@/hooks/useAuth";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";

interface AITutorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: {
    question_text: string;
    options: string[];
    correct_answer: number;
    explanation?: string;
  } | null;
  userSelectedAnswer?: number | null;
  userLevel?: number;
}

const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-md bg-muted border border-divider flex items-center justify-center">
        <Terminal className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="space-y-1.5 flex-1">
        <div className="h-2.5 bg-muted rounded-sm w-3/4" />
        <div className="h-2 bg-muted rounded-sm w-1/2" />
      </div>
    </div>
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-1.5">
        <div className="h-2.5 bg-muted rounded-sm" style={{ width: `${85 - i * 10}%` }} />
        <div className="h-2.5 bg-muted rounded-sm" style={{ width: `${70 - i * 5}%` }} />
      </div>
    ))}
  </div>
);

const AITutorDialog = ({ open, onOpenChange, question, userSelectedAnswer, userLevel = 1 }: AITutorDialogProps) => {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { canUse, remaining, limit, isPremium } = useAITutorLimit();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (open && !explanation && question) {
      if (!canUse) {
        setShowPaywall(true);
        onOpenChange(false);
        return;
      }
      fetchExplanation();
    }
    if (!open) {
      setExplanation("");
    }
  }, [open]);

  const fetchExplanation = async () => {
    if (!question) return;
    setLoading(true);
    try {
      const { explanation: text, quotaExceeded } = await fetchAITutorExplanation({
        question: question.question_text,
        options: question.options,
        correctAnswer: question.correct_answer,
        userAnswer: userSelectedAnswer ?? undefined,
        userLevel,
      });
      if (quotaExceeded) {
        setShowPaywall(true);
        onOpenChange(false);
        return;
      }
      setExplanation(text);
    } catch {
      setExplanation(
        buildFallbackExplanation(question.options, question.correct_answer, question.explanation)
      );
    } finally {
      // Refresh quota counter so the badge updates after a server-side consume.
      if (user) queryClient.invalidateQueries({ queryKey: ["ai-tutor-usage", user.id] });
      setLoading(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-lg max-h-[85vh] overflow-y-auto hairline-t bg-background backdrop-blur-xl shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.18)]"
        >
          <SheetHeader className="pb-3 hairline-b">
            <SheetTitle className="flex items-center gap-2.5 font-bold text-base">
              <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center">
                <Terminal className="w-4 h-4" strokeWidth={2.25} />
              </div>
              <span className="font-mono-tech tracking-[0.12em] uppercase text-[13px]">
                AI Tutor
              </span>
              {!isPremium && (
                <span className="status-pill ml-auto">
                  {Math.max(0, remaining)}/{limit} today
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pt-4">
            <div className="border border-divider rounded-md p-3.5 text-sm bg-card">
              <p className="tech-label mb-1.5">// Question</p>
              <p className="text-foreground leading-relaxed">{question?.question_text}</p>
            </div>

            {userSelectedAnswer !== null && userSelectedAnswer !== undefined && question && (
              <div className="flex items-center gap-2 text-sm">
                <span className="status-pill border-destructive/40 text-destructive">
                  YOU: {String.fromCharCode(65 + userSelectedAnswer)}
                </span>
                <span className="status-pill">
                  ✓ KEY: {String.fromCharCode(65 + question.correct_answer)}
                </span>
              </div>
            )}

            {loading ? (
              <SkeletonLoader />
            ) : (
              <div className="surface-card p-4">
                <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed prose-headings:font-bold prose-headings:tracking-tight prose-code:font-mono-tech prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none">
                  <ReactMarkdown>{explanation}</ReactMarkdown>
                </div>
              </div>
            )}

            <Button
              onClick={() => onOpenChange(false)}
              className="w-full h-11 font-semibold text-sm rounded-md font-mono-tech tracking-[0.12em] uppercase"
            >
              Continue
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <PremiumUpgradeModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        reason={`You've used all ${limit} free AI Tutor sessions today. Upgrade to Satango Plus for unlimited Socratic guidance.`}
      />
    </>
  );
};

export default AITutorDialog;
