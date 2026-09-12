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
    <div className="relative overflow-hidden rounded-3xl bg-card/90 dark:bg-[#171615]/90 backdrop-blur-xl border border-border/80 dark:border-white/[0.12] p-5 shadow-sm space-y-3 transition-all">
      {/* Background subtle gold aura */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {language === "ru" ? "ФИЛОСОФИЯ ТОЧНОСТИ" : "PRINCIPLE OF MASTERY"}
          </span>
        </div>

        {targetScore && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 dark:bg-white/5 border border-primary/20 dark:border-white/10 text-primary dark:text-neutral-200 font-mono-tech text-xs font-bold">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>{targetScore}+ SAT</span>
          </div>
        )}
      </div>

      <p className="text-sm font-medium italic text-foreground/90 leading-relaxed font-serif">
        "{language === "ru" ? quote.ru : quote.en}"
      </p>

      <div className="flex justify-between items-center pt-2 border-t border-border/60 dark:border-white/10 text-[10px] font-mono-tech text-muted-foreground">
        <span className="font-semibold text-foreground/70">— {quote.author}</span>
        <span className="opacity-70 uppercase tracking-widest">
          {language === "ru" ? "ЕЖЕДНЕВНАЯ УСТАНОВКА" : "DAILY MINDSET"}
        </span>
      </div>
    </div>
  );
};

export default DailyWisdom;
