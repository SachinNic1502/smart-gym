"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    UserCheck,
    Wallet,
    Dumbbell,
    ArrowUpRight,
    Clock,
    MoreVertical,
    CalendarDays,
    AlertTriangle,
    Gift,
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
import { dashboardApi, ApiError } from "@/lib/api/client";
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

const DEFAULT_ATTENDANCE_DATA = [
    { time: '6am', users: 12 },
    { time: '8am', users: 45 },
    { time: '10am', users: 30 },
    { time: '12pm', users: 25 },
    { time: '2pm', users: 20 },
    { time: '4pm', users: 35 },
    { time: '6pm', users: 85 },
    { time: '8pm', users: 60 },
    { time: '10pm', users: 15 },
];

const DEFAULT_RECENT_CHECKINS = [
    { name: "Mike Ross", time: "10:30 AM", method: "Fingerprint", status: "success" },
    { name: "Rachel Green", time: "10:28 AM", method: "QR Code", status: "success" },
    { name: "Harvey Specter", time: "10:25 AM", method: "Fingerprint", status: "success" },
    { name: "Louis Litt", time: "10:22 AM", method: "Denied", status: "failed" },
    { name: "Donna Paulsen", time: "10:15 AM", method: "Fingerprint", status: "success" },
];

const DEFAULT_EXPIRING_MEMBERS = [
    { name: 'Vijay M.', days: 0 },
    { name: 'Sneha K.', days: 2 },
    { name: 'Rahul S.', days: 5 },
];

const DEFAULT_STATS: StatItem[] = [
    {
        title: "Live Check-ins",
        value: "42",
        sub: "Members currently inside",
        icon: UserCheck,
        color: "bg-green-100 text-green-600",
    },
    {
        title: "Today's Collections",
        value: "₹75,500",
        sub: "12 payments received",
        icon: Wallet,
        color: "bg-blue-100 text-blue-600",
    },
    {
        title: "Active Members",
        value: "892",
        sub: "+5 new joinees today",
        icon: Users,
        color: "bg-purple-100 text-purple-600",
    },
    {
        title: "Expiring Soon",
        value: "15",
        sub: "Within next 3 days",
        icon: CalendarDays,
        color: "bg-orange-100 text-orange-600",
    },
    {
        title: "Today Plan Expiry",
        value: "7",
        sub: "Memberships ending today",
        icon: Clock,
        color: "bg-amber-100 text-amber-600",
    },
    {
        title: "Pending Balance",
        value: "₹12,500",
        sub: "Across 5 members",
        icon: AlertTriangle,
        color: "bg-rose-100 text-rose-600",
    },
    {
        title: "Week Collection",
        value: "₹3,40,000",
        sub: "This week's collections",
        icon: Wallet,
        color: "bg-emerald-100 text-emerald-600",
    },
    {
        title: "Month Renewals",
        value: "38",
        sub: "Renewals in current month",
        icon: Users,
        color: "bg-indigo-100 text-indigo-600",
    },
];

export default function BranchDashboard() {
    const toast = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const branchId = user?.branchId;
    const [branchStats, setBranchStats] = useState<BranchStatsResponse | null>(null);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            if (!branchId) {
                setLoadingStats(false);
                return;
            }
            setLoadingStats(true);
            setStatsError(null);
            try {
                const data = await dashboardApi.getStats("branch_admin", branchId);
                setBranchStats(data as BranchStatsResponse);
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "Failed to load branch stats";
                setStatsError(message);
                toast({
                    title: "Error",
                    description: message,
                    variant: "destructive",
                });
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, [branchId, toast]);

    const mappedStats: StatItem[] | null = branchStats
        ? branchStats.stats.map((s) => ({
            title: s.title,
            value: s.value,
            sub: s.sub,
            color: s.color,
            icon: STAT_ICON_MAP[s.title] ?? Users,
        }))
        : null;

    const stats: StatItem[] = mappedStats ?? DEFAULT_STATS;
    const attendanceData = branchStats?.charts.attendanceTrend ?? DEFAULT_ATTENDANCE_DATA;
    const recentCheckIns = branchStats?.recentCheckIns ?? DEFAULT_RECENT_CHECKINS;
    const expiringMembers = branchStats?.expiringMembers ?? DEFAULT_EXPIRING_MEMBERS;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-secondary">Downtown Branch</h2>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, John (Branch Manager)
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/branch/members/add">
                        <Button className="shadow-lg shadow-primary/20">
                            <Users className="mr-2 h-4 w-4" />
                            Add Member
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        className="border-primary/20 text-primary hover:bg-primary/5"
                        type="button"
                        onClick={() => router.push("/branch/payments")}
                    >
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        New Sale
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="hover:shadow-lg transition-all duration-200 border border-gray-100 bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-xl ${stat.color}`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.sub}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>Live Occupancy Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            {!mounted ? (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                    Loading chart...
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={attendanceData}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3A86FF" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3A86FF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="users" stroke="#3A86FF" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm h-full">
                    <CardHeader>
                        <CardTitle>Quick Access</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                        <Link href="/branch/attendance" className="block">
                            <Button variant="outline" className="w-full flex-col h-20 gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                                <UserCheck className="h-6 w-6" />
                                <span className="text-xs">Mark Entry</span>
                            </Button>
                        </Link>
                        <Link href="/branch/expenses" className="block">
                            <Button variant="outline" className="w-full flex-col h-20 gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                <Wallet className="h-6 w-6" />
                                <span className="text-xs">Add Expense</span>
                            </Button>
                        </Link>
                        <Link href="/branch/classes" className="block">
                            <Button variant="outline" className="w-full flex-col h-20 gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200">
                                <Dumbbell className="h-6 w-6" />
                                <span className="text-xs">Book Class</span>
                            </Button>
                        </Link>
                        <Link href="/branch/communications" className="block">
                            <Button variant="outline" className="w-full flex-col h-20 gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200">
                                <Clock className="h-6 w-6" />
                                <span className="text-xs">Broadcast</span>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Check-ins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentCheckIns.map((item, i) => (
                                <div key={`${item.name}-${item.time}-${i}`} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                item.status === 'failed'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {item.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{item.method}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`text-xs font-mono py-1 px-2 rounded-md ${
                                            item.status === 'failed'
                                                ? 'bg-red-50 text-red-600'
                                                : 'text-gray-500 bg-gray-50'
                                        }`}
                                    >
                                        {item.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            type="button"
                            className="w-full mt-4 text-xs text-muted-foreground hover:text-primary"
                            onClick={() =>
                                toast({
                                    title: "Activity feed",
                                    description:
                                        "Full check-in activity view is mock in this demo. This would open a detailed log.",
                                    variant: "info",
                                })
                            }
                        >
                            View All Activity
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle>Membership Expiries & Birthdays</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                    Membership expiring
                                </span>
                                <span className="text-xs text-muted-foreground">Today & next 7 days</span>
                            </div>
                            <div className="space-y-3 text-sm">
                                {expiringMembers.map((m) => (
                                    <div key={m.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4 text-amber-500" />
                                            <span>{m.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {m.days === 0 ? 'Today' : `In ${m.days} days`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                    Birthdays & anniversaries
                                </span>
                                <span className="text-xs text-muted-foreground">This week</span>
                            </div>
                            <div className="space-y-3 text-sm">
                                {[ 
                                    { name: 'Anita D.', type: 'Birthday' },
                                    { name: 'Karan & Meera', type: 'Anniversary' },
                                ].map((m) => (
                                    <div key={m.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Gift className="h-4 w-4 text-pink-500" />
                                            <span>{m.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{m.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
