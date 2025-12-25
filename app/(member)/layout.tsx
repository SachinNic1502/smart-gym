"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Home, User, Dumbbell, Apple, RefreshCw, Activity, Fingerprint } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MaintenanceGuard } from "@/components/maintenance-guard";

export default function MemberLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href || (href !== "/portal/dashboard" && pathname.startsWith(href));

    const navItems = [
        { icon: Home, label: "Home", href: "/portal/dashboard" },
        { icon: Dumbbell, label: "Work", href: "/portal/workouts" },
        { icon: Fingerprint, label: "Check", href: "/portal/attendance", isCenter: true },
        { icon: Apple, label: "Diet", href: "/portal/diet" },
        { icon: User, label: "You", href: "/portal/profile" },
    ];

    return (
        <MaintenanceGuard>
            <DashboardLayout role="member" hideMobileSidebar={true}>
                <div className="relative min-h-[calc(100vh-64px)] pb-32 md:pb-0">
                    {children}
                    {/* ... rest of the file ... */}

                    {/* Premium Mobile App-Style Bottom Nav */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />

                        <nav className="relative mx-4 mb-6">
                            <div className="flex items-center justify-between bg-[#0F172A]/95 backdrop-blur-2xl px-2 py-2 rounded-[32px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/5">
                                {navItems.map((item) => {
                                    const active = isActive(item.href);

                                    if (item.isCenter) {
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className="relative -mt-12 group"
                                            >
                                                <div className="absolute inset-0 bg-primary blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
                                                <div className={cn(
                                                    "relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500 shadow-2xl",
                                                    active
                                                        ? "bg-white text-primary rotate-12 scale-110"
                                                        : "bg-primary text-white hover:scale-105 active:scale-95"
                                                )}>
                                                    <item.icon className="h-8 w-8" />
                                                </div>
                                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access</span>
                                                </div>
                                            </Link>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-300 group",
                                                active ? "text-white" : "text-slate-500 hover:text-slate-300"
                                            )}
                                        >
                                            {active && (
                                                <div className="absolute inset-0 bg-white/5 rounded-2xl animate-in fade-in zoom-in duration-300" />
                                            )}
                                            <div className="relative">
                                                <item.icon className={cn(
                                                    "h-5 w-5 transition-transform duration-500",
                                                    active ? "scale-110" : "group-hover:scale-110"
                                                )} />
                                                {active && (
                                                    <div className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-[0.1em] transition-all",
                                                active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-60 group-hover:translate-y-0"
                                            )}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>
                    </div>
                </div>
            </DashboardLayout>
        </MaintenanceGuard>
    );
}
