// src/components/BottomTabBar.tsx
import { Link, useLocation } from "react-router-dom";
import { Map, GraduationCap, BookOpen, ShoppingBag, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const BottomTabBar = () => {
  const location = useLocation();
  const { user, profile } = useAuth();

  const isAdmin = profile?.is_admin === true;

  const tabs = [
    { path: "/", label: "Home", icon: Map },
    { path: "/vocabulary", label: "Vocab", icon: BookOpen },
    { path: "/exam-center", label: "Exams", icon: GraduationCap },
    { path: "/shop", label: "Shop", icon: ShoppingBag },
    { path: "/profile", label: "Profile", icon: User },
    ...(isAdmin ? [{ path: "/admin-import", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 glass border-t border-border/50 safe-bottom lg:hidden"
      style={{ height: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active =
            tab.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.path);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 tap-feedback transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-11 h-7 rounded-full transition-all",
                  active && "bg-primary/12"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "scale-110")} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={cn("text-[10px] font-bold tracking-tight", active ? "" : "opacity-80")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;