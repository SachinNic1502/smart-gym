"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Fingerprint, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { attendanceApi } from "@/lib/api/client";
import type { AttendanceRecord } from "@/lib/types";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);

    const fetchAttendance = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        try {
            const result = await attendanceApi.list({ memberId: user.id });
            setRecords(result.data);
        } catch (err) {
            console.error("Failed to fetch attendance:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAttendance();
        }
    }, [user]);

    const handleCheckIn = async () => {
        if (!user || !user.branchId || checkingIn) return;
        setCheckingIn(true);
        try {
            await attendanceApi.checkIn({
                memberId: user.id,
                branchId: user.branchId,
                method: "manual",
                deviceId: "web-portal",
            });
            toast({
                title: "Welcome Back!",
                description: "Your session has started.",
                variant: "success",
            });
            fetchAttendance();
        } catch (err) {
            toast({
                title: "Check-in Failed",
                description: "Please scan your QR code at reception instead.",
                variant: "destructive",
            });
        } finally {
            setCheckingIn(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <Skeleton className="h-48 w-full rounded-3xl" />
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Premium Header & Check-in Zone */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-12">
                    <Card className="border-0 shadow-2xl bg-slate-900 text-white overflow-hidden rounded-[40px] relative group">
                        <div className="absolute top-0 right-0 p-24 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                            <Fingerprint className="w-64 h-64 text-white" />
                        </div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>

                        <CardContent className="p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                            <div className="space-y-4 text-center md:text-left">
                                <Badge className="bg-blue-500/20 text-blue-400 font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full border-0 uppercase">
                                    Gym Access Terminal
                                </Badge>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                    Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Crush It?</span>
                                </h1>
                                <p className="text-slate-400 font-medium max-w-sm">
                                    Your consistency builds your legacy. Check in manually if you're already at the facility.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 w-full md:w-auto">
                                <Button
                                    onClick={handleCheckIn}
                                    disabled={checkingIn}
                                    className="h-20 px-12 rounded-[24px] bg-white text-slate-900 hover:bg-blue-500 hover:text-white font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 group/btn"
                                >
                                    {checkingIn ? (
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                            SYNCING...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <Fingerprint className="w-8 h-8 group-hover/btn:animate-pulse" />
                                            SECURE CHECK-IN
                                        </div>
                                    )}
                                </Button>
                                <p className="text-[10px] text-center font-bold text-slate-500 uppercase tracking-widest">Digital Entry Verification</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* History List */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                        <div className="h-2 w-8 bg-blue-600 rounded-full"></div>
                        Activity Timeline
                    </h3>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold px-3 py-1 border-0 rounded-lg uppercase text-[10px] tracking-widest">
                            {records.length} Sessions
                        </Badge>
                    </div>
                </div>

                {records.length === 0 ? (
                    <div className="p-20 text-center rounded-[40px] border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <div className="bg-white p-6 rounded-3xl shadow-lg w-fit mx-auto mb-6">
                            <Fingerprint className="w-10 h-10 text-slate-300" />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-2">The journey begins today.</h4>
                        <p className="text-slate-400 font-medium italic">Log your first session and start your streak.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {records.map((record, index) => (
                            <Card key={record.id} className="border-0 shadow-lg rounded-[28px] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
                                <div className="flex items-stretch">
                                    <div className={cn(
                                        "w-2 transition-all group-hover:w-4",
                                        record.status === "Present" ? "bg-emerald-500" : "bg-slate-300"
                                    )}></div>
                                    <CardContent className="p-6 md:p-8 flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6",
                                                record.status === "Present" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                                            )}>
                                                <Fingerprint className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-slate-900 mb-1">
                                                    {(() => {
                                                        const d = new Date(record.date);
                                                        return isNaN(d.getTime()) ? "Invalid Date" : format(d, "EEEE, MMMM d");
                                                    })()}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-300" />
                                                        {(() => {
                                                            const d = new Date(record.checkInTime);
                                                            if (!isNaN(d.getTime())) return format(d, "hh:mm a");
                                                            // Fallback for time-only strings
                                                            const t = new Date(`2000-01-01T${record.checkInTime}`);
                                                            return !isNaN(t.getTime()) ? format(t, "hh:mm a") : record.checkInTime;
                                                        })()}
                                                    </span>
                                                    {record.checkOutTime && (
                                                        <span className="flex items-center gap-2">
                                                            <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                                            {(() => {
                                                                const d = new Date(record.checkOutTime);
                                                                if (!isNaN(d.getTime())) return format(d, "hh:mm a");
                                                                // Fallback for time-only strings
                                                                const t = new Date(`2000-01-01T${record.checkOutTime}`);
                                                                return !isNaN(t.getTime()) ? format(t, "hh:mm a") : record.checkOutTime;
                                                            })()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden md:block">
                                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Access Channel</div>
                                                <div className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase">
                                                    <MapPin className="w-3.5 h-3.5" /> {record.method}
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "h-10 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase border-0 flex items-center",
                                                record.status === "Present"
                                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                    : "bg-slate-100 text-slate-400"
                                            )}>
                                                {record.status}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
