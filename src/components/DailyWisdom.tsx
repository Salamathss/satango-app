import { useMemo } from "react";
import { Sparkles, Target } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const QUOTES = [
  {
    en: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    ru: "Мы то, что мы делаем постоянно. Совершенство — это не действие, а привычка.",
    author: "Aristotle",
  },
  {
    en: "Precision is not an accident; it is the discipline of reasoned mastery.",
    ru: "Точность — это не случайность, а дисциплина осознанного мастерства.",
    author: "Socrates",
  },
  {
    en: "Mastery is built error by error, until precision becomes second nature.",
    ru: "Мастерство строится ошибка за ошибкой, пока точность не станет интуицией.",
    author: "SAT Strategy",
  },
  {
    en: "Focus on the process of reasoning, and the score will follow inevitably.",
    ru: "Сосредоточься на логике рассуждений, и нужный балл придет неизбежно.",
    author: "Stoic Wisdom",
  },
];

interface DailyWisdomProps {
  targetScore?: number | null;
}

const DailyWisdom = ({ targetScore = 1500 }: DailyWisdomProps) => {
  const { language } = useLanguage();

  const quote = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border/80 hover:border-amber-500/40 p-5 sm:p-6 shadow-2xs hover:shadow-xs space-y-3.5 transition-all group">
      {/* Background subtle amber depth */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-2xs">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-amber-800 dark:text-amber-300 font-black bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30 shadow-2xs">
            {language === "ru" ? "ФИЛОСОФИЯ ТОЧНОСТИ" : "PRINCIPLE OF MASTERY"}
          </span>
        </div>

        {targetScore && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 border border-border/70 text-foreground font-mono-tech text-xs font-black shadow-2xs">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>{targetScore}+ SAT</span>
          </div>
        )}
      </div>

      <div className="relative z-10 space-y-1 pl-1">
        <blockquote className="text-sm sm:text-base text-foreground font-serif italic leading-relaxed">
          «{language === "ru" ? quote.ru : quote.en}»
        </blockquote>
        <p className="text-[11px] font-mono-tech text-muted-foreground font-bold uppercase tracking-wider">
          — {quote.author}
        </p>
      </div>
    </div>
  );
};

export default DailyWisdom;
