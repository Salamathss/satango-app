import { useNavigate } from "react-router-dom";
import {
  FileText,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Swords,
  BookOpen,
  Calculator,
  ShieldAlert,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface CommandHubProps {
  errorCount: number;
}

export const CommandHub = ({ errorCount }: CommandHubProps) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const quickTools = [
    {
      title: t("battleArena"),
      desc: language === "ru" ? "1v1 Дуэль" : "1v1 Battle",
      icon: Swords,
      path: "/battle",
      color: "text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
    },
    {
      title: t("vocab"),
      desc: language === "ru" ? "1000+ слов" : "SAT Vocab",
      icon: BookOpen,
      path: "/vocabulary",
      color: "text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
    },
    {
      title: t("calculator"),
      desc: language === "ru" ? "Шкала 1600" : "1600 Score",
      icon: Calculator,
      path: "/score-calculator",
      color: "text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
    },
  ];

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between px-1">
        <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
          // {language === "ru" ? "КОМАНДНЫЙ ЦЕНТР И РЕЖИМЫ" : "COMMAND HUB & MODES"}
        </span>
        <span className="font-mono-tech text-[10px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-xs">
          FAST LAUNCH
        </span>
      </div>

      {/* Main Grid: Exam Hall (and Error Recovery if active) + Quick Tools */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Left/Main Hero: Exam Hall CTA (Light Gray Sleek Card) */}
        <button
          onClick={() => navigate("/exam-center")}
          className={cn(
            "p-5 sm:p-6 rounded-3xl text-left tap-feedback active:scale-[0.99] transition-all relative overflow-hidden bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/70 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400/80 dark:hover:border-zinc-700 text-foreground shadow-xs hover:shadow-md group flex flex-col justify-between",
            errorCount > 0 ? "md:col-span-7" : "md:col-span-12"
          )}
        >
          {/* Subtle Ambient Depth */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-zinc-200/30 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono-tech text-[10px] uppercase tracking-widest text-zinc-700 dark:text-zinc-300 font-bold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3 h-3 text-zinc-500" />
                EXAM SIMULATION
              </span>
              <span className="font-mono-tech text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                COLLEGE BOARD FORMAT
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-lg text-foreground group-hover:text-primary transition">
                  {t("examHall")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-medium">
                  {t("examHallDesc")}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-3 mt-3 border-t border-zinc-200/80 dark:border-zinc-800 text-xs font-mono-tech text-foreground font-bold">
            <span className="flex items-center gap-1">
              {language === "ru" ? "Открыть экзамены" : "Launch Exam Center"}
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Right Hero: Error Log card — "Карцер ошибок" (only when errorCount > 0) */}
        {errorCount > 0 && (
          <button
            onClick={() => navigate("/errors")}
            className="md:col-span-5 p-5 rounded-3xl bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/70 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400/80 dark:hover:border-zinc-700 text-foreground tap-feedback active:scale-[0.99] transition-all flex flex-col justify-between text-left shadow-xs group hover:shadow-md relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono-tech text-[10px] uppercase text-rose-700 dark:text-rose-300 font-bold bg-rose-500/10 dark:bg-rose-950/30 px-2.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50 flex items-center gap-1 shadow-xs">
                  <ShieldAlert className="w-3 h-3 text-rose-500" />
                  MISTAKE VAULT
                </span>
                <span className="font-mono-tech text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                  {errorCount} {language === "ru" ? "ОШИБОК" : "PENDING"}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800 group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-sm sm:text-base text-foreground mt-0.5">
                    {t("reviewMistakes")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    {language === "ru"
                      ? "Закрой слабые места без потери жизней"
                      : "Clear errors with zero heart penalty"}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-3 mt-3 border-t border-zinc-200/80 dark:border-zinc-800 text-xs font-mono-tech text-rose-600 dark:text-rose-400 font-bold">
              <span>{language === "ru" ? "Пройти карцер" : "Review ledger"}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        )}
      </div>

      {/* Quick Tools Row (3 Columns with Light Gray Styling) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
        {quickTools.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group p-3.5 sm:p-4 rounded-3xl bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/70 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-950/90 border border-zinc-200/90 dark:border-zinc-800 text-left hover:border-zinc-400/80 dark:hover:border-zinc-700 hover:shadow-xs transition-all duration-150 flex flex-col justify-between"
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${item.color} mb-2.5 group-hover:scale-105 transition-transform shadow-xs`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-xs text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-[10px] font-mono-tech text-muted-foreground font-semibold truncate mt-0.5">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CommandHub;
