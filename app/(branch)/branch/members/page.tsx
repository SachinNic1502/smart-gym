"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, FileDown, Filter, MessageCircle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CalendarCheck, User, Dumbbell, Utensils } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, attendanceApi, membersApi, paymentsApi, plansApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { AttendanceRecord, DietPlan, Member, Payment, WorkoutPlan } from "@/lib/types";

// Types
interface MemberProgram {
    workoutPlanId?: string;
    dietPlanId?: string;
}

export default function MembersPage() {
    const { user } = useAuth();
    const branchId = user?.branchId;

    const [searchTerm, setSearchTerm] = useState("");

    const [members, setMembers] = useState<Member[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
    const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    const filteredMembers = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return members;
        return members.filter((m) =>
            m.name.toLowerCase().includes(q) ||
            (m.email ?? "").toLowerCase().includes(q)
        );
    }, [members, searchTerm]);

    // Member State
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [memberPrograms, setMemberPrograms] = useState<Record<string, MemberProgram>>({});
    const [programSaveMessage, setProgramSaveMessage] = useState<string | null>(null);
    const toast = useToast();

    const [memberAttendance, setMemberAttendance] = useState<AttendanceRecord[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);

    const [memberPayments, setMemberPayments] = useState<Payment[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [paymentsError, setPaymentsError] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        if (!user) {
            setMembers([]);
            setTotal(0);
            setLoading(false);
            return;
        }

        if (user.role === "branch_admin" && !branchId) {
            setError("Branch not assigned");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await membersApi.list({
                branchId,
                search: searchTerm || undefined,
                page: 1,
                pageSize: 50,
            } as Record<string, string | number | undefined>);

            setMembers(res.data);
            setTotal(res.total);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to fetch members";
            setError(message);
            setMembers([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [branchId, searchTerm, user]);

    const fetchPlans = useCallback(async () => {
        setLoadingPlans(true);
        try {
            const [w, d] = await Promise.all([
                plansApi.getWorkoutPlans(),
                plansApi.getDietPlans(),
            ]);
            setWorkoutPlans(w.data);
            setDietPlans(d.data);
        } catch {
            setWorkoutPlans([]);
            setDietPlans([]);
        } finally {
            setLoadingPlans(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const loadMemberAttendance = useCallback(async (member: Member) => {
        setAttendanceLoading(true);
        setAttendanceError(null);
        try {
            const res = await attendanceApi.list({
                branchId: member.branchId,
                memberId: member.id,
                page: "1",
                pageSize: "25",
            });
            setMemberAttendance((res.data ?? []) as AttendanceRecord[]);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to fetch attendance";
            setAttendanceError(message);
            setMemberAttendance([]);
        } finally {
            setAttendanceLoading(false);
        }
    }, []);

    const loadMemberPayments = useCallback(async (member: Member) => {
        setPaymentsLoading(true);
        setPaymentsError(null);
        try {
            const res = await paymentsApi.list({
                branchId: member.branchId,
                memberId: member.id,
                page: "1",
                pageSize: "25",
            });
            setMemberPayments(res.data ?? []);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to fetch payments";
            setPaymentsError(message);
            setMemberPayments([]);
        } finally {
            setPaymentsLoading(false);
        }
    }, []);

    const handleManageMember = useCallback(async (member: Member) => {
        setSelectedMember(member);
        setProgramSaveMessage(null);

        setAttendanceError(null);
        setPaymentsError(null);

        setAttendanceLoading(true);
        setPaymentsLoading(true);

        try {
            const [programs, attendanceRes, paymentsRes] = await Promise.all([
                membersApi.getPrograms(member.id),
                attendanceApi.list({
                    branchId: member.branchId,
                    memberId: member.id,
                    page: "1",
                    pageSize: "25",
                }),
                paymentsApi.list({
                    branchId: member.branchId,
                    memberId: member.id,
                    page: "1",
                    pageSize: "25",
                }),
            ]);

            const workoutPlanId = (programs.workoutPlan as any)?.id as string | undefined;
            const dietPlanId = (programs.dietPlan as any)?.id as string | undefined;

            setMemberPrograms((prev) => ({
                ...prev,
                [member.id]: {
                    workoutPlanId,
                    dietPlanId,
                },
            }));

            setMemberAttendance((attendanceRes.data ?? []) as AttendanceRecord[]);
            setMemberPayments(paymentsRes.data ?? []);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to load member details";
            toast({ title: "Error", description: message, variant: "destructive" });

            setMemberPrograms((prev) => ({
                ...prev,
                [member.id]: prev[member.id] ?? {},
            }));
            setMemberAttendance([]);
            setMemberPayments([]);
        } finally {
            setAttendanceLoading(false);
            setPaymentsLoading(false);
        }
    }, [toast]);

    const handleProgramChange = (memberId: string, field: "workoutPlanId" | "dietPlanId", value: string) => {
        setMemberPrograms((prev) => ({
            ...prev,
            [memberId]: {
                ...(prev[memberId] || {}),
                [field]: value,
            },
        }));
    };

     const handleBlockMember = async (member: Member) => {
         try {
             await membersApi.update(member.id, { status: "Cancelled" });
             toast({
                 title: "Member Blocked",
                 description: `${member.name} has been blocked (status set to Cancelled).`,
                 variant: "success",
             });
             // Refresh members list to reflect the status change
             fetchMembers();
         } catch (e) {
             const message = e instanceof ApiError ? e.message : "Failed to block member";
             toast({ title: "Error", description: message, variant: "destructive" });
         }
     };

    const handleSavePrograms = useCallback(async (memberId: string) => {
        const entry = memberPrograms[memberId] || {};
        try {
            await membersApi.assignPrograms(memberId, {
                workoutPlanId: entry.workoutPlanId || undefined,
                dietPlanId: entry.dietPlanId || undefined,
            });
            const message = "Programs assigned successfully";
            setProgramSaveMessage(message);
            toast({ title: "Programs saved", description: message, variant: "success" });
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to assign programs";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    }, [memberPrograms, toast]);

    const resolveWorkoutPlanName = useCallback((planId?: string) => {
        if (!planId) return null;
        return workoutPlans.find((p) => p.id === planId)?.name ?? planId;
    }, [workoutPlans]);

    const resolveDietPlanName = useCallback((planId?: string) => {
        if (!planId) return null;
        return dietPlans.find((p) => p.id === planId)?.name ?? planId;
    }, [dietPlans]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Members</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your gym members, plans, and access.
                    </p>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                    <Button variant="outline" className="shadow-sm">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Messages
                    </Button>
                    <Button variant="outline" className="shadow-sm">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Link href="/branch/members/add">
                        <Button className="shadow-md shadow-primary/20">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Member
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="border-dashed border-primary/20 bg-primary/5 shadow-none">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3 px-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <UserPlus className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                Quick Onboarding
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Add Member → Assign Membership → Assign Workout & Diet programs.
                            </p>
                        </div>
                    </div>
                    <Link href="/branch/members/add">
                        <Button size="sm" variant="secondary" className="bg-white hover:bg-white/90 shadow-sm border border-primary/10 text-primary">Start onboarding</Button>
                    </Link>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b bg-zinc-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="whitespace-nowrap text-lg">All Members</CardTitle>
                            <CardDescription className="text-xs">
                                Showing {loading ? "..." : filteredMembers.length} active records
                            </CardDescription>
                        </div>
                        <div className="flex w-full sm:w-auto gap-2">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email..."
                                    className="pl-9 h-9 bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="h-9 px-3">
                                <Filter className="h-4 w-4 mr-2" /> Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {error ? (
                        <div className="m-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3">
                            <span>{error}</span>
                            <Button size="sm" variant="outline" className="h-8 bg-white border-rose-200 hover:bg-rose-50 text-rose-700" onClick={fetchMembers}>
                                Retry
                            </Button>
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground text-sm">Loading members...</div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                                <User className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-base font-medium text-foreground">No members found</p>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                    We couldn't find any members matching your search. Try adjusting filters or add a new member.
                                </p>
                            </div>
                            <Link href="/branch/members/add">
                                <Button size="sm" className="mt-2">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Member
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-zinc-50/50">
                                    <TableHead className="w-[250px] font-semibold text-xs uppercase tracking-wider text-muted-foreground pl-6">Member</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Plan</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Expiry</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Last Visit</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Programs</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMembers.map((member) => (
                                    <TableRow key={member.id} className="hover:bg-zinc-50/50 transition-colors group cursor-pointer" onClick={() => handleManageMember(member)}>
                                        <TableCell className="pl-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-border">
                                                    <AvatarImage src={member.image} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                                        {member.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{member.name}</div>
                                                    <div className="text-xs text-muted-foreground">{member.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal text-zinc-600 bg-zinc-50">
                                                {member.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground font-mono">
                                            {member.expiryDate ? member.expiryDate.split("T")[0] : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground font-mono">
                                            {member.lastVisit ? member.lastVisit.split("T")[0] : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {memberPrograms[member.id]?.workoutPlanId ? (
                                                    <Badge variant="secondary" className="px-1.5 py-0.5 h-5 text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100">
                                                        W
                                                    </Badge>
                                                ) : null}
                                                {memberPrograms[member.id]?.dietPlanId ? (
                                                    <Badge variant="secondary" className="px-1.5 py-0.5 h-5 text-[10px] bg-green-50 text-green-700 hover:bg-green-100 border-green-100">
                                                        D
                                                    </Badge>
                                                ) : null}
                                                {!memberPrograms[member.id]?.workoutPlanId &&
                                                    !memberPrograms[member.id]?.dietPlanId && (
                                                        <span className="text-xs text-muted-foreground italic">None</span>
                                                    )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={member.status === "Active" ? "success" : "destructive"}
                                                className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5"
                                            >
                                                {member.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground"
                                                    onClick={() => handleManageMember(member)}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                                <Link href={`/branch/members/${member.id}/membership`}>
                                                    <Button variant="outline" size="sm" type="button">
                                                        Renew
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    type="button"
                                                    onClick={() => handleBlockMember(member)}
                                                >
                                                    Block
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Member Details Sheet/Dialog */}
            <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 pb-4 border-b bg-zinc-50/50">
                        <div className="flex items-center gap-5">
                            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                                <AvatarImage src={selectedMember?.image} />
                                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                    {selectedMember?.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <DialogTitle className="text-xl font-bold">{selectedMember?.name}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline" className="font-mono text-xs text-muted-foreground bg-white">
                                        {selectedMember?.id}
                                    </Badge>
                                    <span>•</span>
                                    <span>{selectedMember?.email}</span>
                                </DialogDescription>
                            </div>
                            <div className="ml-auto">
                                <Badge
                                    variant={selectedMember?.status === "Active" ? "success" : "destructive"}
                                    className="text-sm px-3 py-1 uppercase tracking-wide"
                                >
                                    {selectedMember?.status}
                                </Badge>
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs defaultValue="profile" className="w-full">
                        <div className="px-6 border-b bg-white">
                            <TabsList className="w-full justify-start h-12 bg-transparent p-0 space-x-6">
                                <TabsTrigger 
                                    value="profile" 
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-none"
                                >
                                    <User className="h-4 w-4 mr-2" /> Profile
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="attendance" 
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-none"
                                >
                                    <CalendarCheck className="h-4 w-4 mr-2" /> Attendance
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="payments" 
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-none"
                                >
                                    <CreditCard className="h-4 w-4 mr-2" /> Payments
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="programs" 
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-none"
                                >
                                    <Dumbbell className="h-4 w-4 mr-2" /> Programs
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6 bg-white min-h-[300px]">
                            <TabsContent value="profile" className="space-y-6 mt-0">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Full Name</Label>
                                        <Input value={selectedMember?.name ?? ""} readOnly className="bg-zinc-50 border-zinc-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Email</Label>
                                        <Input value={selectedMember?.email ?? ""} readOnly className="bg-zinc-50 border-zinc-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Current Plan</Label>
                                        <Input value={selectedMember?.plan ?? ""} readOnly className="bg-zinc-50 border-zinc-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Expiry Date</Label>
                                        <div className="relative">
                                            <Input value={selectedMember?.expiryDate ? selectedMember.expiryDate.split("T")[0] : ""} readOnly className="bg-zinc-50 border-zinc-200" />
                                            {selectedMember && new Date(selectedMember.expiryDate) < new Date() && (
                                                <Badge variant="destructive" className="absolute right-2 top-2 text-[10px] h-5">Expired</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    {selectedMember ? (
                                        <Link href={`/branch/members/${selectedMember.id}/membership`}>
                                            <Button type="button" className="shadow-sm">
                                                Extend Membership
                                            </Button>
                                        </Link>
                                    ) : null}
                                    <Button variant="outline">Update Profile</Button>
                                    <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">Block Member</Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="attendance" className="mt-0">
                                {attendanceError ? (
                                    <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3">
                                        <span>{attendanceError}</span>
                                        {selectedMember ? (
                                            <Button size="sm" variant="outline" className="bg-white text-rose-700 border-rose-200 hover:bg-rose-50" onClick={() => loadMemberAttendance(selectedMember)}>
                                                Retry
                                            </Button>
                                        ) : null}
                                    </div>
                                ) : null}

                                <div className="rounded-lg border bg-white overflow-hidden">
                                    {attendanceLoading ? (
                                        <div className="py-12 text-center text-muted-foreground text-sm">Loading attendance history...</div>
                                    ) : memberAttendance.length === 0 ? (
                                        <div className="py-12 text-center text-muted-foreground text-sm">No attendance records found.</div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Date & Time</TableHead>
                                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Method</TableHead>
                                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Checkout</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {memberAttendance.map((r) => (
                                                    <TableRow key={r.id} className="hover:bg-zinc-50/50">
                                                        <TableCell className="font-mono text-xs py-3">
                                                            {new Date(r.checkInTime).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-xs capitalize py-3">{r.method}</TableCell>
                                                        <TableCell className="py-3">
                                                            <Badge
                                                                variant={
                                                                    r.status === "success"
                                                                        ? "success"
                                                                        : r.status === "failed"
                                                                        ? "destructive"
                                                                        : "outline"
                                                                }
                                                                className="text-[10px] px-1.5 py-0.5 h-5 uppercase tracking-wide"
                                                            >
                                                                {r.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground font-mono py-3">
                                                            {r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : "—"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="programs" className="mt-0 space-y-4">
                                <Card className="border shadow-none">
                                    <CardHeader className="pb-3 border-b bg-zinc-50/50">
                                        <CardTitle className="text-base">Workout & Diet Plans</CardTitle>
                                        <CardDescription className="text-xs">
                                            Assign templates to guide this member's fitness journey.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        {selectedMember && (
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="space-y-3">
                                                    <Label className="flex items-center gap-2 text-sm font-medium">
                                                        <Dumbbell className="h-4 w-4 text-primary" />
                                                        Workout Plan
                                                    </Label>
                                                    <select
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                                                        value={memberPrograms[selectedMember.id]?.workoutPlanId || ""}
                                                        onChange={(e) =>
                                                            handleProgramChange(selectedMember.id, "workoutPlanId", e.target.value)
                                                        }
                                                    >
                                                        <option value="">No workout plan assigned</option>
                                                        {loadingPlans ? (
                                                            <option value="" disabled>
                                                                Loading plans...
                                                            </option>
                                                        ) : (
                                                            workoutPlans.map((p) => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name} ({p.difficulty})
                                                                </option>
                                                            ))
                                                        )}
                                                    </select>
                                                    <p className="text-xs text-muted-foreground">
                                                        Select a workout template from your branch library.
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="flex items-center gap-2 text-sm font-medium">
                                                        <Utensils className="h-4 w-4 text-emerald-600" />
                                                        Diet Plan
                                                    </Label>
                                                    <select
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                                                        value={memberPrograms[selectedMember.id]?.dietPlanId || ""}
                                                        onChange={(e) =>
                                                            handleProgramChange(selectedMember.id, "dietPlanId", e.target.value)
                                                        }
                                                    >
                                                        <option value="">No diet plan assigned</option>
                                                        {loadingPlans ? (
                                                            <option value="" disabled>
                                                                Loading plans...
                                                            </option>
                                                        ) : (
                                                            dietPlans.map((p) => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name} ({p.caloriesPerDay} kcal)
                                                                </option>
                                                            ))
                                                        )}
                                                    </select>
                                                    <p className="text-xs text-muted-foreground">
                                                        Select a nutrition guide or meal plan.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-col items-end gap-2 pt-4 border-t mt-4">
                                            {programSaveMessage && (
                                                <p className="text-xs text-emerald-600 font-medium animate-in fade-in">
                                                    {programSaveMessage}
                                                </p>
                                            )}
                                            {selectedMember && (
                                                <Button onClick={() => handleSavePrograms(selectedMember.id)}>
                                                    Save Programs
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>
            <div className="border rounded-md p-4 bg-gray-50 text-center text-muted-foreground text-sm">
                Program assignment saves to your backend. Progress tracking and next review date can be added later.
            </div>
        </div>
    );
}
