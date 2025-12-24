"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, UserCheck, XCircle, Clock, QrCode, ScanLine } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, attendanceApi, membersApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { AttendanceMethod, AttendanceRecord, Member } from "@/lib/types";
import { Html5Qrcode } from "html5-qrcode";

export default function AttendancePage() {
    const [isManualOpen, setIsManualOpen] = useState(false);
    const { toast } = useToast();

    const { user } = useAuth();
    const branchId = user?.branchId;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [members, setMembers] = useState<Member[]>([]);

    const [manualMemberId, setManualMemberId] = useState("");
    const [manualReason, setManualReason] = useState("");
    const [manualMethod, setManualMethod] = useState<AttendanceMethod>("Manual");
    const [manualSaving, setManualSaving] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerLoading, setScannerLoading] = useState(false);

    const todayKey = useMemo(() => new Date().toISOString().split("T")[0]!, []);

    const loadAttendance = useCallback(async () => {
        if (!user) {
            setLoading(false);
            setError(null);
            setRecords([]);
            return;
        }

        if (user.role === "branch_admin" && !branchId) {
            setLoading(false);
            setError("Branch not assigned");
            setRecords([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [attendanceRes, membersRes] = await Promise.all([
                attendanceApi.list({
                    branchId: branchId ?? "",
                    date: todayKey,
                    page: "1",
                    pageSize: "200",
                }),
                membersApi.list({
                    branchId: branchId ?? "",
                    page: 1,
                    pageSize: 200,
                } as Record<string, string | number | undefined>),
            ]);

            const data = (attendanceRes.data ?? []) as AttendanceRecord[];
            setRecords(data);
            setMembers((membersRes as unknown as { data: Member[] }).data ?? []);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to load attendance";
            setError(message);
            setRecords([]);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    }, [branchId, todayKey, user]);

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    const filteredRecords = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return records;
        return records.filter((r) =>
            r.memberName.toLowerCase().includes(q) ||
            r.memberId.toLowerCase().includes(q) ||
            r.method.toLowerCase().includes(q)
        );
    }, [records, searchTerm]);

    const checkInsToday = useMemo(() => records.filter((r) => r.status === "success").length, [records]);
    const deniedToday = useMemo(() => records.filter((r) => r.status === "failed").length, [records]);

    const averageDurationLabel = useMemo(() => {
        const withCheckout = records.filter((r) => r.checkOutTime);
        if (!withCheckout.length) return "—";
        const totalMs = withCheckout.reduce((sum, r) => {
            const start = new Date(r.checkInTime).getTime();
            const end = new Date(r.checkOutTime as string).getTime();
            if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return sum;
            return sum + (end - start);
        }, 0);
        const avgMs = Math.round(totalMs / withCheckout.length);
        const hours = Math.floor(avgMs / (1000 * 60 * 60));
        const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} h`;
    }, [records]);

    const resolveMemberId = useCallback((input: string): string | null => {
        const raw = input.trim();
        if (!raw) return null;

        const byId = new Map(members.map((m) => [m.id, m] as const));
        if (byId.has(raw)) return raw;

        if (raw.includes("|")) {
            const first = raw.split("|")[0]?.trim();
            if (first && byId.has(first)) return first;
        }

        const firstToken = raw.split(/\s+/)[0]?.trim();
        if (firstToken && byId.has(firstToken)) return firstToken;

        const normalizedDigits = raw.replace(/\D/g, "");
        if (normalizedDigits.length >= 10) {
            const last10 = normalizedDigits.slice(-10);
            const found = members.find((m) => (m.phone ?? "").replace(/\D/g, "").endsWith(last10));
            if (found) return found.id;
        }

        return null;
    }, [members]);

    const handleManualCheckIn = useCallback(async () => {
        if (!branchId) {
            toast({ title: "Error", description: "Branch not assigned", variant: "destructive" });
            return;
        }

        if (!manualMemberId.trim()) {
            toast({ title: "Missing member", description: "Please select a Member ID", variant: "destructive" });
            return;
        }

        const resolvedMemberId = resolveMemberId(manualMemberId);
        if (!resolvedMemberId) {
            toast({
                title: "Invalid member",
                description: "Select a member from the list or enter a valid Member ID / phone number",
                variant: "destructive",
            });
            return;
        }

        setManualSaving(true);
        try {
            await attendanceApi.checkIn({
                memberId: resolvedMemberId,
                branchId,
                method: manualMethod,
            });

            setIsManualOpen(false);
            setManualMemberId("");
            setManualReason("");
            setManualMethod("Manual");

            toast({
                title: "Manual check-in saved",
                description: manualReason.trim() ? `Saved. Note: ${manualReason.trim()}` : "Saved successfully",
                variant: "success",
            });

            await loadAttendance();
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to record check-in";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setManualSaving(false);
        }
    }, [branchId, loadAttendance, manualMemberId, manualMethod, manualReason, toast]);

    // Handle QR Scan
    const handleQRScan = useCallback(async (memberId: string) => {
        if (!branchId) return;

        setScannerLoading(true);
        try {
            await attendanceApi.checkIn({
                memberId: memberId.trim(),
                branchId,
                method: "QR Code",
            });

            toast({
                title: "Check-in successful",
                description: `Member ${memberId} checked in via QR code`,
                variant: "success",
            });

            setIsScannerOpen(false);
            await loadAttendance();
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "QR Check-in failed";
            toast({ title: "Check-in Failed", description: message, variant: "destructive" });
        } finally {
            setScannerLoading(false);
        }
    }, [branchId, loadAttendance, toast]);

    useEffect(() => {
        let scanner: Html5Qrcode | null = null;

        if (isScannerOpen) {
            const timer = setTimeout(() => {
                scanner = new Html5Qrcode("qr-reader");
                scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText) => {
                        handleQRScan(decodedText);
                    },
                    () => { }
                ).catch(err => {
                    console.error("Scanner error:", err);
                    toast({ title: "Scanner Error", description: "Could not start camera", variant: "destructive" });
                    setIsScannerOpen(false);
                });
            }, 100);

            return () => {
                clearTimeout(timer);
                if (scanner) {
                    scanner.stop().catch(e => console.error("Error stopping scanner", e));
                }
            };
        }
    }, [isScannerOpen, handleQRScan, toast]);

    return (
        <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
                {/* Abstract Background pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
                    <Sparkles className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Check-in Monitor
                        </h2>
                        <p className="text-slate-300 mt-2 text-lg font-light">
                            Live attendance feed and manual entry controls.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setIsScannerOpen(true)}
                            className="bg-emerald-500/80 hover:bg-emerald-500 text-white border border-transparent backdrop-blur-sm shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <QrCode className="mr-2 h-4 w-4" />
                            Scan QR
                        </Button>
                        <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-xl transition-all hover:scale-105 active:scale-95">
                                    <ScanLine className="mr-2 h-4 w-4" />
                                    Manual Entry
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[420px]">
                                <DialogHeader>
                                    <DialogTitle>Manual Check-in</DialogTitle>
                                    <DialogDescription>
                                        Use this when a device fails or you need to override access manually.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="member-id">Member ID</Label>
                                        <Input
                                            id="member-id"
                                            placeholder="e.g. MEM_001"
                                            list="member-id-options"
                                            value={manualMemberId}
                                            onChange={(e) => setManualMemberId(e.target.value)}
                                        />
                                        <datalist id="member-id-options">
                                            {members.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}{m.phone ? ` (${m.phone})` : ""}
                                                </option>
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="method">Method</Label>
                                        <select
                                            id="method"
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                            value={manualMethod}
                                            onChange={(e) => setManualMethod(e.target.value as AttendanceMethod)}
                                        >
                                            <option value="Manual">Manual</option>
                                            <option value="Fingerprint">Fingerprint</option>
                                            <option value="QR Code">QR Code</option>
                                            <option value="Face ID">Face ID</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reason">Reason / Note</Label>
                                        <Input
                                            id="reason"
                                            placeholder="e.g. Device offline"
                                            value={manualReason}
                                            onChange={(e) => setManualReason(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" type="button" onClick={() => setIsManualOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleManualCheckIn}
                                        disabled={manualSaving}
                                    >
                                        {manualSaving ? "Saving..." : "Save Check-in"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                        <DialogContent className="sm:max-w-[420px]">
                            <DialogHeader>
                                <DialogTitle>Scan Member QR</DialogTitle>
                                <DialogDescription>
                                    Align the member's QR code within the frame to check them in.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
                                <div id="qr-reader" className="h-full w-full" />
                                {scannerLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                                        Processing...
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => setIsScannerOpen(false)}>
                                    Cancel
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3 shadow-sm mx-1">
                    <span className="font-medium">{error}</span>
                    <Button size="sm" variant="outline" className="bg-white border-rose-200 text-rose-700 hover:bg-rose-50" onClick={loadAttendance}>
                        Retry
                    </Button>
                </div>
            ) : null}

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-1">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                        <UserCheck className="w-24 h-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium opacity-90 text-emerald-100">Check-ins Today</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <UserCheck className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold tracking-tight">{loading ? "—" : checkInsToday}</div>
                        <p className="text-xs mt-2 flex items-center font-medium opacity-90">
                            <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm text-[10px] text-white/90">
                                <Clock className="h-3 w-3" />
                                {todayKey}
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-red-500 to-pink-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                        <XCircle className="w-24 h-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium opacity-90 text-red-100">Denied Entries</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <XCircle className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold tracking-tight">{loading ? "—" : deniedToday}</div>
                        <p className="text-xs mt-2 flex items-center font-medium opacity-90">
                            <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm text-[10px] text-white/90">
                                Failed attempts
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                        <Clock className="w-24 h-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium opacity-90 text-blue-100">Average Duration</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Clock className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold tracking-tight">{loading ? "—" : averageDurationLabel}</div>
                        <p className="text-xs mt-2 flex items-center font-medium opacity-90">
                            <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm text-[10px] text-white/90">
                                Per session today
                            </span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="px-1">
                <Card className="border-0 shadow-lg bg-white overflow-hidden">
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-gray-800">Today's Log</CardTitle>
                                <CardDescription>Real-time entry and exit logs</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search member, ID or method..."
                                    className="pl-9 bg-white border-gray-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent bg-gray-50/50">
                                        <TableHead className="pl-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Time</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Member</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Method</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-12 text-center text-sm text-gray-400">
                                                Loading logs...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRecords.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-16 text-center text-gray-400">
                                                No records found for today.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRecords.map((r) => (
                                            <TableRow key={r.id} className="hover:bg-gray-50/80 transition-colors border-gray-50">
                                                <TableCell className="font-mono text-sm text-gray-500 pl-6 py-4 whitespace-nowrap">
                                                    {new Date(r.checkInTime).toLocaleTimeString("en-US", {
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                        hour12: true,
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-medium text-sm text-gray-900 py-4 whitespace-nowrap">{r.memberName}</TableCell>
                                                <TableCell className="text-sm text-gray-500 py-4 whitespace-nowrap">
                                                    <Badge variant="outline" className="font-normal text-xs bg-white border-gray-200">
                                                        {r.method}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge
                                                        variant={
                                                            r.status === "success"
                                                                ? "success"
                                                                : r.status === "failed"
                                                                    ? "destructive"
                                                                    : "outline"
                                                        }
                                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${r.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            r.status === 'failed' ? 'bg-red-50 text-red-700 border-red-100' : ''
                                                            }`}
                                                    >
                                                        {r.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
