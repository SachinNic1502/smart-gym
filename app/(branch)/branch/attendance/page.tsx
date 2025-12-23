"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Added missing import
import { Search } from "lucide-react"; // Added missing import
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
            // Need a slight delay to ensure the DOM element is rendered
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
                    () => { } // error handler
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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
                    <p className="text-muted-foreground">
                        Live feed of member check-ins and quick manual overrides.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="default" onClick={() => setIsScannerOpen(true)}>
                        Scan QR Code
                    </Button>
                    <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary">Manual Check-in</Button>
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

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Check-ins today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{loading ? "—" : checkInsToday}</p>
                        <p className="text-[11px] text-muted-foreground">{todayKey}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Denied entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-500">{loading ? "—" : deniedToday}</p>
                        <p className="text-[11px] text-muted-foreground">Failed check-ins</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Average duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{loading ? "—" : averageDurationLabel}</p>
                        <p className="text-[11px] text-muted-foreground">From check-in/out pairs</p>
                    </CardContent>
                </Card>
            </div>

            {error ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-center justify-between gap-3">
                    <span>{error}</span>
                    <Button size="sm" variant="outline" type="button" onClick={loadAttendance}>
                        Retry
                    </Button>
                </div>
            ) : null}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Today's Log</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-9"
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
                                <TableRow>
                                    <TableHead className="pl-6">Time</TableHead>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-10 text-center text-xs text-muted-foreground">
                                            Loading logs...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-10 text-center text-xs text-muted-foreground">
                                            No records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecords.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-mono pl-6 py-4">
                                                {new Date(r.checkInTime).toLocaleTimeString("en-US", {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })}
                                            </TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">{r.memberName}</TableCell>
                                            <TableCell className="whitespace-nowrap">{r.method}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        r.status === "success"
                                                            ? "success"
                                                            : r.status === "failed"
                                                                ? "destructive"
                                                                : "outline"
                                                    }
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
    )
}
