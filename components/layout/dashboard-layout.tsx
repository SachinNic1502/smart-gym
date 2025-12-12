"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "super_admin" | "branch_admin";
  className?: string;
}

export function DashboardLayout({ children, role, className }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Dialog open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <DialogContent className="p-0 w-[18rem] max-w-[18rem] h-screen left-0 top-0 translate-x-0 translate-y-0 rounded-none border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left">
          <DialogHeader className="sr-only">
            <DialogTitle>Navigation menu</DialogTitle>
          </DialogHeader>
          <Sidebar role={role} className="w-[18rem]" onNavigate={() => setMobileSidebarOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Sidebar - Fixed */}
      <div className="flex-shrink-0 hidden md:block">
        <Sidebar role={role} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header - Fixed */}
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-hidden">
          <div className={cn("h-full overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto", className)}>
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-4 text-center text-sm">
          Engineered by <span className="font-semibold">
            <a href="https://www.agrozonetechnology.com/" target="_blank">
            <span className="text-yellow-500">Agro</span>zone Technology
            </a>
          </span>
        </footer>


      </div>
    </div>
  );
}
