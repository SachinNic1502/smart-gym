"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Calendar, Clock, Trophy, MapPin, ChevronRight, User, Users, Dumbbell, Activity } from "lucide-react";
import { ApiError, meApi, attendanceApi, classesApi, staffApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { Member, AttendanceRecord, GymClass, Staff, ClassSchedule } from "@/lib/types";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { useSettings } from "@/lib/hooks/use-settings";

// Helper to format schedule
const formatSchedule = (schedules: ClassSchedule[]) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return schedules.map(s => `${days[s.dayOfWeek]} ${s.startTime}`).join(", ");
};

export default function MemberDashboard() {
    const { user } = useAuth();
    const { formatDate } = useSettings();
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
            }

            if (attendanceResult.status === "fulfilled") {
                setAttendance(attendanceResult.value.data ?? []);
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
    const expiryDate = profile?.expiryDate ? formatDate(profile.expiryDate) : "—";
    const isActive = profile?.status === "Active";

    const now = new Date();
    const thisMonthVisits = attendance.filter(a => {
        const checkIn = new Date(a.checkInTime);
        if (isNaN(checkIn.getTime())) return false;
        return checkIn.getMonth() === now.getMonth() && checkIn.getFullYear() === now.getFullYear();
    }).length;

    const recentVisits = attendance.slice(0, 3);

    if (loading) {
        return (
            <div className="space-y-10 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-48 rounded-lg" />
                        <Skeleton className="h-5 w-64 rounded-md" />
                    </div>
                </div>
                <Skeleton className="h-64 w-full rounded-3xl" />
                <div className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-40 w-full rounded-2xl" />
                    <Skeleton className="h-40 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-10 shadow-2xl md:px-12">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"></div>

                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 ring-1 ring-inset ring-blue-500/20">
                            Welcome back
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{firstName}</span>
                        </h1>
                        <p className="max-w-md text-slate-400 font-medium">
                            Ready to take your fitness to the next level today?
                        </p>
                    </div>
                    <Link href="/portal/profile">
                        <div className="group relative h-20 w-20 cursor-pointer">
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 blur opacity-40 group-hover:opacity-70 transition duration-500"></div>
                            <div className="relative h-20 w-20 rounded-3xl bg-slate-800 p-1">
                                {profile?.image ? (
                                    <img
                                        src={profile.image}
                                        alt="Profile"
                                        className="h-full w-full rounded-[20px] object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-slate-700 rounded-[20px]">
                                        <User className="h-10 w-10 text-slate-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Membership Card - Premium Version */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 flex">
                    <Card className="w-full relative overflow-hidden rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] text-white">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Trophy className="w-64 h-64 text-white" />
                        </div>
                        <CardContent className="p-10 flex flex-col md:flex-row justify-between h-full gap-8">
                            <div className="flex flex-col justify-between h-full space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                            <Trophy className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <span className="text-sm font-bold uppercase tracking-widest text-blue-400/80">Premium Access</span>
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tight">{planName}</h2>
                                        <p className="text-slate-400 font-medium mt-2">{displayName}</p>
                                    </div>
                                </div>

                                <div className="flex gap-8">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("h-2.5 w-2.5 rounded-full", isActive ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "bg-rose-400")}></div>
                                            <span className={cn("text-sm font-bold", isActive ? "text-emerald-400" : "text-rose-400")}>
                                                {isActive ? "ACTIVE" : profile?.status?.toUpperCase() || "INACTIVE"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Valid Until</span>
                                        <div className="text-sm font-bold text-slate-200">{expiryDate}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-black/40 scale-110 transition-transform hover:scale-125 duration-500">
                                    {user?.id ? (
                                        <QRCodeSVG value={user.id} size={110} level="H" />
                                    ) : (
                                        <div className="h-[110px] w-[110px] flex items-center justify-center bg-slate-100 rounded-xl">
                                            <QrCode className="h-12 w-12 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-slate-500">SCAN AT RECEPTION</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Action Side Stats */}
                <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-6">
                    <Card className="group cursor-default border-0 shadow-xl bg-amber-500 text-white overflow-hidden rounded-3xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <MapPin className="h-16 w-16" />
                        </div>
                        <CardContent className="p-8 flex flex-col justify-between h-full">
                            <span className="text-amber-100 font-bold text-xs uppercase tracking-widest mb-4 block">Visit Count</span>
                            <div>
                                <div className="text-5xl font-black">{thisMonthVisits}</div>
                                <p className="text-amber-100/80 text-sm font-medium mt-1">Visits this month</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Link href="/portal/workouts" className="group">
                        <Card className="h-full border-0 shadow-xl bg-indigo-600 text-white overflow-hidden rounded-3xl hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Dumbbell className="h-16 w-16" />
                            </div>
                            <CardContent className="p-8 flex flex-col justify-between h-full">
                                <span className="text-indigo-100 font-bold text-xs uppercase tracking-widest mb-4 block">Current Plan</span>
                                <div>
                                    <div className="text-3xl font-black">My Training</div>
                                    <p className="text-indigo-100/80 text-sm font-medium mt-1">View workout routine</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Classes Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            Live Classes
                        </h3>
                        <Link href="/portal/schedule" className="text-sm font-bold text-blue-600 hover:underline">Full Schedule</Link>
                    </div>

                    {classes.length === 0 ? (
                        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No classes scheduled today.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {classes.map(cls => (
                                <Card key={cls.id} className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white">
                                    <CardContent className="p-0">
                                        <div className="flex">
                                            <div className="w-2 bg-blue-500 transition-all duration-300 group-hover:w-4"></div>
                                            <div className="flex-1 p-5 flex justify-between items-center">
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{cls.name}</h4>
                                                    <div className="flex items-center gap-3 text-slate-500">
                                                        <Badge variant="secondary" className="bg-slate-100 text-[10px] px-2 py-0">{cls.type}</Badge>
                                                        <span className="flex items-center gap-1.5 text-xs font-medium">
                                                            <Clock className="w-3.5 h-3.5" /> {formatSchedule(cls.schedule)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trainer</p>
                                                    <p className="font-bold text-slate-700">{cls.trainerName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-indigo-600" />
                            </div>
                            Recent Activity
                        </h3>
                        <Link href="/portal/attendance" className="text-sm font-bold text-indigo-600 hover:underline">View All</Link>
                    </div>

                    <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
                        {recentVisits.length === 0 ? (
                            <div className="p-16 text-center">
                                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                    <Clock className="h-8 w-8 text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-medium">Your fitness journey starts here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {recentVisits.map((visit) => (
                                    <div key={visit.id} className="group p-6 flex justify-between items-center hover:bg-slate-50/80 transition-all duration-300">
                                        <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                                <Clock className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-slate-800">Gym Session</p>
                                                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                                    {formatDate(visit.checkInTime)}
                                                    <span className="mx-2 text-slate-200">|</span>
                                                    {(() => {
                                                        const d = new Date(visit.checkInTime);
                                                        const isValid = !isNaN(d.getTime());
                                                        const displayDate = isValid ? d : new Date(`2000-01-01T${visit.checkInTime}`);
                                                        return !isNaN(displayDate.getTime())
                                                            ? displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : visit.checkInTime;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 font-bold px-3 py-1 scale-90">
                                                {visit.method?.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Trainers Section */}
            <section className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-amber-600" />
                    </div>
                    Expert Training Team
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {trainers.map((trainer) => {
                        const isMyTrainer = profile?.trainerId === trainer.id;
                        return (
                            <Card key={trainer.id} className={cn(
                                "group border-0 shadow-lg rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl bg-white",
                                isMyTrainer && "ring-2 ring-blue-500 ring-offset-4"
                            )}>
                                <CardContent className="p-0">
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${trainer.id}`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            alt={trainer.name}
                                        />
                                        {isMyTrainer && (
                                            <div className="absolute top-4 right-4 animate-bounce">
                                                <Badge className="bg-blue-600 text-white font-bold border-0 shadow-lg">MY TRAINER</Badge>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-4 left-4">
                                            <p className="text-white font-black text-xl">{trainer.name}</p>
                                            <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Expert Trainer</p>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <Button className="w-full bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white font-bold rounded-2xl border-0 h-11 transition-all">
                                            Book Session
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
