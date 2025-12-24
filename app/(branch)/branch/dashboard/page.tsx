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
    Clock,
    CalendarDays,
    ArrowRight,
    TrendingUp,
    AlertCircle,
    Smartphone,
    CreditCard,
    Megaphone,
    Sparkles,
    UserPlus,
    Activity,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    // These will be assigned dynamically based on index
    color: string;
    gradient: string;
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
            <div className="bg-white/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-lg text-xs">
                <p className="font-semibold text-muted-foreground mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="font-bold text-base text-foreground">
                        {payload[0].value} <span className="text-[10px] font-normal text-muted-foreground">users</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const CARD_COLORS = [
    { color: "text-blue-100", gradient: "from-blue-600 to-indigo-600" },
    { color: "text-emerald-100", gradient: "from-emerald-500 to-teal-600" },
    { color: "text-violet-100", gradient: "from-violet-600 to-purple-600" },
    { color: "text-rose-100", gradient: "from-rose-500 to-pink-600" },
];

export default function BranchDashboard() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const branchId = user?.branchId;

    const [mounted, setMounted] = useState(false);
    const [branchName, setBranchName] = useState<string | null>(null);
    const [branchStats, setBranchStats] = useState<BranchStatsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState("day");

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
                dashboardApi.getStats(user?.role, branchId, timeRange),
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
    }, [branchId, user, timeRange]);


    useEffect(() => {
        loadDashboardData();
        // Poll every 30 seconds for live updates
        const interval = setInterval(() => loadDashboardData(true), 30000);
        return () => clearInterval(interval);
    }, [loadDashboardData]);

    const mappedStats: StatItem[] | null = branchStats
        ? branchStats.stats.map((s, i) => ({
            title: s.title,
            value: s.value,
            sub: s.sub,
            icon: STAT_ICON_MAP[s.title] ?? Users,
            // Assign gradient cyclically
            color: CARD_COLORS[i % CARD_COLORS.length].color,
            gradient: CARD_COLORS[i % CARD_COLORS.length].gradient
        }))
        : null;

    const stats: StatItem[] = mappedStats ?? [];
    const attendanceData = branchStats?.charts.attendanceTrend ?? [];
    const recentCheckIns = branchStats?.recentCheckIns ?? [];

    const headerTitle = branchName ?? (branchId ? `Branch ${branchId}` : "Dashboard");
    const headerSubtitle = user ? `Welcome back, ${user.name}` : "Overview of your gym performance";

    return (
        <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
                {/* Abstract Background pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
                    <Sparkles className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            {headerTitle}
                        </h2>
                        <p className="text-slate-300 mt-2 text-lg font-light">
                            {headerSubtitle}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => router.push("/branch/members/add")}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Member
                        </Button>
                        <Button
                            onClick={() => router.push("/branch/payments")}
                            className="bg-emerald-500/80 hover:bg-emerald-500 text-white border border-transparent backdrop-blur-sm shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            New Sale
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium shadow-sm mx-1 flex justify-between items-center">
                    <span>{error}</span>
                    <Button size="sm" variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50" onClick={() => loadDashboardData(false)}>
                        Retry
                    </Button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-1">
                {loading && !stats.length ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className="animate-pulse border-0 shadow-lg h-32 bg-gray-100" />
                    ))
                ) : !loading && !stats.length ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-white rounded-2xl border border-dashed">
                        No stats available yet.
                    </div>
                ) : (
                    stats.map((stat) => (
                        <Card
                            key={stat.title}
                            className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${stat.gradient} text-white overflow-hidden relative group`}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                                <stat.icon className="w-24 h-24" />
                            </div>

                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className={`text-sm font-medium opacity-90 ${stat.color}`}>
                                    {stat.title}
                                </CardTitle>
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <stat.icon className="h-4 w-4 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                                <p className="text-xs mt-2 flex items-center font-medium opacity-90">
                                    <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm text-[10px] text-white/90">
                                        <Activity className="h-3 w-3" />
                                        {stat.sub}
                                    </span>
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-8 md:grid-cols-7 px-1">
                {/* Left Column: Charts & Quick Actions */}
                <div className="md:col-span-5 space-y-8">
                    {/* Occupancy Chart */}
                    <Card className="border-0 shadow-lg bg-white">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-gray-800 flex items-center gap-2">
                                        Occupancy Trend
                                    </CardTitle>
                                    <p className="text-sm text-gray-500 mt-1">Real-time gym traffic view</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={timeRange} onValueChange={setTimeRange}>
                                        <SelectTrigger className="w-[120px] h-8 text-xs bg-white border-gray-200">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="day">Today</SelectItem>
                                            <SelectItem value="week">This Week</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="year">This Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Badge variant="outline" className="font-normal text-xs bg-blue-50 text-blue-700 border-blue-100 px-3 py-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>
                                        Live
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="h-[350px] w-full">
                                {!mounted || loading ? (
                                    <div className="flex h-full items-center justify-center text-gray-400">Loading chart...</div>
                                ) : attendanceData.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                                        No data available.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={attendanceData}
                                            margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                                            <XAxis
                                                dataKey="time"
                                                stroke="#6B7280"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                                minTickGap={30}
                                                tickFormatter={(value) => {
                                                    if (!value) return "";
                                                    const date = new Date(value);
                                                    // If not a parseable date, just return the value string
                                                    if (isNaN(date.getTime())) return value;

                                                    if (timeRange === "day") {
                                                        // "10:30" or "10:30 AM"
                                                        return date.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' });
                                                    }

                                                    if (timeRange === "week") {
                                                        // "Mon", "Tue"
                                                        return date.toLocaleDateString("en-US", { weekday: "short" });
                                                    }

                                                    if (timeRange === "month") {
                                                        // "Week 1", "Week 2"
                                                        const day = date.getDate();
                                                        const week = Math.ceil(day / 7);
                                                        return `Week ${week}`;
                                                    }

                                                    if (timeRange === "year") {
                                                        // "Jan", "Feb"
                                                        return date.toLocaleDateString("en-US", { month: "short" });
                                                    }

                                                    return value;
                                                }}
                                            />
                                            <YAxis
                                                stroke="#6B7280"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                allowDecimals={false}
                                                domain={[0, 'auto']}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                            <Line
                                                type="monotone"
                                                dataKey="users"
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 6, strokeWidth: 4, fill: "#3b82f6", stroke: "#eff6ff" }}
                                                animationDuration={1500}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Action Cards Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/branch/attendance" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all text-center group-hover:-translate-y-1 h-full">
                                <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <UserCheck className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-gray-800 text-sm">Mark Attendance</h3>
                            </div>
                        </Link>
                        <Link href="/branch/expenses" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-rose-200 transition-all text-center group-hover:-translate-y-1 h-full">
                                <div className="w-12 h-12 mx-auto bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-gray-800 text-sm">Add Expense</h3>
                            </div>
                        </Link>
                        <Link href="/branch/classes" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all text-center group-hover:-translate-y-1 h-full">
                                <div className="w-12 h-12 mx-auto bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <Dumbbell className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-gray-800 text-sm">Book Class</h3>
                            </div>
                        </Link>
                        <Link href="/branch/communications" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all text-center group-hover:-translate-y-1 h-full">
                                <div className="w-12 h-12 mx-auto bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Megaphone className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-gray-800 text-sm">Broadcast</h3>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Right Column: Activity & Alerts */}
                <div className="md:col-span-2 space-y-8">
                    {/* Recent Check-ins */}
                    <Card className="border-0 shadow-lg bg-white h-[420px] flex flex-col">
                        <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/50 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base text-gray-800">Recent Entry</CardTitle>
                                <Link href="/branch/attendance" className="text-xs text-blue-600 hover:underline">View All</Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="divide-y divide-gray-50">
                                {loading ? (
                                    <div className="p-8 text-center text-xs text-gray-400">Loading...</div>
                                ) : recentCheckIns.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                                        <Clock className="w-6 h-6 opacity-20" />
                                        No recent activity.
                                    </div>
                                ) : (
                                    recentCheckIns.map((item, i) => (
                                        <div key={`${item.name}-${i}`} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-3">
                                            <div
                                                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border ${item.status === 'failed'
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}
                                            >
                                                {item.name.substring(0, 1)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-sm font-normal text-gray-500 bg-gray-100">
                                                        {item.method}
                                                    </Badge>
                                                    <span className={`text-[10px] font-medium ${item.status === 'failed' ? 'text-red-500' : 'text-emerald-600'}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-mono mt-1">
                                                {item.time}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expiries & Alerts */}
                    <Card className="border-0 shadow-lg bg-white h-[420px] flex flex-col">
                        <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/50 rounded-t-xl">
                            <CardTitle className="text-base text-gray-800">Alerts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* Expiring Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        Expiring
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {loading ? (
                                        <div className="text-xs text-gray-400 text-center py-4">Loading...</div>
                                    ) : expiringSoon.length === 0 ? (
                                        <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-center">
                                            All memberships healthy!
                                        </div>
                                    ) : expiringSoon.map((m) => (
                                        <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                <span className="text-sm font-medium text-gray-700">{m.name}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.days <= 1 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {m.days === 0 ? 'Today' : `${m.days}d left`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Birthdays Section */}
                            {birthdaysThisWeek.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Plus className="w-3.5 h-3.5" />
                                            Birthdays
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {birthdaysThisWeek.map((b) => (
                                            <div key={b.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-pink-50 border border-transparent hover:border-pink-100 transition-all group">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                                                    <span className="text-sm font-medium text-gray-700">{b.name}</span>
                                                </div>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-pink-600">
                                                    {b.days === 0 ? 'Today' : `In ${b.days}d`}
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
        </div>
    );
}
