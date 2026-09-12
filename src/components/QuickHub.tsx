import { useNavigate } from "react-router-dom";
import { Swords, BookOpen, Calculator } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const QuickHub = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const items = [
    {
      title: t("battleArena"),
      desc: language === "ru" ? "Дуэль на скорость" : "Live PvP Blitz",
      icon: Swords,
      path: "/battle",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: t("vocab"),
      desc: language === "ru" ? "1000+ SAT слов" : "Flashcard Mastery",
      icon: BookOpen,
      path: "/vocabulary",
      color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: t("calculator"),
      desc: language === "ru" ? "Симулятор 1600" : "1600 Concordance",
      icon: Calculator,
      path: "/score-calculator",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
          // {t("quickActions")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group p-3.5 sm:p-4 rounded-3xl bg-card/90 dark:bg-[#171615]/90 backdrop-blur-xl border border-border/80 dark:border-white/[0.12] text-left hover:border-amber-500/40 hover:shadow-md transition-all duration-150 flex flex-col justify-between"
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${item.color} mb-3 group-hover:scale-105 transition-transform shadow-sm`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-xs text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-[10px] font-mono-tech text-muted-foreground font-medium truncate mt-0.5">
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

export default QuickHub;
