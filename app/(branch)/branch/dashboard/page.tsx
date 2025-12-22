"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Users,
    UserCheck,
    Wallet,
    Dumbbell,
    ArrowUpRight,
    Clock,
    CalendarDays,
    ArrowRight,
    TrendingUp,
    AlertCircle,
    Smartphone,
    CreditCard,
    Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from 'recharts';
import { useToast } from "@/components/ui/toast-provider";
import { branchesApi, dashboardApi, ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";

interface BranchStatsResponse {
    stats: {
        title: string;
        value: string | number;
        sub: string;
        color: string;
    }[];
    charts: {
        attendanceTrend: { time: string; users: number }[];
    };
    recentCheckIns: {
        name: string;
        time: string;
        method: string;
        status: string;
    }[];
    expiringMembers: {
        name: string;
        days: number;
    }[];
}

interface StatItem {
    title: string;
    value: string | number;
    sub: string;
    icon: typeof Users;
    color: string;
}

type ExpiringSoonItem = {
    id: string;
    name: string;
    days: number;
};

type BirthdayItem = {
    id: string;
    name: string;
    days: number;
};

const STAT_ICON_MAP: Record<string, typeof Users> = {
    "Live Check-ins": UserCheck,
    "Today's Collections": Wallet,
    "Active Members": Users,
    "Expiring Soon": CalendarDays,
    "Today Plan Expiry": Clock,
    "Today's Attendance": Users,
    "Week Collection": Wallet,
    "Month Renewals": Users,
};

// Custom Tooltip for Chart
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-lg">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="font-bold text-lg text-foreground">
                        {payload[0].value} <span className="text-xs font-normal text-muted-foreground">users</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function BranchDashboard() {
    const toast = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const branchId = user?.branchId;

    const [mounted, setMounted] = useState(false);
    const [branchName, setBranchName] = useState<string | null>(null);
    const [branchStats, setBranchStats] = useState<BranchStatsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Alerts
    const [expiringSoon, setExpiringSoon] = useState<ExpiringSoonItem[]>([]);
    const [birthdaysThisWeek, setBirthdaysThisWeek] = useState<BirthdayItem[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadDashboardData = useCallback(async (arg?: boolean | unknown) => {
        const isBackground = typeof arg === 'boolean' ? arg : false;

        if (!user || (user.role === "branch_admin" && !branchId)) {
            setError("Branch not assigned or user not authenticated");
            if (!isBackground) setLoading(false);
            return;
        }

        if (!branchId) {
            if (!isBackground) setLoading(false);
            return;
        }

        // Only set loading true if it's an initial load or manual refresh, not background polling
        if (!isBackground) setLoading(true);
        if (!isBackground) setError(null);

        try {
            // Run independent requests in parallel
            const [branchRes, statsRes, alertsRes] = await Promise.allSettled([
                branchesApi.get(branchId),
                dashboardApi.getStats(),
                branchesApi.getAlerts(branchId, { days: 7, limit: 8 })
            ]);

            // Handle Branch Info
            if (branchRes.status === 'fulfilled') {
                setBranchName(branchRes.value.name);
            }

            // Handle Stats
            if (statsRes.status === 'fulfilled') {
                setBranchStats(statsRes.value as BranchStatsResponse);
            } else {
                const message = statsRes.reason instanceof ApiError ? statsRes.reason.message : "Failed to load stats";
                console.error(message);
            }

            // Handle Alerts
            if (alertsRes.status === 'fulfilled') {
                setExpiringSoon(alertsRes.value.expiringSoon);
                setBirthdaysThisWeek(alertsRes.value.birthdaysThisWeek);
            } else {
                console.error("Failed to load alerts");
            }

        } catch (err) {
            // Only show full error on foreground load to avoid annoying popups during background refresh
            if (!isBackground) {
                setError("An unexpected error occurred while loading the dashboard.");
            }
            console.error(err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [branchId, user]);


    useEffect(() => {
        loadDashboardData();
        // Poll every 30 seconds for live updates
        const interval = setInterval(() => loadDashboardData(true), 30000);
        return () => clearInterval(interval);
    }, [loadDashboardData]);

    const mappedStats: StatItem[] | null = branchStats
        ? branchStats.stats.map((s) => ({
            title: s.title,
            value: s.value,
            sub: s.sub,
            color: s.color,
            icon: STAT_ICON_MAP[s.title] ?? Users,
        }))
        : null;

    const stats: StatItem[] = mappedStats ?? [];
    const attendanceData = branchStats?.charts.attendanceTrend ?? [];
    const recentCheckIns = branchStats?.recentCheckIns ?? [];

    const headerTitle = branchName ?? (branchId ? `Branch ${branchId}` : "Dashboard");
    const headerSubtitle = user ? `Welcome back, ${user.name}` : "Overview of your gym performance";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/50 lg:p-0 lg:bg-transparent lg:border-none">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">{headerTitle}</h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        {headerSubtitle}
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <Link href="/branch/members/add">
                        <Button className="w-full sm:w-auto shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg h-10 px-6 transition-all hover:scale-105 active:scale-95">
                            <Users className="mr-2 h-4 w-4" />
                            Add Member
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto border-primary/20 text-primary hover:bg-primary/5 hover:text-primary font-semibold rounded-lg h-10 px-6"
                        type="button"
                        onClick={() => router.push("/branch/payments")}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        New Sale
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Error loading dashboard: {error}</span>
                    </div>
                    <Button size="sm" variant="outline" className="bg-white border-rose-200 text-rose-700 hover:bg-rose-50 h-8" onClick={() => loadDashboardData(false)}>
                        Retry
                    </Button>
                </div>
            )}

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {loading
                    ? Array.from({ length: 4 }).map((_, idx) => (
                        <Card key={idx} className="border-border/50 bg-card shadow-sm h-32">
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div className="flex justify-between items-start">
                                    <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                                    <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                                </div>
                                <div>
                                    <div className="h-8 w-16 rounded bg-muted animate-pulse mb-2" />
                                    <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                    : stats.length === 0
                        ? (
                            <Card className="col-span-2 lg:col-span-4 border-dashed border-muted bg-muted/5 shadow-none">
                                <CardContent className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                    <div className="p-3 bg-muted rounded-full">
                                        <TrendingUp className="h-5 w-5 opacity-50" />
                                    </div>
                                    <p>No dashboard stats available yet.</p>
                                </CardContent>
                            </Card>
                        )
                        : stats.map((stat) => (
                            <Card key={stat.title} className="hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/60 bg-white group relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-5 group-hover:opacity-10 transition-opacity ${stat.title.includes("Collection") ? "bg-emerald-500" : stat.color.replace('text-', 'bg-')}`} />

                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-xl ${stat.color} bg-opacity-10 text-opacity-100 group-hover:bg-opacity-20 transition-all shadow-sm`}>
                                        <stat.icon className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight text-slate-800">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium flex items-center gap-1">
                                        {stat.sub}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Chart Section */}
                <Card className="md:col-span-2 shadow-sm border-border/60 bg-white">
                    <CardHeader className="pb-2 border-b border-border/40">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Live Occupancy Trend
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">Real-time gym traffic throughout the day</p>
                            </div>
                            <Badge variant="outline" className="font-normal text-xs bg-blue-50 text-blue-700 border-blue-100 px-3 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>
                                Live
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] w-full">
                            {!mounted || loading ? (
                                <div className="h-full w-full p-4 flex items-end gap-2">
                                    <Skeleton className="h-[40%] w-full rounded-t-lg bg-muted/20" />
                                    <Skeleton className="h-[70%] w-full rounded-t-lg bg-muted/20" />
                                    <Skeleton className="h-[50%] w-full rounded-t-lg bg-muted/20" />
                                    <Skeleton className="h-[80%] w-full rounded-t-lg bg-muted/20" />
                                    <Skeleton className="h-[60%] w-full rounded-t-lg bg-muted/20" />
                                    <Skeleton className="h-[90%] w-full rounded-t-lg bg-muted/20" />
                                    <Skeleton className="h-[30%] w-full rounded-t-lg bg-muted/20" />
                                </div>
                            ) : attendanceData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border/50 flex-col gap-3">
                                    <div className="p-3 bg-muted rounded-full opacity-50">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <p>No occupancy data recorded today.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={attendanceData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                                        <XAxis
                                            dataKey="time"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            dy={10}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            tickCount={5}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="users"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorUsers)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-sm border-border/60 bg-white h-full flex flex-col">
                    <CardHeader className="pb-4 border-b border-border/40">
                        <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
                        <p className="text-xs text-muted-foreground">Manage your branch efficiently</p>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-3 flex-1 content-start">
                        <Link href="/branch/attendance" className="block h-full group">
                            <Button variant="outline" className="w-full h-full min-h-[100px] flex flex-col items-center justify-center gap-2 bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm">
                                <div className="p-2.5 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-semibold">Mark Entry</span>
                            </Button>
                        </Link>
                        <Link href="/branch/expenses" className="block h-full group">
                            <Button variant="outline" className="w-full h-full min-h-[100px] flex flex-col items-center justify-center gap-2 bg-slate-50 border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-all shadow-sm">
                                <div className="p-2.5 rounded-full bg-rose-100 text-rose-600 group-hover:scale-110 transition-transform">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-semibold">Add Expense</span>
                            </Button>
                        </Link>
                        <Link href="/branch/classes" className="block h-full group">
                            <Button variant="outline" className="w-full h-full min-h-[100px] flex flex-col items-center justify-center gap-2 bg-slate-50 border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all shadow-sm">
                                <div className="p-2.5 rounded-full bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
                                    <Dumbbell className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-semibold">Book Class</span>
                            </Button>
                        </Link>
                        <Link href="/branch/communications" className="block h-full group">
                            <Button variant="outline" className="w-full h-full min-h-[100px] flex flex-col items-center justify-center gap-2 bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm">
                                <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Megaphone className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-semibold">Broadcast</span>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Check-ins */}
                <Card className="shadow-sm border-border/60 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-bold">Recent Check-ins</CardTitle>
                        </div>
                        <Link href="/branch/attendance">
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-muted-foreground hover:text-primary px-2">
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                        <div className="space-y-1 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="py-12 text-center text-xs text-muted-foreground">Loading activity...</div>
                            ) : recentCheckIns.length === 0 ? (
                                <div className="py-12 text-center text-xs text-muted-foreground bg-muted/5 rounded-lg flex flex-col items-center gap-2 m-2">
                                    <Clock className="h-8 w-8 opacity-20" />
                                    <span>No recent activity recorded.</span>
                                </div>
                            ) : recentCheckIns.map((item, i) => (
                                <div key={`${item.name}-${item.time}-${i}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${item.status === 'failed'
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-white text-slate-700 border-slate-200 group-hover:border-primary/30 group-hover:text-primary transition-colors'
                                                }`}
                                        >
                                            {item.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-foreground">{item.name}</p>
                                            <p className="text-[11px] text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                                                <Smartphone className="w-3 h-3" />
                                                {item.method}
                                                <span className="text-slate-300">|</span>
                                                <span className={item.status === 'failed' ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'}>
                                                    {item.status}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 text-slate-500 border-slate-200">
                                        {item.time}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts & Expiries */}
                <Card className="shadow-sm border-border/60 bg-white flex flex-col">
                    <CardHeader className="pb-4 border-b border-border/40">
                        <CardTitle className="text-base font-bold">Expiries & Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6 pt-4">
                        {/* Expiring Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    Expiring Soon
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-5 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100">Next 7 days</Badge>
                            </div>
                            <div className="space-y-1">
                                {loading ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground">Loading...</div>
                                ) : expiringSoon.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border/60">
                                        All memberships are healthy!
                                    </div>
                                ) : expiringSoon.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-amber-50/50 transition-colors border border-transparent hover:border-amber-100/50 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                                            <span className="text-sm font-medium text-slate-700">{m.name}</span>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${m.days <= 3 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {m.days === 0 ? 'Expires Today' : `${m.days} days left`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Birthdays Section */}
                        {birthdaysThisWeek.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Megaphone className="w-3.5 h-3.5" />
                                        Birthdays
                                    </span>
                                    <Badge variant="secondary" className="text-[10px] h-5 bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-100">This week</Badge>
                                </div>
                                <div className="space-y-1">
                                    {birthdaysThisWeek.map((b) => (
                                        <div key={b.id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-pink-50/50 transition-colors border border-transparent hover:border-pink-100/50 group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 group-hover:scale-125 transition-transform" />
                                                <span className="text-sm font-medium text-slate-700">{b.name}</span>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${b.days === 0 ? 'bg-pink-100 text-pink-700' : 'bg-slate-50 text-slate-600'}`}>
                                                {b.days === 0 ? 'Today 🎉' : `In ${b.days} days`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
