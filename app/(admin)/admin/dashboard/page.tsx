"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, Activity, TrendingUp, Plus, Bell } from "lucide-react";
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Overview</h2>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, Super Admin. Here's what's happening today.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm">Download Report</Button>
                </div>
            </div>

            {statsError && (
                <p className="text-[11px] text-red-500">{statsError}</p>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {loading && !stats.length ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className="border border-gray-100 bg-white shadow-sm animate-pulse">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="h-3 w-24 rounded bg-muted" />
                                <div className="h-8 w-8 rounded-xl bg-muted" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-7 w-16 rounded bg-muted mb-2" />
                                <div className="h-3 w-20 rounded bg-muted" />
                            </CardContent>
                        </Card>
                    ))
                ) : !loading && !stats.length ? (
                    <p className="text-xs text-muted-foreground">
                        No overview stats available yet.
                    </p>
                ) : (
                    stats.map((stat) => (
                        <Card key={stat.title} className="hover:shadow-lg transition-all duration-200 border border-gray-100 bg-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <stat.icon className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    {stat.trend === 'up' ? <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : <Activity className="h-3 w-3 text-red-500 mr-1" />}
                                    <span className={stat.trend === 'up' ? "text-green-600" : "text-red-500"}>{stat.change}</span>
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Link href="/admin/branches" className="block">
                    <Card className="hover:bg-gray-50 transition-colors cursor-pointer border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground hover:text-primary">
                            <Plus className="h-8 w-8 mb-2" />
                            <span className="font-semibold">Add Branch</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/billing" className="block">
                    <Card className="hover:bg-gray-50 transition-colors cursor-pointer border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground hover:text-primary">
                            <DollarSign className="h-8 w-8 mb-2" />
                            <span className="font-semibold">Create Invoice</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/settings" className="block">
                    <Card className="hover:bg-gray-50 transition-colors cursor-pointer border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground hover:text-primary">
                            <Bell className="h-8 w-8 mb-2" />
                            <span className="font-semibold">Broadcast Alert</span>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/devices" className="block">
                    <Card className="hover:bg-gray-50 transition-colors cursor-pointer border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground hover:text-primary">
                            <Activity className="h-8 w-8 mb-2" />
                            <span className="font-semibold">Device Health</span>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {!mounted ? (
                            <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">
                                Loading revenue chart...
                            </div>
                        ) : revenueData.length === 0 ? (
                            <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">
                                No revenue data available yet.
                            </div>
                        ) : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `₹${value}`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentActivity.map((item, i) => (
                                <div key={`${item.name}-${item.time}-${i}`} className="flex items-center">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        {item.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.action}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-sm text-right">
                                        <div>{item.amount}</div>
                                        <div className="text-xs text-muted-foreground font-normal">{item.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
