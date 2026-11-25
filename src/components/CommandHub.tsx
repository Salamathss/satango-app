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
      color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25",
    },
    {
      title: t("vocab"),
      desc: language === "ru" ? "1000+ слов" : "SAT Vocab",
      icon: BookOpen,
      path: "/vocabulary",
      color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/25",
    },
    {
      title: t("calculator"),
      desc: language === "ru" ? "Шкала 1600" : "1600 Score",
      icon: Calculator,
      path: "/score-calculator",
      color: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    },
  ];

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-foreground" />
          <span className="text-xs font-bold text-foreground">
            {language === "ru" ? "Режимы тренировок" : "Training Modes"}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/25">
          {language === "ru" ? "Быстрый старт" : "Quick Start"}
        </span>
      </div>

      {/* Main Grid: Exam Hall (and Error Recovery if active) + Quick Tools */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Left/Main Hero: Exam Hall CTA */}
        <button
          onClick={() => navigate("/exam-center")}
          className={cn(
            "p-5 sm:p-6 rounded-3xl text-left tap-feedback active:scale-[0.99] transition-all relative overflow-hidden bg-card hover:bg-card/90 border border-border/80 hover:border-violet-500/50 text-foreground shadow-sm hover:shadow-md group flex flex-col justify-between",
            errorCount > 0 ? "md:col-span-7" : "md:col-span-12"
          )}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/[0.06] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono-tech text-[10px] uppercase tracking-wider text-violet-700 dark:text-violet-300 font-extrabold bg-violet-500/15 px-2.5 py-0.5 rounded-md border border-violet-500/30 flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                EXAM SIMULATION
              </span>
              <span className="font-mono-tech text-[10px] text-muted-foreground font-bold">
                COLLEGE BOARD FORMAT
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-violet-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-lg text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {t("examHall")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-medium">
                  {t("examHallDesc")}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-3 mt-4 border-t border-border/60 text-xs font-mono-tech text-foreground font-bold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
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
            className="md:col-span-5 p-5 rounded-3xl bg-card hover:bg-card/90 border border-border/80 hover:border-rose-500/50 text-foreground tap-feedback active:scale-[0.99] transition-all flex flex-col justify-between text-left shadow-sm hover:shadow-md group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/[0.06] rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono-tech text-[10px] uppercase text-rose-700 dark:text-rose-300 font-extrabold bg-rose-500/15 px-2.5 py-0.5 rounded-md border border-rose-500/30 flex items-center gap-1 shadow-2xs">
                  <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  MISTAKE VAULT
                </span>
                <span className="font-mono-tech text-[10px] text-rose-600 dark:text-rose-400 font-extrabold bg-rose-500/10 px-2 py-0.5 rounded">
                  {errorCount} {language === "ru" ? "ОШИБОК" : "PENDING"}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-sm sm:text-base text-foreground mt-0.5 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {t("reviewMistakes")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-relaxed">
                    {language === "ru"
                      ? "Закрой слабые места без потери жизней"
                      : "Clear errors with zero heart penalty"}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-3 mt-4 border-t border-border/60 text-xs font-mono-tech text-rose-600 dark:text-rose-400 font-extrabold">
              <span>{language === "ru" ? "Пройти карцер" : "Review ledger"}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        )}
      </div>

      {/* Quick Tools Row (3 Columns with distinct thematic colors) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
        {quickTools.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-card hover:bg-card/90 border border-border/80 text-left hover:border-border hover:shadow-md transition-all duration-200 flex flex-col justify-between tap-feedback active:scale-95"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center border mb-3 transition-transform group-hover:scale-105 shadow-2xs",
                  item.color
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={2.3} />
              </div>
              <div>
                <p className="font-black text-xs sm:text-sm text-foreground truncate">
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
