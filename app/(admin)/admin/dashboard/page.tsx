"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const data = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
    { name: 'Jul', revenue: 3490 },
    { name: 'Aug', revenue: 4200 },
    { name: 'Sep', revenue: 5100 },
];

export default function SuperAdminDashboard() {
    const stats = [
        {
            title: "Total Branches",
            value: "12",
            change: "+2 this month",
            icon: Building2,
            trend: "up",
        },
        {
            title: "Total Members",
            value: "3,450",
            change: "+12% vs last month",
            icon: Users,
            trend: "up",
        },
        {
            title: "Global Revenue",
            value: "₹85,45,000",
            change: "+8.2% vs last month",
            icon: DollarSign,
            trend: "up",
        },
        {
            title: "Active Devices",
            value: "28/30",
            change: "2 offline",
            icon: Activity,
            trend: "down",
        },
    ];

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
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition">Download Report</button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
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
                ))}
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
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
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
                    </CardContent>
                </Card>

                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[
                                { name: "FitStop Downtown", action: "Subscription Renewal", amount: "+₹24,999", time: "2 min ago" },
                                { name: "Iron Gym East", action: "New Branch Setup", amount: "+₹1,49,999", time: "1 hour ago" },
                                { name: "Flex Studio", action: "Device Added", amount: "Active", time: "3 hours ago" },
                                { name: "FitStop Downtown", action: "Member limit reached", amount: "Alert", time: "5 hours ago" },
                                { name: "Iron Gym North", action: "Monthly Payment", amount: "+₹24,999", time: "Yesterday" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center">
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
