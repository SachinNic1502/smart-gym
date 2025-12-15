"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
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

export default function BranchDashboard() {
    const toast = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const branchId = user?.branchId;
    const [branchName, setBranchName] = useState<string | null>(null);
    const [branchStats, setBranchStats] = useState<BranchStatsResponse | null>(null);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchBranchName = useCallback(async () => {
        if (!branchId) {
            setBranchName(null);
            return;
        }

        try {
            const branch = await branchesApi.get(branchId);
            setBranchName(branch.name);
        } catch {
            setBranchName(null);
        }
    }, [branchId]);

    const fetchStats = useCallback(async () => {
        if (!user) {
            setBranchStats(null);
            setLoadingStats(false);
            return;
        }

        if (user.role === "branch_admin" && !branchId) {
            setBranchStats(null);
            setStatsError("Branch not assigned");
            setLoadingStats(false);
            return;
        }

        setLoadingStats(true);
        setStatsError(null);

        try {
            const data = await dashboardApi.getStats();
            setBranchStats(data as BranchStatsResponse);
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to load branch stats";
            setStatsError(message);
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
            setBranchStats(null);
        } finally {
            setLoadingStats(false);
        }
    }, [branchId, toast, user]);

    useEffect(() => {
        fetchBranchName();
    }, [fetchBranchName]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

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
    const expiringMembers = branchStats?.expiringMembers ?? [];

    const headerTitle = branchName ?? (branchId ? `Branch ${branchId}` : "Dashboard");
    const headerSubtitle = user ? `Welcome back, ${user.name}` : "Overview of your gym performance";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">{headerTitle}</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {headerSubtitle}
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <Link href="/branch/members/add">
                        <Button className="w-full sm:w-auto shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                            <Users className="mr-2 h-4 w-4" />
                            Add Member
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto border-primary/20 text-primary hover:bg-primary/5 hover:text-primary font-medium"
                        type="button"
                        onClick={() => router.push("/branch/payments")}
                    >
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        New Sale
                    </Button>
                </div>
            </div>

            {statsError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Error loading dashboard:</span>
                        <span>{statsError}</span>
                    </div>
                    <Button size="sm" variant="outline" className="bg-white border-rose-200 text-rose-700 hover:bg-rose-50 h-8" onClick={fetchStats}>
                        Retry
                    </Button>
                </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {loadingStats
                    ? Array.from({ length: 4 }).map((_, idx) => (
                        <Card key={idx} className="border-border/50 bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                                <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 w-16 rounded bg-muted animate-pulse mb-2" />
                                <div className="h-3 w-32 rounded bg-muted animate-pulse" />
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
                        <Card key={stat.title} className="hover:shadow-md transition-all duration-200 border-border/60 bg-card group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${stat.title.includes("Collection") ? "bg-emerald-500" : stat.title.includes("Check-in") ? "bg-blue-500" : "bg-primary"} opacity-0 group-hover:opacity-100 transition-opacity`} />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10 text-opacity-100 group-hover:bg-opacity-20 transition-all`}>
                                    <stat.icon className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1 font-medium">
                                    {stat.sub}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1 md:col-span-2 lg:col-span-2 shadow-sm border-border/60">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">Live Occupancy Trend</CardTitle>
                            <Badge variant="outline" className="font-normal text-xs bg-blue-50 text-blue-700 border-blue-100">Real-time</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[280px] w-full">
                            {!mounted || loadingStats ? (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground bg-muted/5 rounded-lg mx-6">
                                    Loading trend data...
                                </div>
                            ) : attendanceData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground bg-muted/5 rounded-lg mx-6 flex-col gap-2">
                                    <TrendingUp className="h-8 w-8 opacity-20" />
                                    <p>No occupancy data recorded today.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={attendanceData}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                        <XAxis 
                                            dataKey="time" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                borderRadius: '8px', 
                                                border: '1px solid hsl(var(--border))', 
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                fontSize: '12px'
                                            }}
                                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="users" 
                                            stroke="hsl(var(--primary))" 
                                            strokeWidth={2} 
                                            fillOpacity={1} 
                                            fill="url(#colorUsers)" 
                                            activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 lg:col-span-1 shadow-sm border-border/60 h-full flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 flex-1 content-start">
                        <Link href="/branch/attendance" className="block h-full">
                            <Button variant="outline" className="w-full flex-col h-24 gap-3 bg-card hover:bg-blue-50/50 hover:text-blue-600 hover:border-blue-200 transition-all group border-border/60 shadow-sm">
                                <div className="p-2 rounded-full bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-medium">Mark Entry</span>
                            </Button>
                        </Link>
                        <Link href="/branch/expenses" className="block h-full">
                            <Button variant="outline" className="w-full flex-col h-24 gap-3 bg-card hover:bg-rose-50/50 hover:text-rose-600 hover:border-rose-200 transition-all group border-border/60 shadow-sm">
                                <div className="p-2 rounded-full bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-medium">Add Expense</span>
                            </Button>
                        </Link>
                        <Link href="/branch/classes" className="block h-full">
                            <Button variant="outline" className="w-full flex-col h-24 gap-3 bg-card hover:bg-purple-50/50 hover:text-purple-600 hover:border-purple-200 transition-all group border-border/60 shadow-sm">
                                <div className="p-2 rounded-full bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                                    <Dumbbell className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-medium">Book Class</span>
                            </Button>
                        </Link>
                        <Link href="/branch/communications" className="block h-full">
                            <Button variant="outline" className="w-full flex-col h-24 gap-3 bg-card hover:bg-green-50/50 hover:text-green-600 hover:border-green-200 transition-all group border-border/60 shadow-sm">
                                <div className="p-2 rounded-full bg-green-50 text-green-600 group-hover:scale-110 transition-transform">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-medium">Broadcast</span>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base font-semibold">Recent Check-ins</CardTitle>
                        <Link href="/branch/attendance">
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary px-2">
                                View All <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-1">
                            {loadingStats ? (
                                <div className="py-12 text-center text-xs text-muted-foreground">Loading activity...</div>
                            ) : recentCheckIns.length === 0 ? (
                                <div className="py-12 text-center text-xs text-muted-foreground bg-muted/5 rounded-lg flex flex-col items-center gap-2">
                                    <Clock className="h-8 w-8 opacity-20" />
                                    <span>No recent activity recorded.</span>
                                </div>
                            ) : recentCheckIns.map((item, i) => (
                                <div key={`${item.name}-${item.time}-${i}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border ${
                                                item.status === 'failed'
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : 'bg-zinc-50 text-zinc-700 border-zinc-100 group-hover:border-zinc-200'
                                            }`}
                                        >
                                            {item.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-foreground">{item.name}</p>
                                            <p className="text-[11px] text-muted-foreground capitalize flex items-center gap-1">
                                                {item.method} • <span className={item.status === 'failed' ? 'text-red-500' : 'text-green-600'}>{item.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground bg-white border px-2 py-1 rounded shadow-sm">
                                        {item.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-border/60 flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Expiries & Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6 pt-0">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Expiring Soon
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-5 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100">Next 7 days</Badge>
                            </div>
                            <div className="space-y-2">
                                {loadingStats ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground">Loading...</div>
                                ) : expiringMembers.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border/60">
                                        All memberships are healthy!
                                    </div>
                                ) : expiringMembers.map((m) => (
                                    <div key={m.name} className="flex items-center justify-between p-2 rounded-md hover:bg-amber-50/30 transition-colors border border-transparent hover:border-amber-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-full bg-amber-100/50 text-amber-600">
                                                <CalendarDays className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-sm font-medium">{m.name}</span>
                                        </div>
                                        <span className={`text-xs font-medium ${m.days <= 3 ? 'text-rose-600' : 'text-amber-600'}`}>
                                            {m.days === 0 ? 'Expires Today' : `In ${m.days} days`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Birthdays
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-5 bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-100">This week</Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="py-6 text-center text-xs text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border/60">
                                    No upcoming birthdays.
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
