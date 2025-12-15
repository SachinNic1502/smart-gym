"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Users, DollarSign, Activity, Download, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { useToast } from "@/components/ui/toast-provider";
import { dashboardApi, ApiError } from "@/lib/api/client";

interface DashboardStatItem {
    title: string;
    value: string | number;
    change: string;
    trend: "up" | "down";
}

const MEMBER_COMPOSITION_COLORS = ["#22c55e", "#ef4444", "#f97316", "#6366f1"];

export default function ReportsPage() {
    const router = useRouter();
    const toast = useToast();
    const [mounted, setMounted] = useState(false);
    const [superStats, setSuperStats] = useState<DashboardStatItem[] | null>(null);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);
    const [newVsChurned, setNewVsChurned] = useState<{ month: string; newMembers: number; churned: number }[]>([]);
    const [memberComposition, setMemberComposition] = useState<{ name: string; value: number }[]>([]);
    const [topBranches, setTopBranches] = useState<{ name: string; revenue: number; members: number }[]>([]);

    useEffect(() => {
        setMounted(true);
        const fetchStats = async () => {
            try {
                const data = await dashboardApi.getStats("super_admin");
                const cast = data as {
                    stats?: DashboardStatItem[];
                    charts?: {
                        revenueByMonth?: { name: string; revenue: number }[];
                        newVsChurnedByMonth?: { month: string; newMembers: number; churned: number }[];
                        memberComposition?: { name: string; value: number }[];
                        topBranches?: { name: string; revenue: number; members: number }[];
                    };
                };
                if (cast.stats && Array.isArray(cast.stats)) {
                    setSuperStats(cast.stats);
                }
                if (cast.charts?.revenueByMonth && Array.isArray(cast.charts.revenueByMonth)) {
                    setRevenueData(cast.charts.revenueByMonth);
                }
                if (cast.charts?.newVsChurnedByMonth && Array.isArray(cast.charts.newVsChurnedByMonth)) {
                    setNewVsChurned(cast.charts.newVsChurnedByMonth);
                }
                if (cast.charts?.memberComposition && Array.isArray(cast.charts.memberComposition)) {
                    setMemberComposition(cast.charts.memberComposition);
                }
                if (cast.charts?.topBranches && Array.isArray(cast.charts.topBranches)) {
                    setTopBranches(cast.charts.topBranches);
                }
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "Failed to load reports";
                setStatsError(message);
            }
        };

        fetchStats();
    }, []);

    const totalRevenueStat = superStats?.find((s) => s.title === "Global Revenue");
    const totalMembersStat = superStats?.find((s) => s.title === "Total Members");
    const churnRateStat = superStats?.find((s) => s.title === "Churn Rate");
    const avgAttendanceStat = superStats?.find((s) => s.title === "Avg. Attendance");
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Global Reports</h2>
                    <p className="text-muted-foreground">Analytics and performance metrics across all branches.</p>
                </div>
                <div className="flex gap-2">
                    <Select defaultValue="this_year">
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="last_quarter">Last Quarter</SelectItem>
                            <SelectItem value="this_year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                            const stats = superStats || [];
                            const data = [
                                ["Metric", "Value", "Change"],
                                ...stats.map((s) => [s.title, String(s.value), s.change]),
                            ];
                            const csv = data.map((r) => r.join(",")).join("\n");
                            const blob = new Blob([csv], { type: "text/csv" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast({ title: "Exported", description: "Report exported to CSV.", variant: "success" });
                        }}
                        disabled={!superStats || superStats.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {typeof totalRevenueStat?.value === "string" || typeof totalRevenueStat?.value === "number"
                                ? String(totalRevenueStat.value)
                                : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground text-green-600">
                            {totalRevenueStat?.change || ""}
                        </p>
                        <button
                            type="button"
                            className="mt-1 text-[11px] text-primary hover:underline"
                            onClick={() => router.push("/admin/billing")}
                        >
                            View billing & plans
                        </button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {typeof totalMembersStat?.value === "string" || typeof totalMembersStat?.value === "number"
                                ? String(totalMembersStat.value)
                                : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground text-green-600">
                            {totalMembersStat?.change || ""}
                        </p>
                        <button
                            type="button"
                            className="mt-1 text-[11px] text-primary hover:underline"
                            onClick={() => router.push("/admin/branches")}
                        >
                            Review branches
                        </button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {typeof churnRateStat?.value === "string" || typeof churnRateStat?.value === "number"
                                ? String(churnRateStat.value)
                                : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {churnRateStat?.change || ""}
                        </p>
                        <button
                            type="button"
                            className="mt-1 text-[11px] text-primary hover:underline"
                            onClick={() =>
                                toast({
                                    title: "Churn insights",
                                    description: "Churn breakdown will be added in a dedicated analytics view.",
                                    variant: "info",
                                })
                            }
                        >
                            View churn details
                        </button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {typeof avgAttendanceStat?.value === "string" || typeof avgAttendanceStat?.value === "number"
                                ? String(avgAttendanceStat.value)
                                : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {avgAttendanceStat?.change || ""}
                        </p>
                        <button
                            type="button"
                            className="mt-1 text-[11px] text-primary hover:underline"
                            onClick={() =>
                                toast({
                                    title: "Attendance analytics",
                                    description: "Attendance trend breakdown will be added in a dedicated analytics view.",
                                    variant: "info",
                                })
                            }
                        >
                            See attendance trends
                        </button>
                    </CardContent>
                </Card>
            </div>

            {statsError && (
                <p className="text-[11px] text-red-500">{statsError}</p>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>New vs Churned Members</CardTitle>
                        <CardDescription>Net growth across the last 5 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        {!mounted ? (
                            <p className="text-xs text-muted-foreground">Loading chart...</p>
                        ) : newVsChurned.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                No membership trend data available yet.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={newVsChurned}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="newMembers" stroke="#22c55e" strokeWidth={2} />
                                    <Line type="monotone" dataKey="churned" stroke="#ef4444" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Branches</CardTitle>
                        <CardDescription>Ranked by monthly revenue and member base.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topBranches.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                No branch ranking data available yet.
                            </p>
                        ) : (
                            <div className="space-y-3 text-sm">
                                {topBranches.map((b, index) => (
                                    <div
                                        key={b.name}
                                        className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-gray-50"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                #{index + 1} {b.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{b.members} members</p>
                                        </div>
                                        <span className="text-sm font-semibold">₹{b.revenue.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Revenue Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Monthly revenue across all branches</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {!mounted ? (
                            <p className="text-xs text-muted-foreground">Loading chart...</p>
                        ) : revenueData.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                No revenue data available yet.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#888' }} />
                                    <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fill: '#888' }} />
                                    <Tooltip cursor={{ fill: '#f0f0f0' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Member Status Pie */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Member Composition</CardTitle>
                        <CardDescription>Distribution of active vs churned members</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {!mounted ? (
                            <p className="text-xs text-muted-foreground">Loading chart...</p>
                        ) : memberComposition.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                No member composition data available yet.
                            </p>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={memberComposition}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {memberComposition.map((entry, index) => (
                                                <Cell key={entry.name} fill={MEMBER_COMPOSITION_COLORS[index % MEMBER_COMPOSITION_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-4 text-sm mt-4">
                                    {memberComposition.map((item, index) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: MEMBER_COMPOSITION_COLORS[index % MEMBER_COMPOSITION_COLORS.length] }}
                                            ></div>
                                            <span>{item.name}: {item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
