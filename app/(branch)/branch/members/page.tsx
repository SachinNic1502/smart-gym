"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, FileDown, Filter, MessageCircle } from "lucide-react";
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
import { CreditCard, CalendarCheck, User } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, membersApi, plansApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { DietPlan, Member, WorkoutPlan } from "@/lib/types";

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

    const handleManageMember = useCallback(async (member: Member) => {
        setSelectedMember(member);
        setProgramSaveMessage(null);

        try {
            const programs = await membersApi.getPrograms(member.id);
            const workoutPlanId = (programs.workoutPlan as any)?.id as string | undefined;
            const dietPlanId = (programs.dietPlan as any)?.id as string | undefined;

            setMemberPrograms((prev) => ({
                ...prev,
                [member.id]: {
                    workoutPlanId,
                    dietPlanId,
                },
            }));
        } catch {
            setMemberPrograms((prev) => ({
                ...prev,
                [member.id]: prev[member.id] ?? {},
            }));
        }
    }, []);

    const handleProgramChange = (memberId: string, field: "workoutPlanId" | "dietPlanId", value: string) => {
        setMemberPrograms((prev) => ({
            ...prev,
            [memberId]: {
                ...(prev[memberId] || {}),
                [field]: value,
            },
        }));
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Members</h2>
                    <p className="text-muted-foreground">
                        Manage your gym members, plans, and access.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Messages
                    </Button>
                    <Button variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Link href="/branch/members/add">
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Member
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="border-dashed border-primary/20 bg-primary/5">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                            New member onboarding
                        </p>
                        <p className="text-xs text-muted-foreground">
                            1. Add Member → 2. Assign Membership → 3. Assign Workout & Diet programs.
                        </p>
                    </div>
                    <Link href="/branch/members/add">
                        <Button size="sm">Start onboarding</Button>
                    </Link>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="whitespace-nowrap">All Members ({loading ? "..." : total})</CardTitle>
                        <div className="flex w-full justify-end gap-2">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name or email..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-center justify-between gap-3">
                            <span>{error}</span>
                            <Button size="sm" variant="outline" type="button" onClick={fetchMembers}>
                                Retry
                            </Button>
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="py-10 text-center text-muted-foreground">Loading members...</div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="py-10 flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
                            <div className="h-16 w-16 rounded-full border border-dashed flex items-center justify-center text-3xl">
                                :(
                            </div>
                            <p className="text-sm font-medium">No members found</p>
                            <p className="text-xs max-w-md">
                                Try adjusting your search or add a new member to this branch.
                            </p>
                            <Link href="/branch/members/add">
                                <Button size="sm">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Member
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Expiry Date</TableHead>
                                    <TableHead>Last Visit</TableHead>
                                    <TableHead>Programs</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMembers.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={member.image} />
                                                    <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{member.name}</div>
                                                    <div className="text-xs text-muted-foreground">{member.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{member.plan}</TableCell>
                                        <TableCell>{member.expiryDate ? member.expiryDate.split("T")[0] : "—"}</TableCell>
                                        <TableCell>{member.lastVisit ? member.lastVisit.split("T")[0] : "—"}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {memberPrograms[member.id]?.workoutPlanId || memberPrograms[member.id]?.dietPlanId ? (
                                                <div className="space-y-1">
                                                    {memberPrograms[member.id]?.workoutPlanId && (
                                                        <div>
                                                            <span className="font-semibold">W: </span>
                                                            <span>{resolveWorkoutPlanName(memberPrograms[member.id]?.workoutPlanId)}</span>
                                                        </div>
                                                    )}
                                                    {memberPrograms[member.id]?.dietPlanId && (
                                                        <div>
                                                            <span className="font-semibold">D: </span>
                                                            <span>{resolveDietPlanName(memberPrograms[member.id]?.dietPlanId)}</span>
                                                        </div>
                                                    )}
                                                    {!memberPrograms[member.id]?.workoutPlanId &&
                                                        !memberPrograms[member.id]?.dietPlanId && (
                                                            <span className="italic text-[11px] text-muted-foreground">
                                                                Not assigned
                                                            </span>
                                                        )}
                                                </div>
                                            ) : (
                                                <span className="italic text-[11px] text-muted-foreground">Not assigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    member.status === "Active" ? "success" : "destructive"
                                                }
                                            >
                                                {member.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleManageMember(member)}>
                                                Manage
                                            </Button>
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
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={selectedMember?.image} />
                                <AvatarFallback className="text-lg">{selectedMember?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-2xl">{selectedMember?.name}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-1">
                                    <span className="text-primary font-medium">{selectedMember?.id}</span> •
                                    <span>{selectedMember?.email}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs defaultValue="profile" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" /> Profile</TabsTrigger>
                            <TabsTrigger value="attendance"><CalendarCheck className="h-4 w-4 mr-2" /> Attendance</TabsTrigger>
                            <TabsTrigger value="payments"><CreditCard className="h-4 w-4 mr-2" /> Payments</TabsTrigger>
                            <TabsTrigger value="programs">Programs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input value={selectedMember?.name} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input value={selectedMember?.email} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Current Plan</Label>
                                    <Input value={selectedMember?.plan} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expiry Date</Label>
                                    <Input value={selectedMember?.expiryDate ? selectedMember.expiryDate.split("T")[0] : ""} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Input
                                        value={selectedMember?.status}
                                        readOnly
                                        className={
                                            selectedMember?.status === "Active"
                                                ? "text-green-600 font-bold"
                                                : "text-red-500 font-bold"
                                        }
                                    />
                                </div>
                            </div>
                            {selectedMember && (
                                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide">
                                        Current programs
                                    </p>
                                    <p className="mt-1">
                                        Workout: "
                                        <span className="font-semibold">
                                            {resolveWorkoutPlanName(memberPrograms[selectedMember.id]?.workoutPlanId) || "Not assigned"}
                                        </span>
                                        " • Diet: "
                                        <span className="font-semibold">
                                            {resolveDietPlanName(memberPrograms[selectedMember.id]?.dietPlanId) || "Not assigned"}
                                        </span>
                                        "
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="destructive">Block Member</Button>
                                <Button>Update Profile</Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="attendance" className="py-4">
                            <div className="border rounded-md p-4 bg-gray-50 text-center text-muted-foreground">
                                <CalendarCheck className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                                <p>Attendance log will appear here.</p>
                                <span className="text-xs">Connecting to device logs...</span>
                            </div>
                        </TabsContent>

                        <TabsContent value="payments" className="py-4">
                            <div className="border rounded-md p-4 bg-gray-50 text-center text-muted-foreground">
                                <CreditCard className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                                <p>No recent transactions found.</p>
                                {selectedMember && (
                                    <Link href={`/branch/members/${selectedMember.id}/membership`}>
                                        <Button variant="link" className="text-primary">
                                            Assign / Renew Membership
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="programs" className="py-4 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Workout & diet programs</CardTitle>
                                    <CardDescription>
                                        Assign high-level workout and diet templates to this member.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {selectedMember && (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Workout plan</Label>
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={memberPrograms[selectedMember.id]?.workoutPlanId || ""}
                                                    onChange={(e) =>
                                                        handleProgramChange(selectedMember.id, "workoutPlanId", e.target.value)
                                                    }
                                                >
                                                    <option value="">None</option>
                                                    {loadingPlans ? (
                                                        <option value="" disabled>
                                                            Loading...
                                                        </option>
                                                    ) : (
                                                        workoutPlans.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name}
                                                            </option>
                                                        ))
                                                    )}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Diet plan</Label>
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={memberPrograms[selectedMember.id]?.dietPlanId || ""}
                                                    onChange={(e) =>
                                                        handleProgramChange(selectedMember.id, "dietPlanId", e.target.value)
                                                    }
                                                >
                                                    <option value="">None</option>
                                                    {loadingPlans ? (
                                                        <option value="" disabled>
                                                            Loading...
                                                        </option>
                                                    ) : (
                                                        dietPlans.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name}
                                                            </option>
                                                        ))
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3">
                                        <Link href="/branch/workout-plans">
                                            <Button variant="outline" size="sm">
                                                View workout plans library
                                            </Button>
                                        </Link>
                                        <Link href="/branch/diet-plans">
                                            <Button variant="outline" size="sm">
                                                View diet plans library
                                            </Button>
                                        </Link>
                                    </div>

                                    {selectedMember && (
                                        <div className="flex justify-between items-center gap-2 pt-1">
                                            {programSaveMessage && (
                                                <p className="text-[11px] text-emerald-600">
                                                    {programSaveMessage}
                                                </p>
                                            )}
                                            <Button
                                                size="sm"
                                                type="button"
                                                onClick={() => handleSavePrograms(selectedMember.id)}
                                            >
                                                Save Programs
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <div className="border rounded-md p-4 bg-gray-50 text-center text-muted-foreground text-sm">
                                Program assignment saves to your backend. Progress tracking and next review date can be added later.
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    );
}
