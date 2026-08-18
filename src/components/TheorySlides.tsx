import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { TheoryCard, THEORY_CARDS } from "@/lib/theoryCards";
import { Button } from "@/components/ui/button";
import { BookOpen, Lightbulb, AlertTriangle, ChevronRight, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface TheorySlidesProps {
  topicId: string;
  topicName: string;
  topicIcon: string;
  onComplete: () => void;
}

const CARD_ICONS = {
  concept: BookOpen,
  example: Lightbulb,
  trap: AlertTriangle,
  desmos: Calculator,
};

const CARD_LABELS = {
  concept: "Key Concept",
  example: "Worked Example",
  trap: "SAT Trap Alert",
  desmos: "🎒 Desmos Shortcut",
};

const TheorySlides = ({ topicId, topicName, topicIcon, onComplete }: TheorySlidesProps) => {
  const [currentCard, setCurrentCard] = useState(0);
  const cards = THEORY_CARDS[topicId] || [];

  if (cards.length === 0) {
    onComplete();
    return null;
  }

  const card = cards[currentCard];
  const Icon = CARD_ICONS[card.type];
  const isLast = currentCard === cards.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-4xl block">{topicIcon}</span>
          <h1 className="text-2xl font-extrabold" style={{ lineHeight: "1.15" }}>{topicName}</h1>
          <p className="text-muted-foreground text-sm">Learn the concepts before practicing</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {cards.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                i === currentCard ? "bg-primary scale-125" : i < currentCard ? "bg-primary/40" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Theory card */}
        <div className="bg-card rounded-2xl p-6 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] border border-border space-y-4 animate-bounce-in">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              card.type === "concept" && "bg-primary/10 text-primary",
              card.type === "example" && "bg-accent/20 text-accent-foreground",
              card.type === "trap" && "bg-destructive/10 text-destructive",
              card.type === "desmos" && "bg-secondary text-secondary-foreground"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {CARD_LABELS[card.type]}
            </span>
          </div>

          <h3 className="text-lg font-extrabold">{card.title}</h3>

          <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground/85
            prose-headings:font-extrabold prose-headings:text-foreground prose-headings:mt-2 prose-headings:mb-1
            prose-h3:text-base prose-p:my-2
            prose-strong:text-foreground prose-strong:font-semibold
            prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
            prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{card.content}</ReactMarkdown>
          </div>
        </div>

        {/* Navigation */}
        <Button
          onClick={() => isLast ? onComplete() : setCurrentCard((c) => c + 1)}
          className="w-full h-12 font-bold text-base gap-2"
        >
          {isLast ? "Start Practice" : "Next"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TheorySlides;
