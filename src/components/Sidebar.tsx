// src/components/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { Map, GraduationCap, BookOpen, ShoppingBag, User, Shield, BarChart3, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;

  const navItems = [
    { path: "/", label: "Home", icon: Map },
    { path: "/vocabulary", label: "Vocab", icon: BookOpen },
    { path: "/exam-center", label: "Exams", icon: GraduationCap },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/shop", label: "Shop", icon: ShoppingBag },
    { path: "/score-calculator", label: "Calculator", icon: Calculator },
    { path: "/profile", label: "Profile", icon: User },
    ...(isAdmin ? [{ path: "/admin-import", label: "Admin", icon: Shield }] : []),
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
            <span className="text-[11px] text-muted-foreground font-semibold">Digital SAT Prep</span>
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User info card at bottom */}
      {profile && (
        <div className="border-t border-border/50 pt-3 px-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {profile.nickname?.[0]?.toUpperCase() || profile.display_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold truncate text-foreground">
              {profile.nickname || profile.display_name || "User"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {profile.is_admin ? "Administrator" : "Student"}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
