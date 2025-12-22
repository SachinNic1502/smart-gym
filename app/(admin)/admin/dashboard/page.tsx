"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, Activity, TrendingUp, Plus, Bell, Download, Sparkles } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { dashboardApi, ApiError } from "@/lib/api/client";

type TrendDirection = "up" | "down";

interface DashboardStatItem {
    title: string;
    value: string | number;
    change: string;
    trend: TrendDirection;
    icon: typeof Building2;
}

interface RevenuePoint {
    name: string;
    revenue: number;
}

interface RecentActivityItem {
    name: string;
    action: string;
    amount: string;
    time: string;
}

const ICON_MAP: Record<string, typeof Building2> = {
    "Total Branches": Building2,
    "Total Members": Users,
    "Global Revenue": DollarSign,
    "Active Devices": Activity,
};

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<DashboardStatItem[]>([]);
    const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await dashboardApi.getStats("super_admin");
                const cast = data as {
                    stats?: { title: string; value: string | number; change: string; trend: TrendDirection }[];
                    charts?: { revenueByMonth?: RevenuePoint[] };
                    recentActivity?: RecentActivityItem[];
                };

                if (cast.stats && Array.isArray(cast.stats)) {
                    const mapped = cast.stats.map((s) => ({
                        ...s,
                        icon: ICON_MAP[s.title] || Building2,
                    } satisfies DashboardStatItem));
                    setStats(mapped);
                }

                if (cast.charts?.revenueByMonth && Array.isArray(cast.charts.revenueByMonth)) {
                    setRevenueData(cast.charts.revenueByMonth);
                }

                if (cast.recentActivity && Array.isArray(cast.recentActivity)) {
                    setRecentActivity(cast.recentActivity);
                }
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "Failed to load dashboard stats";
                setStatsError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
            {/* Decorative background elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-400/15 via-teal-400/15 to-cyan-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-gradient-to-br from-amber-400/15 via-orange-400/15 to-rose-400/15 rounded-full blur-3xl animate-pulse delay-2000" />
            </div>

            <div className="space-y-8 animate-in fade-in duration-700 p-6 md:p-8">
                {/* Enhanced Header */}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                                Overview
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm font-medium ml-14">
                            Welcome back, Super Admin. Here's what's happening today.
                        </p>
                    </div>
                    <div className="flex w-full gap-3 sm:w-auto sm:justify-end">
                        <Button size="sm" className="w-full sm:w-auto shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-105 active:scale-95">
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                        </Button>
                    </div>
                </div>

                {statsError && (
                    <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50/50 px-4 py-3 text-sm text-rose-800 shadow-sm">
                        {statsError}
                    </div>
                )}

                {/* Enhanced Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {loading && !stats.length ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <Card
                                key={index}
                                className="relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/50 animate-pulse"
                            >
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/15 to-transparent blur-3xl" />
                                <div className="pointer-events-none absolute -left-12 -bottom-12 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-400/10 to-transparent blur-3xl" />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <div className="h-4 w-28 rounded-full bg-slate-200" />
                                    <div className="h-10 w-10 rounded-2xl bg-slate-200" />
                                </CardHeader>
                                <CardContent>
                                    <div className="h-8 w-20 rounded-lg bg-slate-200 mb-3" />
                                    <div className="h-4 w-24 rounded-full bg-slate-200" />
                                </CardContent>
                            </Card>
                        ))
                    ) : !loading && !stats.length ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-sm text-muted-foreground">
                                No overview stats available yet.
                            </p>
                        </div>
                    ) : (
                        stats.map((stat, index) => (
                            <Card
                                key={stat.title}
                                className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-300/50 hover:ring-primary/20"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Animated gradient background */}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/15 to-transparent blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                <div className="pointer-events-none absolute -left-12 -bottom-12 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-400/10 to-transparent blur-3xl group-hover:scale-150 transition-transform duration-700" />

                                {/* Shine effect */}
                                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                </div>

                                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                        {stat.title}
                                    </CardTitle>
                                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-primary/10">
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative">
                                    <div className="text-3xl font-black tracking-tight bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        {stat.value}
                                    </div>
                                    <p className="text-xs font-semibold flex items-center mt-2 gap-1.5">
                                        {stat.trend === 'up' ? (
                                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                                <TrendingUp className="h-3 w-3" />
                                                {stat.change}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                                                <Activity className="h-3 w-3" />
                                                {stat.change}
                                            </span>
                                        )}
                                    </p>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Enhanced Quick Actions */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Link href="/admin/branches" className="block group">
                        <Card className="h-full border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <Plus className="h-7 w-7 text-primary" />
                                </div>
                                <span className="font-bold text-sm text-slate-700 group-hover:text-primary transition-colors">Add Branch</span>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/admin/billing" className="block group">
                        <Card className="h-full border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm hover:border-emerald-500/50 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <DollarSign className="h-7 w-7 text-emerald-600" />
                                </div>
                                <span className="font-bold text-sm text-slate-700 group-hover:text-emerald-600 transition-colors">Create Invoice</span>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/admin/settings" className="block group">
                        <Card className="h-full border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm hover:border-amber-500/50 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <Bell className="h-7 w-7 text-amber-600" />
                                </div>
                                <span className="font-bold text-sm text-slate-700 group-hover:text-amber-600 transition-colors">Broadcast Alert</span>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/admin/devices" className="block group">
                        <Card className="h-full border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm hover:border-blue-500/50 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <Activity className="h-7 w-7 text-blue-600" />
                                </div>
                                <span className="font-bold text-sm text-slate-700 group-hover:text-blue-600 transition-colors">Device Health</span>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Enhanced Charts Section */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-1 md:col-span-2 lg:col-span-4 border-0 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/50 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                        <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-transparent">
                            <CardTitle className="text-lg font-black tracking-tight">Revenue Overview</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Monthly performance metrics</p>
                        </CardHeader>
                        <CardContent className="pl-0 sm:pl-2 pt-6 relative">
                            {!mounted ? (
                                <div className="flex h-[300px] items-center justify-center">
                                    <div className="text-center space-y-3">
                                        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                                        <p className="text-xs text-muted-foreground font-medium">Loading revenue chart...</p>
                                    </div>
                                </div>
                            ) : revenueData.length === 0 ? (
                                <div className="flex h-[300px] items-center justify-center">
                                    <div className="text-center space-y-2">
                                        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                                            <DollarSign className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium">No revenue data available yet.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                                        <BarChart data={revenueData}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#94a3b8"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                fontWeight={600}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value}`}
                                                fontWeight={600}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                                    padding: '12px 16px',
                                                    fontWeight: 600
                                                }}
                                            />
                                            <Bar dataKey="revenue" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-0 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/50 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                        <CardHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-transparent">
                            <CardTitle className="text-lg font-black tracking-tight">Recent Activity</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Latest transactions and updates</p>
                        </CardHeader>
                        <CardContent className="pt-6 relative">
                            <div className="space-y-6">
                                {recentActivity.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                            <Activity className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium">No recent activity yet.</p>
                                    </div>
                                ) : (
                                    recentActivity.map((item, i) => (
                                        <div key={`${item.name}-${item.time}-${i}`} className="flex flex-col gap-3 sm:flex-row sm:items-center group hover:bg-slate-50/50 p-3 rounded-xl transition-all duration-200 -mx-3">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-primary font-black text-sm ring-2 ring-primary/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-primary/10">
                                                    {item.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="space-y-1 flex-1">
                                                    <p className="text-sm font-bold leading-none text-slate-900">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground font-medium">{item.action}</p>
                                                </div>
                                            </div>
                                            <div className="sm:ml-auto font-bold text-sm text-left sm:text-right">
                                                <div className="text-slate-900">{item.amount}</div>
                                                <div className="text-xs text-muted-foreground font-semibold mt-0.5">{item.time}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
