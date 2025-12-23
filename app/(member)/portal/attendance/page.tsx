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
            // Simulate device ID or method
            await attendanceApi.checkIn({
                memberId: user.id,
                branchId: user.branchId,
                method: "manual",
                deviceId: "web-portal",
            });
            toast({
                title: "Success",
                description: "Checked in successfully",
                variant: "success",
            });
            fetchAttendance();
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to check in",
                variant: "destructive",
            });
        } finally {
            setCheckingIn(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your gym visits and check in.
                    </p>
                </div>
            </div>

            {/* Check In Action */}
            <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden relative">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 translate-x-12" />
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Ready to Workout?</h2>
                        <p className="text-primary-foreground/80 max-w-md">
                            Check in now to log your session. Consistency is key to achieving your goals!
                        </p>
                    </div>
                    <Button
                        size="lg"
                        variant="secondary"
                        className="h-16 px-8 text-lg font-bold shadow-xl hover:scale-105 transition-transform"
                        onClick={handleCheckIn}
                        disabled={checkingIn}
                    >
                        {checkingIn ? "Checking in..." : "Check In Now"}
                    </Button>
                </CardContent>
            </Card>

            {/* History List */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold">Recent Activity</h3>
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading history...</div>
                ) : records.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No attendance records found.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {records.map((record) => (
                            <Card key={record.id} className="overflow-hidden hover:bg-slate-50 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <Fingerprint className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">
                                                {format(new Date(record.date), "EEEE, MMMM d, yyyy")}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {format(new Date(record.checkInTime), "h:mm a")}
                                                </span>
                                                {record.checkOutTime && (
                                                    <span className="flex items-center gap-1">
                                                        - {format(new Date(record.checkOutTime), "h:mm a")}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {record.method}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <Badge variant={record.status === "Present" ? "success" : "secondary"}>
                                            {record.status}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
