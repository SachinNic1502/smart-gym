"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Calendar, Clock, Trophy } from "lucide-react";
import { UpcomingClassCard } from "@/components/widgets/upcoming-class-card";
import { ApiError, meApi, attendanceApi, classesApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Member, AttendanceRecord, GymClass } from "@/lib/types";

export default function MemberDashboard() {
    const { user } = useAuth();
    const branchId = user?.branchId;

    const [profile, setProfile] = useState<Member | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            // Fetch profile
            try {
                const profileRes = await meApi.getProfile();
                setProfile(profileRes);
            } catch {
                setProfile(null);
            }

            // Fetch attendance
            try {
                const attendanceRes = await attendanceApi.list({ branchId, page: "1", pageSize: "10" });
                setAttendance(attendanceRes.data ?? []);
            } catch {
                setAttendance([]);
            }

            // Fetch classes
            try {
                const classesRes = await classesApi.list({ branchId, status: "active" });
                setClasses(classesRes.data ?? []);
            } catch {
                setClasses([]);
            }
        } catch (e) {
            console.error("Failed to load dashboard data:", e);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const displayName = profile?.name || user?.name || "Member";
    const firstName = displayName.split(" ")[0];
    const planName = profile?.plan || "No Plan";
    const expiryDate = profile?.expiryDate 
        ? new Date(profile.expiryDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "—";
    const isActive = profile?.status === "Active";

    // Calculate visits this month
    const now = new Date();
    const thisMonthVisits = attendance.filter(a => {
        const checkIn = new Date(a.checkInTime);
        return checkIn.getMonth() === now.getMonth() && checkIn.getFullYear() === now.getFullYear();
    }).length;

    // Get next class
    const nextClass = classes[0];

    // Recent visits (last 3)
    const recentVisits = attendance.slice(0, 3);

    if (loading) {
        return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">

            {/* Welcome Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Hello, {firstName} 👋</h1>
                    <p className="text-muted-foreground text-sm">Let's crush your goals today!</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-md">
                    <img src={profile?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} alt="Profile" />
                </div>
            </div>

            {/* Membership Card */}
            <div className="relative group perspective">
                <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <Card className="relative bg-gradient-to-br from-[#0A2540] to-[#3A86FF] text-white border-none shadow-2xl overflow-hidden rounded-2xl">
                    {/* Decorative circles */}
                    <div className="absolute top-[-50px] right-[-50px] h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-[-20px] left-[-20px] h-32 w-32 rounded-full bg-blue-400/20 blur-2xl"></div>

                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">SmartFit Member</p>
                                <h2 className="text-2xl font-bold tracking-tight">{planName}</h2>
                                <div className="mt-6 flex flex-col gap-1">
                                    <span className="text-xs text-blue-200">{displayName}</span>
                                    <span className="text-sm font-mono tracking-widest opacity-80">ID: {profile?.id?.slice(-8) || "••••••••"}</span>
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded-xl h-28 w-28 flex flex-col items-center justify-center shadow-lg">
                                <QrCode className="h-20 w-20 text-black" />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between items-end">
                            <Badge className={`${isActive ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'} border backdrop-blur-sm`}>
                                {isActive ? "Active" : profile?.status || "Unknown"}
                            </Badge>
                            <span className="text-xs text-blue-200">Valid thru {expiryDate}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <p className="text-xs text-center text-muted-foreground">Scan this QR code at the entrance for access.</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white shadow border-none">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-orange-50 rounded-full mb-2">
                            <Trophy className="h-6 w-6 text-orange-500" />
                        </div>
                        <div className="font-bold text-2xl">{thisMonthVisits}</div>
                        <div className="text-xs text-muted-foreground font-medium">Visits this month</div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow border-none">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-purple-50 rounded-full mb-2">
                            <Calendar className="h-6 w-6 text-purple-500" />
                        </div>
                        <div className="font-bold text-2xl">{classes.length}</div>
                        <div className="text-xs text-muted-foreground font-medium">Classes Available</div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Class */}
            <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-lg">Up Next</h3>
                <a href="/portal/schedule" className="text-xs text-primary hover:underline">View Schedule</a>
            </div>
            {nextClass ? (
                <UpcomingClassCard
                    title={nextClass.name}
                    time={nextClass.schedule?.[0]?.startTime || "TBD"}
                    location={nextClass.type}
                    duration="45 mins"
                    isToday={true}
                />
            ) : (
                <Card className="bg-white shadow-sm border-none">
                    <CardContent className="p-6 text-center text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm">No upcoming classes</p>
                    </CardContent>
                </Card>
            )}

            {/* Recent Activity */}
            <div>
                <h3 className="font-semibold text-lg mb-3 px-1">History</h3>
                <Card className="shadow-sm border-none bg-white">
                    <CardContent className="p-0">
                        {recentVisits.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm">No recent visits</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {recentVisits.map((visit) => (
                                    <div key={visit.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                                <Clock className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Gym Visit</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(visit.checkInTime).toLocaleDateString("en-US", { 
                                                        weekday: "short", 
                                                        month: "short", 
                                                        day: "numeric",
                                                        hour: "numeric",
                                                        minute: "2-digit"
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600 capitalize">
                                            {visit.method}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
