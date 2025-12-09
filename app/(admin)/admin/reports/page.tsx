"use client";

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

const REVENUE_DATA = [
    { name: 'Jan', value: 45000 },
    { name: 'Feb', value: 52000 },
    { name: 'Mar', value: 48000 },
    { name: 'Apr', value: 61000 },
    { name: 'May', value: 55000 },
    { name: 'Jun', value: 67000 },
    { name: 'Jul', value: 72000 },
    { name: 'Aug', value: 85000 },
    { name: 'Sep', value: 92000 },
];

const CHURN_DATA = [
    { name: 'Active', value: 850, color: '#22c55e' },
    { name: 'Churned', value: 45, color: '#ef4444' },
    { name: 'Expired', value: 120, color: '#f97316' },
];

const NEW_MEMBERS_DATA = [
    { month: 'Jan', newMembers: 210, churned: 18 },
    { month: 'Feb', newMembers: 240, churned: 20 },
    { month: 'Mar', newMembers: 260, churned: 22 },
    { month: 'Apr', newMembers: 280, churned: 25 },
    { month: 'May', newMembers: 310, churned: 28 },
];

const BRANCH_RANKING = [
    { name: 'FitStop Downtown', revenue: '₹9,20,000', members: 892 },
    { name: 'Iron Gym East', revenue: '₹7,80,000', members: 650 },
    { name: 'Flex Studio', revenue: '₹5,40,000', members: 410 },
];

export default function ReportsPage() {
    const router = useRouter();
    const toast = useToast();
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
                        onClick={() =>
                            toast({
                                title: "Export PDF",
                                description: "Report export is mock-only right now.",
                                variant: "info",
                            })
                        }
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
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
                        <div className="text-2xl font-bold">₹85,45,000</div>
                        <p className="text-xs text-muted-foreground text-green-600">+15% from last year</p>
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
                        <div className="text-2xl font-bold">3,450</div>
                        <p className="text-xs text-muted-foreground text-green-600">+124 new this month</p>
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
                        <div className="text-2xl font-bold">4.2%</div>
                        <p className="text-xs text-muted-foreground text-red-500">+0.8% increase</p>
                        <button
                            type="button"
                            className="mt-1 text-[11px] text-primary hover:underline"
                            onClick={() =>
                                toast({
                                    title: "Churn insights",
                                    description: "Detailed churn breakdown will be available once analytics are connected (mock).",
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
                        <div className="text-2xl font-bold">68%</div>
                        <p className="text-xs text-muted-foreground text-green-600">Daily active users</p>
                        <button
                            type="button"
                            className="mt-1 text-[11px] text-primary hover:underline"
                            onClick={() =>
                                toast({
                                    title: "Attendance analytics",
                                    description: "Richer attendance trends across branches will be added later (mock-only).",
                                    variant: "info",
                                })
                            }
                        >
                            See attendance trends
                        </button>
                    </CardContent>
                </Card>
            </div>

            <p className="text-[11px] text-muted-foreground">
                All metrics and charts below use sample mock data for demo purposes. Connect your real data
                sources to power production reports.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>New vs Churned Members</CardTitle>
                        <CardDescription>Net growth across the last 5 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={NEW_MEMBERS_DATA}>
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Branches</CardTitle>
                        <CardDescription>Ranked by monthly revenue and member base.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            {BRANCH_RANKING.map((b, index) => (
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
                                    <span className="text-sm font-semibold">{b.revenue}</span>
                                </div>
                            ))}
                        </div>
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
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={REVENUE_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#888' }} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fill: '#888' }} />
                                <Tooltip cursor={{ fill: '#f0f0f0' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Member Status Pie */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Member Composition</CardTitle>
                        <CardDescription>Distribution of active vs churned members</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={CHURN_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {CHURN_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 text-sm mt-4">
                            {CHURN_DATA.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span>{item.name}: {item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
