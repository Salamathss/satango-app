// src/components/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import {
  Map,
  GraduationCap,
  BookOpen,
  ShoppingBag,
  User,
  Shield,
  BarChart3,
  Calculator,
  Sun,
  Moon,
  Languages,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage, TranslationKey } from "@/context/LanguageContext";

const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = profile?.is_admin === true;

  const navItems = [
    {
      path: "/",
      labelKey: "home" as TranslationKey,
      icon: Map,
      accent: "text-amber-500 dark:text-amber-400",
      activeBg: "bg-foreground text-background dark:bg-amber-500/15 dark:text-amber-300 dark:border dark:border-amber-500/30",
    },
    {
      path: "/vocabulary",
      labelKey: "vocab" as TranslationKey,
      icon: BookOpen,
      accent: "text-violet-500 dark:text-violet-400",
      activeBg: "bg-foreground text-background dark:bg-violet-500/15 dark:text-violet-300 dark:border dark:border-violet-500/30",
    },
    {
      path: "/exam-center",
      labelKey: "exams" as TranslationKey,
      icon: GraduationCap,
      accent: "text-sky-500 dark:text-sky-400",
      activeBg: "bg-foreground text-background dark:bg-sky-500/15 dark:text-sky-300 dark:border dark:border-sky-500/30",
    },
    {
      path: "/analytics",
      labelKey: "analytics" as TranslationKey,
      icon: BarChart3,
      accent: "text-emerald-500 dark:text-emerald-400",
      activeBg: "bg-foreground text-background dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-500/30",
    },
    {
      path: "/shop",
      labelKey: "shop" as TranslationKey,
      icon: ShoppingBag,
      accent: "text-amber-500 dark:text-amber-400",
      badge: "PLUS",
      activeBg: "bg-foreground text-background dark:bg-amber-500/15 dark:text-amber-300 dark:border dark:border-amber-500/30",
    },
    {
      path: "/score-calculator",
      labelKey: "calculator" as TranslationKey,
      icon: Calculator,
      accent: "text-cyan-500 dark:text-cyan-400",
      activeBg: "bg-foreground text-background dark:bg-cyan-500/15 dark:text-cyan-300 dark:border dark:border-cyan-500/30",
    },
    {
      path: "/profile",
      labelKey: "profile" as TranslationKey,
      icon: User,
      accent: "text-rose-500 dark:text-rose-400",
      activeBg: "bg-foreground text-background dark:bg-rose-500/15 dark:text-rose-300 dark:border dark:border-rose-500/30",
    },
    ...(isAdmin
      ? [
          {
            path: "/admin-import",
            labelKey: "admin" as TranslationKey,
            icon: Shield,
            accent: "text-red-500 dark:text-red-400",
            activeBg: "bg-foreground text-background dark:bg-red-500/15 dark:text-red-300 dark:border dark:border-red-500/30",
          },
        ]
      : []),
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen border-r border-border/70 bg-card/85 backdrop-blur-xl z-40 p-4 justify-between transition-colors">
      <div className="space-y-6">
        {/* Brand header */}
        <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-muted/50 transition-colors group">
          <div className="relative">
            <img
              src="/logo-light.png"
              alt="SATANGO Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-card animate-pulse" />
          </div>
          <div>
            <span className="font-mono-tech font-black text-base tracking-[0.2em] uppercase text-foreground block">
              SATANGO
            </span>
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
              <span>{t("digitalSatPrep")}</span>
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 group relative",
                  active
                    ? cn("shadow-md font-extrabold", item.activeBg)
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:translate-x-0.5"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                      active
                        ? "text-inherit"
                        : cn("text-muted-foreground group-hover:", item.accent)
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className="tracking-tight">{t(item.labelKey)}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      "font-mono-tech text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded-md",
                      active
                        ? "bg-amber-400 text-neutral-950 dark:bg-amber-400 dark:text-neutral-950"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {active && !item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-border/70 pt-3">
        {/* Theme and Language controls */}
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-border/80 bg-card hover:bg-muted/70 text-xs font-bold text-foreground transition-all active:scale-95 shadow-2xs"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>{t("lightMode")}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-zinc-600" />
                <span>{t("darkMode")}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border/80 bg-card hover:bg-muted/70 text-xs font-black font-mono-tech text-foreground transition-all active:scale-95 shadow-2xs"
          >
            <Languages className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>

        {/* User info card */}
        {profile && (
          <div className="px-2 py-2 rounded-2xl bg-muted/40 border border-border/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-neutral-950 flex items-center justify-center text-xs font-black shadow-xs shrink-0">
              {profile.nickname?.[0]?.toUpperCase() || profile.display_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black truncate text-foreground">
                {profile.nickname || profile.display_name || t("learner")}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] text-muted-foreground truncate font-mono-tech font-semibold">
                  {profile.is_admin ? t("administrator") : t("student")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
