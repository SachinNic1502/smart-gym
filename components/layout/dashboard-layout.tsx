"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "super_admin" | "branch_admin";
  className?: string;
}

export function DashboardLayout({ children, role, className }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Fixed */}
      <div className="flex-shrink-0 hidden md:block">
        <Sidebar role={role} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header - Fixed */}
        <Header />

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
