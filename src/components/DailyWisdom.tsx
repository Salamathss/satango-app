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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/70 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400/80 dark:hover:border-zinc-700 p-5 sm:p-6 shadow-xs hover:shadow-md space-y-3.5 transition-all group">
      {/* Background subtle depth */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-zinc-200/30 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300 font-bold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-xs">
            {language === "ru" ? "ФИЛОСОФИЯ ТОЧНОСТИ" : "PRINCIPLE OF MASTERY"}
          </span>
        </div>

        {targetScore && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground font-mono-tech text-xs font-bold shadow-xs">
            <Target className="w-3.5 h-3.5 text-zinc-500" />
            <span>{targetScore}+ SAT</span>
          </div>
        )}
      </div>

      <div className="relative z-10 pl-3 border-l-2 border-zinc-300 dark:border-zinc-700">
        <p className="text-sm sm:text-[15px] font-medium italic text-foreground/90 leading-relaxed font-serif">
          «{language === "ru" ? quote.ru : quote.en}»
        </p>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-zinc-200/80 dark:border-zinc-800 text-[10px] font-mono-tech text-muted-foreground relative z-10">
        <span className="font-bold text-foreground/80">— {quote.author}</span>
        <span className="opacity-70 uppercase tracking-widest font-semibold">
          {language === "ru" ? "ЕЖЕДНЕВНАЯ УСТАНОВКА" : "DAILY MINDSET"}
        </span>
      </div>
    </div>
  );
};

export default DailyWisdom;
