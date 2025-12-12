"use client";

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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarItem {
    icon: React.ElementType; // Better than 'any', represents a component like Lucide icons
    label: string;
    href: string;
}

interface SidebarProps {
    role: "super_admin" | "branch_admin";
    className?: string;
}

const SUPER_ADMIN_ITEMS: SidebarItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Building2, label: "Branches", href: "/admin/branches" },
    { icon: Users, label: "Global Members", href: "/admin/members" },
    { icon: Fingerprint, label: "Devices", href: "/admin/devices" },
    { icon: DollarSign, label: "Billing", href: "/admin/billing" },
    { icon: UserCog, label: "User Management", href: "/admin/team" },
    // { icon: MessageSquare, label: "Communications", href: "/admin/communications" },
    { icon: MessageSquare, label: "Communications", href: "" },
    { icon: BarChart3, label: "Reports", href: "/admin/reports" },
    { icon: ShieldCheck, label: "Audit Logs", href: "/admin/audit-logs" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
];

const BRANCH_ADMIN_ITEMS: SidebarItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/branch/dashboard" },
    { icon: BarChart3, label: "Insights", href: "/branch/insights" },
    { icon: Users, label: "Members", href: "/branch/members" },
    { icon: UserPlus, label: "Leads", href: "/branch/leads" },
    { icon: Fingerprint, label: "Attendance", href: "/branch/attendance" },
    { icon: Dumbbell, label: "Classes & Trainers", href: "/branch/classes" },
    { icon: Activity, label: "Workout Plans", href: "/branch/workout-plans" },
    { icon: Utensils, label: "Diet Plans", href: "/branch/diet-plans" },
    { icon: MessageSquare, label: "Communications", href: "/branch/communications" },
    { icon: CreditCard, label: "Payments & Renewals", href: "/branch/payments" },
    { icon: Wallet, label: "Expenses", href: "/branch/expenses" },
    { icon: ShieldCheck, label: "Audit Logs", href: "/branch/audit-logs" },
    { icon: UserCog, label: "Team", href: "/branch/team" },
    { icon: Settings, label: "Settings", href: "/branch/settings" },
];

export function Sidebar({ role, className }: SidebarProps) {
    const { logout } = useAuth();
    const pathname = usePathname();
    const items = role === "super_admin" ? SUPER_ADMIN_ITEMS : BRANCH_ADMIN_ITEMS;

    return (
        <div className={cn("flex flex-col h-screen w-64 bg-white border-r border-gray-100 p-4", className)}>
            <div className="flex items-center gap-2 px-2 py-6">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                    SF
                </div>
                <span className="text-xl font-bold text-secondary">SmartFit</span>
            </div>

            <div className="flex-1 space-y-1 mt-6">
                {items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className="relative group">
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full transition-all duration-200" />
                                )}
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3 text-base h-12 font-normal pl-4 transition-colors duration-200",
                                        isActive
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "h-5 w-5 transition-colors duration-200",
                                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                                        )}
                                    />
                                    <span className="truncate">{item.label}</span>
                                </Button>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="pt-4 border-t border-gray-100">
                <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={logout}
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
