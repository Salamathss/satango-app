import { ReactNode } from "react";
import BottomTabBar from "./BottomTabBar";
import MobileTopBar from "./MobileTopBar";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showTabs?: boolean;
  showStats?: boolean;
}

const AppShell = ({
  children,
  title,
  showHeader = true,
  showTabs = true,
  showStats = true,
}: AppShellProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && <MobileTopBar title={title} showStats={showStats} />}
      <main
        className="flex-1 max-w-lg w-full mx-auto px-4 pt-4"
        style={{ paddingBottom: showTabs ? "calc(80px + env(safe-area-inset-bottom))" : undefined }}
      >
        {children}
      </main>
      {showTabs && <BottomTabBar />}
    </div>
  );
};

export default AppShell;
