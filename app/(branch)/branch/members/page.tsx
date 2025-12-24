"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, FileDown, Filter, MessageCircle, MoreHorizontal, Sparkles, UserCheck, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CalendarCheck, User, Dumbbell, Utensils, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, attendanceApi, membersApi, paymentsApi, plansApi, staffApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { AttendanceRecord, DietPlan, Member, Payment, WorkoutPlan, Staff, MembershipPlan } from "@/lib/types";
import { AddMemberDialog } from "./add-member-dialog";

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
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

    const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
    const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
    const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
    const [trainers, setTrainers] = useState<Staff[]>([]);
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
    const [isEditingMember, setIsEditingMember] = useState(false);
    const [memberEditForm, setMemberEditForm] = useState<Partial<Member>>({});
    const [savingMember, setSavingMember] = useState(false);
    const [memberPrograms, setMemberPrograms] = useState<Record<string, MemberProgram>>({});
    const [programSaveMessage, setProgramSaveMessage] = useState<string | null>(null);
    const { toast } = useToast();

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
            const [w, d, m, t] = await Promise.all([
                plansApi.getWorkoutPlans(),
                plansApi.getDietPlans(),
                plansApi.getMembershipPlans(),
                branchId ? staffApi.list({ branchId, role: "trainer", page: "1", pageSize: "100" }) : Promise.resolve({ data: [] }),
            ]);
            setWorkoutPlans(w.data);
            setDietPlans(d.data);
            setMembershipPlans(m.data || []);
            setTrainers((t as any).data || []);
        } catch {
            setWorkoutPlans([]);
            setDietPlans([]);
            setMembershipPlans([]);
            setTrainers([]);
        } finally {
            setLoadingPlans(false);
        }
    }, [branchId]);

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
        setIsEditingMember(false);
        setMemberEditForm({
            name: member.name,
            email: member.email,
            phone: member.phone,
            dateOfBirth: member.dateOfBirth,
            address: member.address,
            referralSource: member.referralSource,
            notes: member.notes,
            trainerId: member.trainerId,
            plan: member.plan,
            status: member.status as "Active" | "Cancelled" | "Expired" | "Frozen",
            expiryDate: member.expiryDate,
        });
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

    const handleSaveMemberProfile = useCallback(async () => {
        if (!selectedMember) return;
        setSavingMember(true);
        try {
            const payload: Partial<Member> = {
                name: memberEditForm.name,
                email: memberEditForm.email,
                phone: memberEditForm.phone,
                dateOfBirth: memberEditForm.dateOfBirth || undefined,
                address: memberEditForm.address || undefined,
                referralSource: memberEditForm.referralSource || undefined,
                trainerId: memberEditForm.trainerId || undefined,
                notes: memberEditForm.notes || undefined,
                plan: memberEditForm.plan,
                status: memberEditForm.status,
                expiryDate: memberEditForm.expiryDate,
            };

            const updated = await membersApi.update(selectedMember.id, payload);

            setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            setSelectedMember(updated);
            setIsEditingMember(false);
            toast({
                title: "Updated",
                description: "Member profile updated successfully.",
                variant: "success",
            });
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to update member";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setSavingMember(false);
        }
    }, [memberEditForm, selectedMember, toast]);

    const handleDeleteMember = async () => {
        if (!selectedMember) return;
        const memberToDelete = selectedMember;

        toast({
            title: "Delete Member?",
            description: `Permanently delete ${memberToDelete.name}?`,
            variant: "warning",
            duration: Infinity,
            action: ({ dismiss }) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-amber-100 text-amber-900" onClick={dismiss}>Cancel</Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={async () => {
                            dismiss();
                            try {
                                await membersApi.delete(memberToDelete.id);
                                toast({
                                    title: "Member Deleted",
                                    description: `${memberToDelete.name} has been permanently deleted.`,
                                    variant: "success",
                                });
                                // Only clear selection if we deleted the currently selected member
                                setSelectedMember((current) => current?.id === memberToDelete.id ? null : current);
                                fetchMembers();
                            } catch (e) {
                                const message = e instanceof ApiError ? e.message : "Failed to delete member";
                                toast({ title: "Error", description: message, variant: "destructive" });
                            }
                        }}
                    >
                        Confirm
                    </Button>
                </div>
            )
        });
    };

    const handleCancelMemberEdit = useCallback(() => {
        if (!selectedMember) return;
        setIsEditingMember(false);
        setMemberEditForm({
            name: selectedMember.name,
            email: selectedMember.email,
            phone: selectedMember.phone,
            dateOfBirth: selectedMember.dateOfBirth,
            address: selectedMember.address,
            referralSource: selectedMember.referralSource,
            trainerId: selectedMember.trainerId,
            notes: selectedMember.notes,
        });
    }, [selectedMember]);

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
        const isBlocked = member.status === "Cancelled";
        const action = isBlocked ? "unblock" : "block";
        const actionTitle = isBlocked ? "Unblock Member?" : "Block Member?";
        const actionDescription = isBlocked
            ? `Restore ${member.name}'s access to the gym?`
            : `Block ${member.name} from accessing the gym?`;

        toast({
            title: actionTitle,
            description: actionDescription,
            variant: "warning",
            duration: Infinity,
            action: ({ dismiss }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs hover:bg-amber-100 text-amber-900"
                        onClick={dismiss}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={isBlocked ? "default" : "destructive"}
                        size="sm"
                        className={`h-8 px-3 text-xs ${isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                        onClick={async () => {
                            dismiss();
                            try {
                                const updated = isBlocked
                                    ? await membersApi.unblock(member.id)
                                    : await membersApi.block(member.id);

                                toast({
                                    title: isBlocked ? "Member Unblocked" : "Member Blocked",
                                    description: isBlocked
                                        ? `${member.name} can now access the gym.`
                                        : `${member.name} has been blocked from accessing the gym.`,
                                    variant: "success",
                                });

                                // Update local state
                                setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
                                if (selectedMember?.id === updated.id) {
                                    setSelectedMember(updated);
                                }
                            } catch (e) {
                                const message = e instanceof ApiError ? e.message : `Failed to ${action} member`;
                                toast({ title: "Error", description: message, variant: "destructive" });
                            }
                        }}
                    >
                        Confirm
                    </Button>
                </div>
            )
        });
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
                            Member Management
                        </h2>
                        <p className="text-slate-300 mt-2 text-lg font-light">
                            Manage your gym members, plans, and access.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none shadow-sm h-9 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Messages
                        </Button>
                        <Button variant="outline" className="flex-1 sm:flex-none shadow-sm h-9 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                            <FileDown className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            onClick={() => setIsAddMemberOpen(true)}
                            className="w-full sm:w-auto shadow-xl transition-all hover:scale-105 active:scale-95 h-9 text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Member
                        </Button>
                    </div>
                </div>
            </div>

            <AddMemberDialog
                open={isAddMemberOpen}
                onOpenChange={setIsAddMemberOpen}
                onSuccess={fetchMembers}
            />

            {/* Quick Onboarding Card - Styled consistently */}
            <div className="px-1">
                <Card className="border border-blue-100 bg-blue-50/50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <UserPlus className="w-32 h-32 text-blue-500" />
                    </div>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">
                                    Quick Onboarding
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Add Member → Assign Membership → Assign Workout & Diet programs.
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => setIsAddMemberOpen(true)} size="sm" variant="secondary" className="bg-white hover:bg-gray-50 shadow-sm border border-blue-200 text-blue-700 font-medium">Start onboarding</Button>
                    </CardContent>
                </Card>
            </div >

            <div className="px-1">
                <Card className="border-0 shadow-lg bg-white overflow-hidden">
                    <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="whitespace-nowrap text-lg font-bold text-gray-800">All Members</CardTitle>
                                <CardDescription className="text-xs">
                                    Showing {loading ? "..." : filteredMembers.length} active records
                                </CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                                <div className="relative flex-1 lg:w-72">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by name, email..."
                                        className="pl-9 h-9 bg-white w-full border-gray-200"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="sm" className="h-9 px-3 w-full sm:w-auto bg-white border-gray-200">
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
                            <div className="py-12 text-center text-gray-400 text-sm">Loading members...</div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="py-16 flex flex-col items-center justify-center text-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                    <Users className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-base font-medium text-gray-900">No members found</p>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                        We couldn't find any members matching your search.
                                    </p>
                                </div>
                                <Button onClick={() => setIsAddMemberOpen(true)} size="sm" className="mt-2 text-xs bg-slate-900 text-white hover:bg-slate-800">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Member
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent bg-gray-50/50">
                                            <TableHead className="w-[250px] min-w-[200px] font-semibold text-xs uppercase tracking-wider text-gray-500 pl-6">Member</TableHead>
                                            <TableHead className="min-w-[120px] font-semibold text-xs uppercase tracking-wider text-gray-500">Plan</TableHead>
                                            <TableHead className="min-w-[120px] font-semibold text-xs uppercase tracking-wider text-gray-500">Expiry</TableHead>
                                            <TableHead className="min-w-[120px] font-semibold text-xs uppercase tracking-wider text-gray-500">Last Visit</TableHead>
                                            <TableHead className="min-w-[100px] font-semibold text-xs uppercase tracking-wider text-gray-500">Programs</TableHead>
                                            <TableHead className="min-w-[100px] font-semibold text-xs uppercase tracking-wider text-gray-500">Status</TableHead>
                                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-gray-500 pr-6 min-w-[180px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMembers.map((member) => (
                                            <TableRow key={member.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer border-gray-50" onClick={() => handleManageMember(member)}>
                                                <TableCell className="pl-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-gray-100">
                                                            <AvatarImage src={member.image} />
                                                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                                                                {member.name.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{member.name}</div>
                                                            <div className="text-xs text-gray-500">{member.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal text-gray-600 bg-white border-gray-200 shadow-sm">
                                                        {member.plan}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500 font-mono text-xs">
                                                    {member.expiryDate ? member.expiryDate.split("T")[0] : "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500 font-mono text-xs">
                                                    {member.lastVisit ? member.lastVisit.split("T")[0] : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {memberPrograms[member.id]?.workoutPlanId ? (
                                                            <div className="h-5 w-5 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-[10px] font-bold" title="Workout Plan Assigned">
                                                                W
                                                            </div>
                                                        ) : null}
                                                        {memberPrograms[member.id]?.dietPlanId ? (
                                                            <div className="h-5 w-5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-[10px] font-bold" title="Diet Plan Assigned">
                                                                D
                                                            </div>
                                                        ) : null}
                                                        {!memberPrograms[member.id]?.workoutPlanId &&
                                                            !memberPrograms[member.id]?.dietPlanId && (
                                                                <span className="text-[10px] text-gray-300 italic">None</span>
                                                            )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={member.status === "Active" ? "success" : "destructive"}
                                                        className={`uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 ${member.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}`}
                                                    >
                                                        {member.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-gray-900 hidden sm:inline-flex"
                                                            onClick={() => handleManageMember(member)}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                        <Link href={`/branch/members/${member.id}/membership`}>
                                                            <Button variant="outline" size="sm" className="h-8 px-2 text-[10px] bg-white border-gray-200" type="button">
                                                                Renew
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant={member.status === "Cancelled" ? "default" : "destructive"}
                                                            size="sm"
                                                            className={`h-8 px-2 text-[10px] ${member.status === "Cancelled" ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                                                            type="button"
                                                            onClick={() => handleBlockMember(member)}
                                                        >
                                                            {member.status === "Cancelled" ? "Unblock" : "Block"}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Member Details Sheet/Dialog */}
                <Dialog
                    open={!!selectedMember}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedMember(null);
                            setIsEditingMember(false);
                            setMemberEditForm({});
                        }
                    }}
                >
                    <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:max-w-[700px] h-[calc(100vh-1.5rem)] sm:h-auto max-h-[calc(100vh-1.5rem)] p-0 overflow-hidden gap-0 flex flex-col bg-white rounded-2xl">
                        <DialogHeader className="p-6 pb-6 border-b bg-gray-50/50 shrink-0">
                            <div className="flex items-center gap-5">
                                <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                                    <AvatarImage src={selectedMember?.image} />
                                    <AvatarFallback className="text-xl bg-slate-900 text-white font-bold">
                                        {selectedMember?.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <DialogTitle className="text-xl font-bold text-gray-900">{selectedMember?.name}</DialogTitle>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Badge variant="outline" className="font-mono text-[10px] text-gray-500 bg-white border-gray-200">
                                            {selectedMember?.id}
                                        </Badge>
                                        <span>•</span>
                                        <span>{selectedMember?.email}</span>
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    <Badge
                                        variant={selectedMember?.status === "Active" ? "success" : "destructive"}
                                        className="text-sm px-3 py-1 uppercase tracking-wide font-bold shadow-sm"
                                    >
                                        {selectedMember?.status}
                                    </Badge>
                                </div>
                            </div>
                        </DialogHeader>

                        <Tabs defaultValue="profile" className="w-full flex-1 min-h-0 flex flex-col">
                            <div className="px-6 border-b bg-white shrink-0 overflow-x-auto no-scrollbar">
                                <TabsList className="flex w-fit justify-start h-12 bg-transparent p-0 space-x-8 min-w-max">
                                    <TabsTrigger
                                        value="profile"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0 font-medium text-gray-500 data-[state=active]:text-blue-600 transition-none text-sm"
                                    >
                                        <User className="h-4 w-4 mr-2" /> Profile
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="attendance"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0 font-medium text-gray-500 data-[state=active]:text-blue-600 transition-none text-sm"
                                    >
                                        <CalendarCheck className="h-4 w-4 mr-2" /> Attendance
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="payments"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0 font-medium text-gray-500 data-[state=active]:text-blue-600 transition-none text-sm"
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" /> Payments
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="programs"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0 font-medium text-gray-500 data-[state=active]:text-blue-600 transition-none text-sm"
                                    >
                                        <Dumbbell className="h-4 w-4 mr-2" /> Programs
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="p-6 bg-white flex-1 min-h-0 overflow-y-auto">
                                <TabsContent value="profile" className="space-y-6 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Full Name</Label>
                                            <Input
                                                value={(isEditingMember ? memberEditForm.name : selectedMember?.name) ?? ""}
                                                readOnly={!isEditingMember}
                                                onChange={(e) => setMemberEditForm((p) => ({ ...p, name: e.target.value }))}
                                                autoFocus={isEditingMember}
                                                className={`${isEditingMember ? "bg-white" : "bg-gray-50"} border-gray-200 ${isEditingMember ? "cursor-text" : "cursor-default text-gray-600"}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Email</Label>
                                            <Input
                                                value={(isEditingMember ? memberEditForm.email : selectedMember?.email) ?? ""}
                                                readOnly={!isEditingMember}
                                                onChange={(e) => setMemberEditForm((p) => ({ ...p, email: e.target.value }))}
                                                className={`${isEditingMember ? "bg-white" : "bg-gray-50"} border-gray-200 ${isEditingMember ? "cursor-text" : "cursor-default text-gray-600"}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Phone</Label>
                                            <Input
                                                value={(isEditingMember ? memberEditForm.phone : selectedMember?.phone) ?? ""}
                                                readOnly={!isEditingMember}
                                                onChange={(e) => setMemberEditForm((p) => ({ ...p, phone: e.target.value }))}
                                                className={`${isEditingMember ? "bg-white" : "bg-gray-50"} border-gray-200 ${isEditingMember ? "cursor-text" : "cursor-default text-gray-600"}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Personal Trainer</Label>
                                            <select
                                                className={`flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${isEditingMember ? "bg-white" : "bg-gray-50"} border-gray-200 ${isEditingMember ? "cursor-pointer" : "cursor-default pointer-events-none text-gray-600"}`}
                                                value={(isEditingMember ? memberEditForm.trainerId : selectedMember?.trainerId) || ""}
                                                onChange={(e) => setMemberEditForm((p) => ({ ...p, trainerId: e.target.value }))}
                                                disabled={!isEditingMember}
                                            >
                                                <option value="">No Trainer Assigned</option>
                                                {trainers.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.name}
                                                    </option>
                                                ))}
                                                {(isEditingMember ? memberEditForm.trainerId : selectedMember?.trainerId) &&
                                                    !trainers.find(t => t.id === (isEditingMember ? memberEditForm.trainerId : selectedMember?.trainerId)) && (
                                                        <option value={(isEditingMember ? memberEditForm.trainerId : selectedMember?.trainerId) || ""}>
                                                            Unknown Trainer ({(isEditingMember ? memberEditForm.trainerId : selectedMember?.trainerId)?.substring(0, 8)}...)
                                                        </option>
                                                    )}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Date of Birth</Label>
                                            <Input
                                                value={
                                                    isEditingMember
                                                        ? (memberEditForm.dateOfBirth ? String(memberEditForm.dateOfBirth).split("T")[0] : "")
                                                        : (selectedMember?.dateOfBirth ? selectedMember.dateOfBirth.split("T")[0] : "—")
                                                }
                                                readOnly={!isEditingMember}
                                                onChange={(e) => setMemberEditForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                                                className={`${isEditingMember ? "bg-white" : "bg-gray-50"} border-gray-200 ${isEditingMember ? "cursor-text" : "cursor-default text-gray-600"}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Current Plan</Label>
                                            {isEditingMember ? (
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-gray-200 cursor-pointer"
                                                    value={memberEditForm.plan || ""}
                                                    onChange={(e) => setMemberEditForm((p) => ({ ...p, plan: e.target.value }))}
                                                >
                                                    <option value="">Select Plan</option>
                                                    {membershipPlans.map(plan => (
                                                        <option key={plan.id} value={plan.name}>{plan.name}</option>
                                                    ))}
                                                    {memberEditForm.plan && !membershipPlans.find(p => p.name === memberEditForm.plan) && (
                                                        <option value={memberEditForm.plan}>{memberEditForm.plan}</option>
                                                    )}
                                                </select>
                                            ) : (
                                                <Input value={selectedMember?.plan ?? ""} readOnly className="bg-gray-50 border-gray-200 text-gray-600" />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Expiry Date</Label>
                                            <div className="relative">
                                                <Input
                                                    type={isEditingMember ? "date" : "text"}
                                                    value={isEditingMember ? (memberEditForm.expiryDate?.split("T")[0] || "") : (selectedMember?.expiryDate ? selectedMember.expiryDate.split("T")[0] : "")}
                                                    readOnly={!isEditingMember}
                                                    onChange={(e) => setMemberEditForm((p) => ({ ...p, expiryDate: e.target.value }))}
                                                    className={`${isEditingMember ? "bg-white" : "bg-gray-50"} border-gray-200 ${isEditingMember ? "cursor-text" : "cursor-default text-gray-600"}`}
                                                />
                                                {!isEditingMember && selectedMember && new Date(selectedMember.expiryDate) < new Date() && (
                                                    <Badge variant="destructive" className="absolute right-2 top-2 text-[10px] h-5">Expired</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Status</Label>
                                            <select
                                                className={`flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${isEditingMember ? "bg-white" : "bg-gray-50"} border-gray-200 ${isEditingMember ? "cursor-pointer" : "cursor-default pointer-events-none text-gray-600"}`}
                                                value={(isEditingMember ? memberEditForm.status : selectedMember?.status) || ""}
                                                onChange={(e) => setMemberEditForm((p) => ({ ...p, status: e.target.value as any }))}
                                                disabled={!isEditingMember}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Cancelled">Cancelled</option>
                                                <option value="Expired">Expired</option>
                                                <option value="Frozen">Frozen</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Branch ID</Label>
                                            <Input value={selectedMember?.branchId ?? ""} readOnly className="bg-gray-50 border-gray-200 font-mono text-gray-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Join Date</Label>
                                            <Input
                                                value={selectedMember?.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : "—"}
                                                readOnly
                                                className="bg-gray-50 border-gray-200 text-gray-600"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Address</Label>
                                            <Input
                                                value={(isEditingMember ? memberEditForm.address : selectedMember?.address) || ""}
                                                readOnly={!isEditingMember}
                                                onChange={(e) => setMemberEditForm((p) => ({ ...p, address: e.target.value }))}
                                                className={`${isEditingMember ? "bg-white" : "bg-gray-50"} border-gray-200 ${isEditingMember ? "cursor-text" : "cursor-default text-gray-600"}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Last Visit</Label>
                                            <Input
                                                value={selectedMember?.lastVisit ? new Date(selectedMember.lastVisit).toLocaleString() : "—"}
                                                readOnly
                                                className="bg-gray-50 border-gray-200 text-gray-600"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Referral Source</Label>
                                            <Input
                                                value={
                                                    (isEditingMember ? memberEditForm.referralSource : selectedMember?.referralSource) ??
                                                    (isEditingMember ? "" : "—")
                                                }
                                                readOnly={!isEditingMember}
                                                onChange={(e) => setMemberEditForm((p) => ({ ...p, referralSource: e.target.value }))}
                                                className={`${isEditingMember ? "bg-white" : "bg-gray-50"} border-gray-200 ${isEditingMember ? "cursor-text" : "cursor-default text-gray-600"}`}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs text-gray-400 uppercase tracking-wide font-bold">Notes</Label>
                                            <Input
                                                value={(isEditingMember ? memberEditForm.notes : selectedMember?.notes) ?? (isEditingMember ? "" : "—")}
                                                readOnly={!isEditingMember}
                                                onChange={(e) => setMemberEditForm((p) => ({ ...p, notes: e.target.value }))}
                                                className={`${isEditingMember ? "bg-white" : "bg-gray-50"} border-gray-200 ${isEditingMember ? "cursor-text" : "cursor-default text-gray-600"}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Delete & Action Buttons Area */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                                        {isEditingMember && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={handleDeleteMember}
                                                className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none w-full sm:w-auto text-xs"
                                            >
                                                <Trash2 className="w-3 h-3 mr-2" /> Delete Member
                                            </Button>
                                        )}

                                        <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto ml-auto">
                                            {!isEditingMember && selectedMember && (
                                                <>
                                                    <Link href={`/branch/members/${selectedMember.id}/membership`}>
                                                        <Button type="button" className="shadow-sm bg-slate-900 text-white hover:bg-slate-800">
                                                            Extend Membership
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        type="button"
                                                        variant={selectedMember.status === "Cancelled" ? "default" : "ghost"}
                                                        className={selectedMember.status === "Cancelled"
                                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            : "text-red-600 hover:text-red-700 hover:bg-red-50"}
                                                        onClick={() => selectedMember && handleBlockMember(selectedMember)}
                                                    >
                                                        {selectedMember.status === "Cancelled" ? "Unblock" : "Block"}
                                                    </Button>
                                                </>
                                            )}

                                            {isEditingMember ? (
                                                <>
                                                    <Button variant="outline" onClick={handleCancelMemberEdit} disabled={savingMember}>
                                                        Cancel
                                                    </Button>
                                                    <Button onClick={handleSaveMemberProfile} disabled={savingMember} className="bg-slate-900 text-white hover:bg-slate-800">
                                                        {savingMember ? "Saving..." : "Save Changes"}
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button variant="outline" onClick={() => setIsEditingMember(true)} className="bg-white border-gray-200">
                                                    Edit Profile
                                                </Button>
                                            )}
                                        </div>
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

                                    <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                                        {attendanceLoading ? (
                                            <div className="py-12 text-center text-gray-400 text-sm">Loading attendance history...</div>
                                        ) : memberAttendance.length === 0 ? (
                                            <div className="py-12 text-center text-gray-400 text-sm">No attendance records found.</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                                            <TableHead className="text-xs font-semibold uppercase tracking-wider min-w-[150px] text-gray-500">Date & Time</TableHead>
                                                            <TableHead className="text-xs font-semibold uppercase tracking-wider min-w-[100px] text-gray-500">Method</TableHead>
                                                            <TableHead className="text-xs font-semibold uppercase tracking-wider min-w-[100px] text-gray-500">Status</TableHead>
                                                            <TableHead className="text-xs font-semibold uppercase tracking-wider min-w-[150px] text-gray-500">Checkout</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {memberAttendance.map((r) => (
                                                            <TableRow key={r.id} className="hover:bg-gray-50/50 border-gray-50">
                                                                <TableCell className="font-mono text-xs py-3 whitespace-nowrap text-gray-600">
                                                                    {new Date(r.checkInTime).toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="text-xs capitalize py-3 font-medium">{r.method}</TableCell>
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
                                                                <TableCell className="text-xs text-gray-400 font-mono py-3 whitespace-nowrap">
                                                                    {r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : "—"}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="payments" className="mt-0">
                                    {paymentsError ? (
                                        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3">
                                            <span>{paymentsError}</span>
                                            {selectedMember ? (
                                                <Button size="sm" variant="outline" className="bg-white text-rose-700 border-rose-200 hover:bg-rose-50" onClick={() => loadMemberPayments(selectedMember)}>
                                                    Retry
                                                </Button>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                                        {paymentsLoading ? (
                                            <div className="py-12 text-center text-gray-400 text-sm">Loading payment history...</div>
                                        ) : memberPayments.length === 0 ? (
                                            <div className="py-12 text-center text-gray-400 text-sm">No payment records found.</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                                            <TableHead className="text-xs font-semibold uppercase tracking-wider min-w-[150px] text-gray-500">Date</TableHead>
                                                            <TableHead className="text-xs font-semibold uppercase tracking-wider min-w-[100px] text-gray-500">Amount</TableHead>
                                                            <TableHead className="text-xs font-semibold uppercase tracking-wider min-w-[100px] text-gray-500">Method</TableHead>
                                                            <TableHead className="text-xs font-semibold uppercase tracking-wider min-w-[150px] text-gray-500">Description</TableHead>
                                                            <TableHead className="text-xs font-semibold uppercase tracking-wider min-w-[100px] text-gray-500">Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {memberPayments.map((p) => (
                                                            <TableRow key={p.id} className="hover:bg-gray-50/50 border-gray-50">
                                                                <TableCell className="font-mono text-xs py-3 whitespace-nowrap text-gray-600">
                                                                    {new Date(p.createdAt).toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="font-semibold text-xs py-3 text-gray-900">
                                                                    ₹{p.amount}
                                                                </TableCell>
                                                                <TableCell className="text-xs capitalize py-3">{p.method}</TableCell>
                                                                <TableCell className="text-xs text-muted-foreground py-3">
                                                                    {p.description || "—"}
                                                                </TableCell>
                                                                <TableCell className="py-3">
                                                                    <Badge
                                                                        variant={
                                                                            p.status === "completed"
                                                                                ? "success"
                                                                                : p.status === "failed"
                                                                                    ? "destructive"
                                                                                    : "warning"
                                                                        }
                                                                        className="text-[10px] px-1.5 py-0.5 h-5 uppercase tracking-wide"
                                                                    >
                                                                        {p.status}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="programs" className="mt-0 space-y-4">
                                    <Card className="border border-gray-200 shadow-sm bg-white">
                                        <CardHeader className="pb-3 border-b bg-gray-50/50">
                                            <CardTitle className="text-base font-bold text-gray-800">Workout & Diet Plans</CardTitle>
                                            <CardDescription className="text-xs text-gray-500">
                                                Assign templates to guide this member's fitness journey.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6 pt-6">
                                            {selectedMember && (
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    <div className="space-y-3">
                                                        <Label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                            <Dumbbell className="h-4 w-4 text-blue-600" />
                                                            Workout Plan
                                                        </Label>
                                                        <select
                                                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-200"
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
                                                            {memberPrograms[selectedMember.id]?.workoutPlanId &&
                                                                !workoutPlans.find(p => p.id === memberPrograms[selectedMember.id]?.workoutPlanId) && (
                                                                    <option value={memberPrograms[selectedMember.id]?.workoutPlanId}>
                                                                        Unknown Plan ({memberPrograms[selectedMember.id]?.workoutPlanId})
                                                                    </option>
                                                                )}
                                                        </select>
                                                        <p className="text-xs text-gray-500">
                                                            Select a workout template from your branch library.
                                                        </p>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                            <Utensils className="h-4 w-4 text-emerald-600" />
                                                            Diet Plan
                                                        </Label>
                                                        <select
                                                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500 border-gray-200"
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
                                                            {memberPrograms[selectedMember.id]?.dietPlanId &&
                                                                !dietPlans.find(p => p.id === memberPrograms[selectedMember.id]?.dietPlanId) && (
                                                                    <option value={memberPrograms[selectedMember.id]?.dietPlanId}>
                                                                        Unknown Plan ({memberPrograms[selectedMember.id]?.dietPlanId})
                                                                    </option>
                                                                )}
                                                        </select>
                                                        <p className="text-xs text-gray-500">
                                                            Select a nutrition guide or meal plan.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col items-end gap-2 pt-4 border-t mt-4 border-gray-100">
                                                {programSaveMessage && (
                                                    <p className="text-xs text-emerald-600 font-medium animate-in fade-in">
                                                        {programSaveMessage}
                                                    </p>
                                                )}
                                                {selectedMember && (
                                                    <Button onClick={() => handleSavePrograms(selectedMember.id)} className="bg-slate-900 text-white hover:bg-slate-800">
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
                </Dialog >
                <div className="rounded-xl border border-dashed border-gray-300 p-6 bg-gray-50/50 text-center">
                    <p className="text-gray-500 text-sm font-medium">
                        Program assignments are saved to your branch backend.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Attendance and payment data is updated in real-time.
                    </p>
                </div>
            </div >
        </div >
    );
}
