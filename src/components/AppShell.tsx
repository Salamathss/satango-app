import { ReactNode } from "react";
import BottomTabBar from "./BottomTabBar";
import MobileTopBar from "./MobileTopBar";
import Sidebar from "./Sidebar";

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
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-64">
        {showHeader && <MobileTopBar title={title} showStats={showStats} />}
        <main
          className="flex-1 max-w-lg lg:max-w-4xl w-full mx-auto px-4 pt-4 pb-20 lg:pb-8"
        >
          {children}
        </main>
      </div>
      {showTabs && <BottomTabBar />}
    </div>
  );
};

export default AppShell;
