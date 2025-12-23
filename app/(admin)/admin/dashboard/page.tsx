"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, Activity, TrendingUp, Plus, Bell, Download, Sparkles, ArrowRight } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { dashboardApi, ApiError } from "@/lib/api/client";

type TrendDirection = "up" | "down";

interface DashboardStatItem {
    title: string;
    value: string | number;
    change: string;
    trend: TrendDirection;
    icon: typeof Building2;
    color: string;
    gradient: string;
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
                    // Assign colors dynamically for visual variety
                    const colors = [
                        { color: "text-blue-100", gradient: "from-blue-600 to-indigo-600" },
                        { color: "text-emerald-100", gradient: "from-emerald-500 to-teal-600" },
                        { color: "text-violet-100", gradient: "from-violet-600 to-purple-600" },
                        { color: "text-rose-100", gradient: "from-rose-500 to-pink-600" },
                    ];

                    const mapped = cast.stats.map((s, i) => ({
                        ...s,
                        icon: ICON_MAP[s.title] || Building2,
                        color: colors[i % colors.length].color,
                        gradient: colors[i % colors.length].gradient,
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
                            Dashboard
                        </h2>
                        <p className="text-slate-300 mt-2 text-lg font-light">
                            View real-time performance metrics and insights for all gym branches.
                        </p>
                    </div>
                    <div>
                        <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-xl transition-all hover:scale-105 active:scale-95">
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                    </div>
                </div>
            </div>

            {statsError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium shadow-sm mx-1">
                    {statsError}
                </div>
            )}

            {/* Stats Grid - Colorful Cards */}
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
                                    <span className={`flex items-center gap-1 ${stat.trend === 'up' ? 'text-white bg-white/20' : 'text-white bg-white/20'} px-2 py-0.5 rounded-full backdrop-blur-md`}>
                                        {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                                        {stat.change}
                                    </span>
                                    <span className="ml-2 opacity-70">vs previous month</span>
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Quick Actions & Charts Container */}
            <div className="grid gap-8 md:grid-cols-7 px-1">

                {/* Left Column: Quick Actions & Charts */}
                <div className="md:col-span-5 space-y-8">
                    {/* Revenue Chart */}
                    <Card className="border-0 shadow-lg bg-white overflow-hidden">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">Revenue</CardTitle>
                                    <p className="text-sm text-gray-500 mt-1">Monthly revenue breakdown for all branches</p>
                                </div>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">View Details <ArrowRight className="ml-1 h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!mounted ? (
                                <div className="flex h-[350px] items-center justify-center text-gray-400">Loading chart...</div>
                            ) : revenueData.length === 0 ? (
                                <div className="flex h-[350px] items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">No data available.</div>
                            ) : (
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#6B7280"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="#6B7280"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value}`}
                                                dx={-10}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F3F4F6' }}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    padding: '12px'
                                                }}
                                            />
                                            <Bar
                                                dataKey="revenue"
                                                fill="url(#colorRevenue)"
                                                radius={[6, 6, 0, 0]}
                                                barSize={40}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Action Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/admin/branches" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all text-center group-hover:-translate-y-1">
                                <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Add Branch</h3>
                            </div>
                        </Link>
                        <Link href="/admin/billing" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all text-center group-hover:-translate-y-1">
                                <div className="w-12 h-12 mx-auto bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <DollarSign className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Invoices</h3>
                            </div>
                        </Link>
                        <Link href="/admin/settings" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all text-center group-hover:-translate-y-1">
                                <div className="w-12 h-12 mx-auto bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    <Bell className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Notifications</h3>
                            </div>
                        </Link>
                        <Link href="/admin/devices" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all text-center group-hover:-translate-y-1">
                                <div className="w-12 h-12 mx-auto bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Devices</h3>
                            </div>
                        </Link>
                    </div>

                </div>

                {/* Right Column: Recent Activity */}
                <div className="md:col-span-2">
                    <Card className="h-full border-0 shadow-lg bg-white">
                        <CardHeader className="border-b border-gray-100 pb-4">
                            <CardTitle className="text-lg text-gray-800">Recent History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50">
                                {recentActivity.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-gray-400">
                                        No recent history.
                                    </div>
                                ) : (
                                    recentActivity.map((item, i) => (
                                        <div key={`${item.name}-${i}`} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 ring-2 ring-white shadow-sm">
                                                {item.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500 mb-1">{item.action}</p>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                    {item.amount}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 whitespace-nowrap">
                                                {item.time}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-100">
                                <Button variant="outline" size="sm" className="w-full text-xs uppercase tracking-wide">View All History</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
