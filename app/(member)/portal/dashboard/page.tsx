"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Calendar, Clock, Trophy, MapPin, ChevronRight, User, Users, Dumbbell } from "lucide-react";
import { ApiError, meApi, attendanceApi, classesApi, staffApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Member, AttendanceRecord, GymClass, Staff, ClassSchedule } from "@/lib/types";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";

// Helper to format schedule
const formatSchedule = (schedules: ClassSchedule[]) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return schedules.map(s => `${days[s.dayOfWeek]} ${s.startTime}`).join(", ");
};

export default function MemberDashboard() {
    const { user } = useAuth();
    const branchId = user?.branchId;

    const [profile, setProfile] = useState<Member | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [trainers, setTrainers] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);

        try {
            const [profileResult, attendanceResult, classesResult, trainersResult] = await Promise.allSettled([
                meApi.getProfile(),
                attendanceApi.list({ branchId, page: "1", pageSize: "10" }),
                classesApi.list({ branchId, page: "1", pageSize: "5" }),
                staffApi.list({ branchId, role: "trainer", page: "1", pageSize: "5" }),
            ]);

            if (profileResult.status === "fulfilled") {
                setProfile(profileResult.value);
            } else {
                console.error("Failed to load profile", profileResult.reason);
                setProfile(null);
            }

            if (attendanceResult.status === "fulfilled") {
                setAttendance(attendanceResult.value.data ?? []);
            } else {
                console.error("Failed to load attendance", attendanceResult.reason);
                setAttendance([]);
            }

            if (classesResult.status === "fulfilled") {
                setClasses(classesResult.value.data ?? []);
            }

            if (trainersResult.status === "fulfilled") {
                setTrainers(trainersResult.value.data ?? []);
            }

        } catch (e) {
            console.error("Unexpected error loading dashboard data:", e);
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

    // Recent visits (last 3)
    const recentVisits = attendance.slice(0, 3);

    if (loading) {
        return (
            <div className="space-y-6 pb-24 md:pb-0">
                <div className="flex items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full ml-auto" />
                </div>
                <Skeleton className="h-56 w-full rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24 md:pb-0 animate-in fade-in duration-500">

            {/* Welcome Header */}
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm sticky top-0 z-10 lg:static lg:bg-transparent lg:shadow-none lg:p-0 lg:border-none">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hello, {firstName} 👋</h1>
                    <p className="text-muted-foreground text-sm font-medium">Let's crush your goals today!</p>
                </div>
                <Link href="/portal/profile">
                    <div className="h-11 w-11 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform cursor-pointer">
                        {profile?.image ? (
                            <img
                                src={profile.image}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-slate-200">
                                <User className="h-6 w-6 text-slate-400" />
                            </div>
                        )}
                    </div>
                </Link>
            </div>

            {/* Membership Card */}
            <div className="relative group perspective">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <Card className="relative bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] text-white border-white/10 shadow-2xl overflow-hidden rounded-3xl">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                    <div className="absolute inset-0 bg-noise opacity-5 mix-blend-overlay"></div>

                    <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between min-h-[220px]">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-blue-400/30 text-blue-200 bg-blue-400/10 text-[10px] uppercase tracking-wider px-2 py-0.5">
                                        Premium Member
                                    </Badge>
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-white">{planName}</h2>
                                <p className="text-blue-200/80 text-sm font-medium pt-1">{displayName}</p>
                            </div>
                            <div className="bg-white p-2.5 rounded-2xl h-[100px] w-[100px] flex flex-col items-center justify-center shadow-lg shadow-black/20">
                                {user?.id ? (
                                    <QRCodeSVG value={user.id} size={80} level="H" />
                                ) : (
                                    <QrCode className="h-full w-full text-slate-900" />
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-end mt-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Status</span>
                                <Badge className={`${isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'} border backdrop-blur-md px-3 py-1`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`}></span>
                                    {isActive ? "Active" : profile?.status || "Inactive"}
                                </Badge>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-0.5">Expires</span>
                                <span className="text-sm font-mono text-zinc-200 font-medium bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                    {expiryDate}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/30 py-2 rounded-lg border border-border/50">
                <QrCode className="w-3 h-3" />
                <span>Show this QR code at the reception for seamless entry</span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white hover:bg-slate-50 transition-colors border-slate-100 shadow-sm group cursor-default">
                    <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="p-3 bg-amber-50 group-hover:bg-amber-100 transition-colors rounded-2xl border border-amber-100">
                            <Trophy className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <div className="font-bold text-3xl text-slate-800">{thisMonthVisits}</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Visits this month</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white hover:bg-slate-50 transition-colors border-slate-100 shadow-sm group cursor-pointer" onClick={() => window.location.href = '/portal/workouts'}>
                    <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="p-3 bg-violet-50 group-hover:bg-violet-100 transition-colors rounded-2xl border border-violet-100">
                            <Calendar className="h-6 w-6 text-violet-500" />
                        </div>
                        <div>
                            <div className="font-bold text-3xl text-slate-800">Plan</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">My Workouts</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Classes */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Available Classes
                    </h3>
                    {classes.length === 0 ? (
                        <Card className="border-dashed border-2 shadow-none bg-slate-50">
                            <CardContent className="p-6 text-center text-muted-foreground text-sm">
                                No classes scheduled at this branch currently.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {classes.map(cls => (
                                <Card key={cls.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-all">
                                    <div className="p-4 flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{cls.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-5">{cls.type}</Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {formatSchedule(cls.schedule)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-medium text-slate-500">Trainer</div>
                                            <div className="text-sm font-semibold">{cls.trainerName}</div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Trainers */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-primary" />
                        Meet Our Trainers
                    </h3>
                    {trainers.length === 0 ? (
                        <Card className="border-dashed border-2 shadow-none bg-slate-50">
                            <CardContent className="p-6 text-center text-muted-foreground text-sm">
                                No trainers info available.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {trainers
                                .sort((a, b) => (profile?.trainerId === a.id ? -1 : profile?.trainerId === b.id ? 1 : 0))
                                .map(trainer => {
                                    const isMyTrainer = profile?.trainerId === trainer.id;
                                    return (
                                        <Card key={trainer.id} className={`overflow-hidden hover:bg-slate-50 transition-colors ${isMyTrainer ? 'border-primary/50 bg-primary/5' : ''}`}>
                                            <div className="p-3 flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg border-2 border-white shadow-sm">
                                                    {trainer.avatar ? <img src={trainer.avatar} className="w-full h-full object-cover rounded-full" /> : trainer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900">{trainer.name}</h4>
                                                        {isMyTrainer && <Badge className="text-[10px] h-5 bg-primary/80">My Trainer</Badge>}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold text-primary/80">Expert Trainer</p>
                                                </div>
                                                <Button variant="ghost" size="sm" className="ml-auto text-xs">View Profile</Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <section>
                <div className="flex items-center justify-between px-1 mb-3">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Recent Activity
                    </h3>
                    <Link href="/portal/attendance" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5">
                        View History <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                <Card className="shadow-sm border-slate-100 bg-white overflow-hidden">
                    <CardContent className="p-0">
                        {recentVisits.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground">
                                <Clock className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                                <p className="text-sm font-medium text-slate-600">No recent visits</p>
                                <p className="text-xs text-slate-400 mt-1">Your check-ins will appear here</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentVisits.map((visit) => (
                                    <div key={visit.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                <Clock className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">Gym Visit</p>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                                    {new Date(visit.checkInTime).toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                    <span className="text-slate-300">•</span>
                                                    {new Date(visit.checkInTime).toLocaleTimeString("en-US", {
                                                        hour: "numeric",
                                                        minute: "2-digit"
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono text-[10px] tracking-wide uppercase border-slate-200">
                                            {visit.method}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
