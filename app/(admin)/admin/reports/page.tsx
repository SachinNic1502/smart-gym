"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Users, DollarSign, Activity, Download, Calendar, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, ArrowUpRight, ArrowDownRight, Sparkles, Building2, Layers, MapPin, RefreshCw, Loader2 } from "lucide-react";
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
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { useToast } from "@/components/ui/toast-provider";
import { dashboardApi, branchesApi, ApiError } from "@/lib/api/client";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { Badge } from "@/components/ui/badge";

interface DashboardStatItem {
    title: string;
    value: string | number;
    change: string;
    trend: "up" | "down";
}

const MEMBER_COMPOSITION_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6366f1"];

export default function ReportsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

    const {
        data: dashboardData,
        loading: statsLoading,
        error: statsError,
        selectedBranchId,
        setSelectedBranchId,
        refresh
    } = useDashboard();

    useEffect(() => {
        setMounted(true);
        const loadBranches = async () => {
            try {
                const res = await branchesApi.list();
                setBranches(res.data);
            } catch (err) {
                console.error("Failed to load branches", err);
            }
        };
        loadBranches();
    }, []);

    const selectedBranchName = selectedBranchId === "all"
        ? "Gym Network"
        : branches.find(b => b.id === selectedBranchId)?.name || "Branch";

    // Extract data from the centralized store
    const superStats = dashboardData?.stats || null;
    const revenueData = dashboardData?.charts?.revenueByMonth || [];
    const newVsChurned = dashboardData?.charts?.newVsChurnedByMonth || [];
    const memberComposition = dashboardData?.charts?.memberComposition || [];
    const topBranches = dashboardData?.charts?.topBranches || [];

    const totalRevenueStat = superStats?.find((s) => s.title.toLowerCase().includes("revenue"));
    const totalMembersStat = superStats?.find((s) => s.title.toLowerCase().includes("members"));
    const churnRateStat = superStats?.find((s) => s.title.toLowerCase().includes("churn"));
    const avgAttendanceStat = superStats?.find((s) => s.title.toLowerCase().includes("attendance"));

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-rose-600 via-fuchsia-600 to-indigo-700 text-white p-10 rounded-[2.5rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-12 -translate-y-12">
                    <BarChart3 className="w-80 h-80" />
                </div>
                <div className="relative z-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Activity className="h-7 w-7 text-white" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">
                                {selectedBranchId === 'all' ? 'Network Analytics' : `${selectedBranchName} Reports`}
                            </h2>
                        </div>
                        <p className="text-rose-50 text-xl font-light max-w-2xl leading-relaxed">
                            {selectedBranchId === 'all'
                                ? 'View detailed analytics and performance metrics for your complete gym network.'
                                : `Comprehensive performance metrics and historical data for the ${selectedBranchName} location.`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                            <SelectTrigger className="w-full sm:w-[240px] bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl h-14 px-6 font-black uppercase tracking-widest text-[10px] focus:ring-white/20 shadow-xl transition-all hover:bg-white/20">
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-4 w-4 opacity-70" />
                                    <SelectValue placeholder="All Branches" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-0 shadow-2xl p-2">
                                <SelectItem value="all" className="rounded-xl font-black uppercase tracking-widest text-[10px] py-3 cursor-pointer">
                                    All Locations
                                </SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem
                                        key={branch.id}
                                        value={branch.id}
                                        className="rounded-xl font-black uppercase tracking-widest text-[10px] py-3 cursor-pointer"
                                    >
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/10 flex items-center h-14">
                            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                                <Calendar className="h-4 w-4 opacity-70" />
                                FY 2024-25
                            </Button>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/10 flex items-center h-14">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10 rounded-xl h-12 w-12 flex items-center justify-center"
                                onClick={() => refresh()}
                                disabled={statsLoading}
                            >
                                {statsLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-5 w-5 opacity-70" />
                                )}
                            </Button>
                        </div>
                        <Button
                            className="bg-white text-rose-700 hover:bg-rose-50 font-black px-8 py-7 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest gap-2"
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
                                a.download = `report-${selectedBranchId}-${Date.now()}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                                toast({ title: "Dataset Exported", variant: "success" });
                            }}
                            disabled={!superStats || superStats.length === 0}
                        >
                            <Download className="h-5 w-5" />
                            Export CSV
                        </Button>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-6 md:grid-cols-4 px-1">
                {[
                    { title: 'Total Revenue', stat: totalRevenueStat, icon: DollarSign, color: 'emerald', route: '/admin/billing', label: 'Revenue details' },
                    { title: 'Total Members', stat: totalMembersStat, icon: Users, color: 'blue', route: '/admin/members', label: 'Member details' },
                    { title: 'Churn Rate', stat: churnRateStat, icon: Activity, color: 'rose', action: 'info', label: 'Churn details' },
                    { title: 'Avg. Attendance', stat: avgAttendanceStat, icon: TrendingUp, color: 'indigo', action: 'trend', label: 'Attendance trends' }
                ].map((item, i) => (
                    <Card key={i} className="group border-0 shadow-lg bg-white rounded-[1.5rem] overflow-hidden hover:shadow-2xl transition-all">
                        <CardHeader className="p-7 flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <p className={`text-[10px] font-black text-${item.color}-500 uppercase tracking-widest`}>{item.title}</p>
                                <CardTitle className="text-3xl font-black text-gray-800 tracking-tighter">
                                    {item.stat?.value ? String(item.stat.value) : '—'}
                                </CardTitle>
                            </div>
                            <div className={`p-3 bg-${item.color}-50 rounded-2xl text-${item.color}-600 group-hover:bg-${item.color}-500 group-hover:text-white transition-all`}>
                                <item.icon className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-7 pb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${item.stat?.trend === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {item.stat?.trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                    {item.stat?.change || '0%'}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{item.label}</span>
                            </div>
                            <Button
                                variant="ghost"
                                className={`w-full justify-between h-9 rounded-xl bg-slate-50 text-slate-600 hover:bg-${item.color}-50 hover:text-${item.color}-700 font-bold text-[10px] uppercase tracking-widest px-4 shadow-sm`}
                                onClick={() => item.route ? router.push(item.route) : toast({ title: item.title, description: 'Detailed analytics coming soon.', variant: 'info' })}
                            >
                                {item.route ? 'Open Feed' : 'View Trends'}
                                <ArrowUpRight className="h-3 h-3 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Primary Charts */}
            <div className="grid gap-8 md:grid-cols-2">
                <Card className="border-0 shadow-2xl shadow-indigo-50 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-emerald-500">
                                    <LineChartIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Growth Factors</CardTitle>
                                    <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                        {selectedBranchId === 'all' ? 'Network-wide' : selectedBranchName} Member Retention
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black uppercase text-gray-400">Joined</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                    <span className="text-[10px] font-black uppercase text-gray-400">Churned</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px] p-8">
                        {!mounted ? (
                            <div className="h-full w-full bg-slate-50 animate-pulse rounded-2xl" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={newVsChurned}>
                                    <defs>
                                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1.5rem' }}
                                    />
                                    <Area type="monotone" dataKey="newMembers" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorNew)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    <Area type="monotone" dataKey="churned" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorChurn)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {selectedBranchId === 'all' ? (
                    <Card className="border-0 shadow-2xl shadow-rose-50 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-rose-500">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Top Branches</CardTitle>
                                    <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Branches ranked by revenue</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {topBranches.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                                    <Layers className="h-16 w-16" />
                                    <p className="font-black text-slate-500 uppercase tracking-widest text-lg">No branch data</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {topBranches.map((b, idx) => (
                                        <div key={b.name} className="group flex items-center justify-between p-6 rounded-[1.5rem] bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:-translate-y-1 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-black text-lg">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-800 uppercase text-xs tracking-tight">{b.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Users className="h-3 w-3 text-gray-400" />
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{b.members} MEMBERS</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-black text-gray-900 tracking-tighter">₹{b.revenue.toLocaleString()}</span>
                                                <div className="flex items-center justify-end gap-1 mt-1 text-emerald-500">
                                                    <TrendingUp className="h-3 w-3" />
                                                    <span className="text-[10px] font-black uppercase">Top Performing</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-0 shadow-2xl shadow-indigo-50 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <CardContent className="p-12 h-full flex flex-col justify-center items-center text-center">
                            <div className="p-6 bg-white/20 rounded-full backdrop-blur-xl mb-6">
                                <Sparkles className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Branch Focus Mode</h3>
                            <p className="text-indigo-100 font-bold leading-relaxed max-w-xs">
                                You are currently viewing analytics specific to {selectedBranchName}. Switch back to "All Locations" for cross-branch comparisons.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-8 bg-white/10 hover:bg-white text-white hover:text-indigo-600 border-white/20 font-black uppercase tracking-widest rounded-2xl h-14 px-10"
                                onClick={() => setSelectedBranchId('all')}
                            >
                                Compare Branches
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid gap-8 md:grid-cols-5 px-1">
                {/* Revenue Histogram */}
                <Card className="md:col-span-3 border-0 shadow-2xl shadow-emerald-50 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-indigo-600">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Revenue Trend</CardTitle>
                                <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                    {selectedBranchId === 'all' ? 'Network' : selectedBranchName} Monthly breakdown
                                </CardDescription>
                            </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 px-3 py-1 rounded-lg font-black uppercase tracking-widest text-[9px]">
                            Revenue Growing
                        </Badge>
                    </CardHeader>
                    <CardContent className="h-[350px] p-8 pt-10">
                        {revenueData.length === 0 ? (
                            <div className="h-full flex items-center justify-center opacity-30">Loading data...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc', radius: 12 }}
                                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1.5rem' }}
                                    />
                                    <Bar dataKey="revenue" fill="url(#barGradient)" radius={[12, 12, 0, 0]} />
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#a855f7" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Ecosystem Mix */}
                <Card className="md:col-span-2 border-0 shadow-2xl shadow-indigo-50 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-purple-600">
                                <PieChartIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Member Status</CardTitle>
                                <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Active vs Churned members</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px] p-8">
                        {memberComposition.length === 0 ? (
                            <div className="h-full flex items-center justify-center opacity-30">Loading chart...</div>
                        ) : (
                            <div className="h-full flex flex-col">
                                <div className="flex-1 relative h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={memberComposition}
                                                cx="50%"
                                                cy="90%"
                                                startAngle={180}
                                                endAngle={0}
                                                innerRadius={85}
                                                outerRadius={125}
                                                paddingAngle={4}
                                                dataKey="value"
                                                nameKey="name"
                                                stroke="none"
                                            >
                                                {memberComposition.map((entry, index) => (
                                                    <Cell key={entry.name} fill={MEMBER_COMPOSITION_COLORS[index % MEMBER_COMPOSITION_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '1rem' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-x-0 bottom-4 flex flex-col items-center justify-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Pool</p>
                                        <p className="text-3xl font-black text-gray-800 tracking-tighter">
                                            {memberComposition.reduce((a, b) => a + b.value, 0)}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mt-8">
                                    {memberComposition.map((item, index) => (
                                        <div key={item.name} className="flex flex-col items-center p-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full mb-2" style={{ backgroundColor: MEMBER_COMPOSITION_COLORS[index % MEMBER_COMPOSITION_COLORS.length] }}></div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">{item.name}</p>
                                            <p className="text-sm font-black text-gray-800 tracking-tighter mt-1">{item.value}</p>
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
