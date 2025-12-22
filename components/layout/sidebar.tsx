"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    Dumbbell,
    CreditCard,
    Settings,
    LogOut,
    Building2,
    Fingerprint,
    MessageSquare,
    BarChart3,
    Wallet,
    DollarSign,
    ShieldCheck,
    UserCog,
    UserPlus,
    Activity,
    Utensils,
    PieChart,
    ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";

interface SidebarItem {
    icon: React.ElementType;
    label: string;
    href: string;
}

interface SidebarGroup {
    title: string;
    items: SidebarItem[];
}

interface SidebarProps {
    role: "super_admin" | "branch_admin" | "member";
    className?: string;
    onNavigate?: () => void;
}

const SUPER_ADMIN_GROUPS: SidebarGroup[] = [
    {
        title: "Overview",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
            { icon: Building2, label: "Branches", href: "/admin/branches" },
            { icon: PieChart, label: "Reports", href: "/admin/reports" },
        ]
    },
    {
        title: "Management",
        items: [
            { icon: Users, label: "Global Members", href: "/admin/members" },
            { icon: UserCog, label: "User Management", href: "/admin/team" },
            { icon: Fingerprint, label: "Devices", href: "/admin/devices" },
        ]
    },
    {
        title: "System",
        items: [
            { icon: DollarSign, label: "Billing", href: "/admin/billing" },
            { icon: MessageSquare, label: "Communications", href: "/admin/communications" },
            { icon: ShieldCheck, label: "Audit Logs", href: "/admin/audit-logs" },
            { icon: Settings, label: "Settings", href: "/admin/settings" },
        ]
    }
];

const BRANCH_ADMIN_GROUPS: SidebarGroup[] = [
    {
        title: "Main",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/branch/dashboard" },
            { icon: BarChart3, label: "Insights", href: "/branch/insights" },
        ]
    },
    {
        title: "Operations",
        items: [
            { icon: Users, label: "Members", href: "/branch/members" },
            { icon: UserPlus, label: "Leads", href: "/branch/leads" },
            { icon: Fingerprint, label: "Attendance", href: "/branch/attendance" },
            { icon: Dumbbell, label: "Classes & Trainers", href: "/branch/classes" },
        ]
    },
    {
        title: "Plans",
        items: [
            { icon: Activity, label: "Workout Plans", href: "/branch/workout-plans" },
            { icon: Utensils, label: "Diet Plans", href: "/branch/diet-plans" },
        ]
    },
    {
        title: "Finance",
        items: [
            { icon: CreditCard, label: "Payments", href: "/branch/payments" },
            { icon: Wallet, label: "Expenses", href: "/branch/expenses" },
        ]
    },
    {
        title: "Admin",
        items: [
            { icon: MessageSquare, label: "Communications", href: "/branch/communications" },
            { icon: UserCog, label: "Team", href: "/branch/team" },
            { icon: ShieldCheck, label: "Audit Logs", href: "/branch/audit-logs" },
            { icon: Settings, label: "Settings", href: "/branch/settings" },
        ]
    }
];

const MEMBER_GROUPS: SidebarGroup[] = [
    {
        title: "Menu",
        items: [
            { icon: Fingerprint, label: "Check In / Out", href: "/portal/attendance" },
            { icon: Dumbbell, label: "Workouts", href: "/portal/workouts" },
            { icon: Utensils, label: "Diet Plan", href: "/portal/diet" },
            { icon: UserCog, label: "Profile", href: "/portal/profile" },
        ]
    }
];

export function Sidebar({ role, className, onNavigate }: SidebarProps) {
    const { logout } = useAuth();
    const pathname = usePathname();

    let groups: SidebarGroup[] = role === 'super_admin' ? SUPER_ADMIN_GROUPS : role === 'branch_admin' ? BRANCH_ADMIN_GROUPS : MEMBER_GROUPS;

    return (
        <div className={cn("flex flex-col h-screen w-72 bg-white border-r border-gray-100", className)}>
            {/* Logo Header */}
            <div className="flex items-center gap-3 px-6 py-8">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold shadow-sm">
                    SF
                </div>
                <div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight block leading-none">SmartFit</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{
                        role === 'super_admin' ? 'Super Admin' :
                            role === 'branch_admin' ? 'Branch Admin' : 'Member Portal'
                    }</span>
                </div>
            </div>

            {/* Scrollable Nav Items */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 custom-scrollbar">
                {groups.map((group, groupIndex) => (
                    <div key={group.title} className="space-y-1">
                        <h4 className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            {group.title}
                        </h4>
                        {group.items.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link key={item.href} href={item.href} onClick={() => onNavigate?.()}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-between h-10 px-3 font-medium transition-all duration-200 group relative overflow-hidden rounded-lg",
                                            isActive
                                                ? "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90 hover:text-white"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 z-10">
                                            <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-slate-400 group-hover:text-slate-600")} />
                                            <span>{item.label}</span>
                                        </div>
                                        {isActive && <ChevronRight className="h-3 w-3 opacity-50 z-10" />}
                                    </Button>
                                </Link>
                            );
                        })}
                        {groupIndex !== groups.length - 1 && (
                            <div className="px-2 pt-2">
                                <Separator className="bg-slate-50" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-100 bg-slate-50/50">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all"
                    onClick={() => {
                        onNavigate?.();
                        logout();
                    }}
                >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Sign Out</span>
                </Button>
            </div>
        </div>
    );
}
