// src/components/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { Map, GraduationCap, BookOpen, ShoppingBag, User, Shield, BarChart3, Calculator, Sun, Moon, Languages } from "lucide-react";
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

  const navItems: { path: string; labelKey: TranslationKey; icon: any }[] = [
    { path: "/", labelKey: "home", icon: Map },
    { path: "/vocabulary", labelKey: "vocab", icon: BookOpen },
    { path: "/exam-center", labelKey: "exams", icon: GraduationCap },
    { path: "/analytics", labelKey: "analytics", icon: BarChart3 },
    { path: "/shop", labelKey: "shop", icon: ShoppingBag },
    { path: "/score-calculator", labelKey: "calculator", icon: Calculator },
    { path: "/profile", labelKey: "profile", icon: User },
    ...(isAdmin ? [{ path: "/admin-import", labelKey: "admin" as TranslationKey, icon: Shield }] : []),
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen border-r border-border/60 bg-card/60 backdrop-blur-md z-40 p-4 justify-between">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-lg">
            S
          </div>
          <div>
            <span className="font-mono-tech font-extrabold text-base tracking-[0.2em] uppercase text-foreground block">
              SATANGO
            </span>
            <span className="text-[11px] text-muted-foreground font-semibold">{t("digitalSatPrep")}</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
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
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? "text-primary-foreground" : "text-muted-foreground")} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-border/50 pt-3">
        {/* Theme and Language controls */}
        <div className="flex items-center gap-2 px-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-[hsl(var(--surface-hover))] transition-colors"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>{t("lightMode")}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-muted-foreground" />
                <span>{t("darkMode")}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border bg-card text-xs font-bold font-mono-tech hover:bg-[hsl(var(--surface-hover))] transition-colors"
          >
            <Languages className="w-4 h-4 text-muted-foreground" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>

        {/* User info card */}
        {profile && (
          <div className="px-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {profile.nickname?.[0]?.toUpperCase() || profile.display_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold truncate text-foreground">
                {profile.nickname || profile.display_name || t("learner")}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
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
