"use client";

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Sidebar } from "./Sidebar";
import { useChatStore } from "../../lib/store";

export function AppShell({
  children,
  title,
  headerRight
}: {
  children: React.ReactNode;
  title?: string;
  headerRight?: React.ReactNode;
}) {
  const { sidebarCollapsed, setSidebarCollapsed } = useChatStore();

  const toggleCollapsed = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={`sidebar-glass fixed inset-y-0 left-0 hidden border-r border-border lg:flex ${
          sidebarCollapsed ? "w-[56px]" : "w-[240px]"
        }`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleCollapsed}
        />
      </aside>
      <div className={sidebarCollapsed ? "lg:pl-[56px]" : "lg:pl-[240px]"}>
        <header className="glass-panel sticky top-0 z-20 flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <Sheet>
            <SheetTrigger className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-hover">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent className="sidebar-glass p-4">
              <Sidebar collapsed={false} onToggle={() => undefined} />
            </SheetContent>
          </Sheet>
          <div className="text-sm font-medium text-foreground">
            {title || "GigaChat"}
          </div>
          <div className="flex items-center gap-2">{headerRight}</div>
        </header>
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
