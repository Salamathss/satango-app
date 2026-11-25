// src/components/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import {
  Map,
  ClipboardList,
  Binary,
  Sparkles,
  BookOpen,
  ShoppingBag,
  User,
  Shield,
  BarChart3,
  Calculator,
  Sun,
  Moon,
  Languages,
  Swords,
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
    },
    {
      path: "/mocks",
      labelKey: "mocks" as TranslationKey,
      icon: ClipboardList,
    },
    {
      path: "/battle",
      labelKey: "battleArena" as TranslationKey,
      icon: Swords,
    },
    {
      path: "/desmos-lab",
      labelKey: "desmosLab" as TranslationKey,
      icon: Binary,
    },
    {
      path: "/cheatsheet",
      labelKey: "cheatsheet" as TranslationKey,
      icon: Sparkles,
    },
    {
      path: "/vocabulary",
      labelKey: "vocab" as TranslationKey,
      icon: BookOpen,
    },
    {
      path: "/analytics",
      labelKey: "analytics" as TranslationKey,
      icon: BarChart3,
    },
    {
      path: "/shop",
      labelKey: "shop" as TranslationKey,
      icon: ShoppingBag,
    },
    {
      path: "/score-calculator",
      labelKey: "calculator" as TranslationKey,
      icon: Calculator,
    },
    {
      path: "/profile",
      labelKey: "profile" as TranslationKey,
      icon: User,
    },
    ...(isAdmin
      ? [
          {
            path: "/admin-import",
            labelKey: "admin" as TranslationKey,
            icon: Shield,
          },
        ]
      : []),
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen border-r border-border/70 bg-card/95 dark:bg-card/85 backdrop-blur-md z-40 p-3.5 justify-between select-none">
      <div className="space-y-4">
        {/* Brand header */}
        <Link
          to="/"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted/40 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring group"
          aria-label="SATANGO Home"
        >
          <div className="w-8 h-8 rounded-md border border-border/70 bg-background/50 p-1 flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src="/logo-light.png"
              alt="SATANGO Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="wordmark font-mono-tech font-bold text-[13px] tracking-[0.08em] uppercase text-foreground block leading-tight">
              SATANGO
            </span>
            <span className="text-[11px] text-muted-foreground font-sans block leading-tight mt-0.5 truncate">
              {t("digitalSatPrep")}
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="space-y-1" aria-label="Sidebar navigation">
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
                  "flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium motion-safe:transition-colors duration-150 group relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted/60",
                  active
                    ? "bg-secondary/70 dark:bg-muted/70 text-foreground border border-border/80 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                )}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-foreground/80 dark:bg-primary"
                    aria-hidden="true"
                  />
                )}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 motion-safe:transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                    strokeWidth={active ? 2 : 1.75}
                  />
                  <span className="truncate">{t(item.labelKey)}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2.5 border-t border-border/60 pt-3">
        {/* Theme and Language controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-md border border-border/70 bg-card hover:bg-muted/60 text-xs font-medium text-foreground motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted disabled:opacity-50 disabled:pointer-events-none shadow-2xs"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <span className="truncate">{t("lightMode")}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{t("darkMode")}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
            aria-label="Toggle language"
            className="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-md border border-border/70 bg-card hover:bg-muted/60 text-xs font-semibold font-mono-tech text-foreground motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-muted disabled:opacity-50 disabled:pointer-events-none shadow-2xs"
          >
            <Languages className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>

        {/* User info card */}
        {profile && (
          <div className="px-2.5 py-2 rounded-md bg-muted/30 border border-border/60 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-secondary text-secondary-foreground border border-border/70 flex items-center justify-center text-xs font-mono-tech font-semibold shrink-0">
              {profile.nickname?.[0]?.toUpperCase() ||
                profile.display_name?.[0]?.toUpperCase() ||
                "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate text-foreground leading-tight">
                {profile.nickname || profile.display_name || t("learner")}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-mono-tech leading-tight mt-0.5">
                {profile.is_admin ? t("administrator") : t("student")}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
