"use client";

import Link from "next/link";
import { useState } from "react";
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

// Types
interface MemberData {
    id: string;
    name: string;
    email: string;
    plan: string;
    status: "Active" | "Expired";
    expiry: string;
    lastVisit: string;
    image: string;
}

interface MemberProgram {
    workoutPlan: string;
    dietPlan: string;
}

const MOCK_MEMBERS: MemberData[] = [
    {
        id: "MEM001",
        name: "Alex Johnson",
        email: "alex@example.com",
        plan: "Gold Premium",
        status: "Active",
        expiry: "2025-12-01",
        lastVisit: "Today, 9:00 AM",
        image: "/placeholder-user.jpg"
    },
    {
        id: "MEM002",
        name: "Maria Garcia",
        email: "maria@example.com",
        plan: "Silver Monthly",
        status: "Expired",
        expiry: "2024-11-20",
        lastVisit: "5 days ago",
        image: "/placeholder-user-2.jpg"
    },
    {
        id: "MEM003",
        name: "Steve Smith",
        email: "steve@example.com",
        plan: "Standard",
        status: "Active",
        expiry: "2025-01-15",
        lastVisit: "Yesterday",
        image: ""
    },
];

export default function MembersPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredMembers = MOCK_MEMBERS.filter((member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Member State
    const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
    const [memberPrograms, setMemberPrograms] = useState<Record<string, MemberProgram>>({});
    const [programSaveMessage, setProgramSaveMessage] = useState<string | null>(null);
    const toast = useToast();

    const handleManageMember = (member: MemberData) => {
        setSelectedMember(member);
        setProgramSaveMessage(null);
    };

    const handleProgramChange = (memberId: string, field: "workoutPlan" | "dietPlan", value: string) => {
        setMemberPrograms((prev) => ({
            ...prev,
            [memberId]: {
                ...(prev[memberId] || { workoutPlan: "", dietPlan: "" }),
                [field]: value,
            },
        }));
    };

    const handleSavePrograms = (memberId: string) => {
        const entry = memberPrograms[memberId];
        const message = `Programs saved (mock) for ${memberId}: Workout - ${entry?.workoutPlan || "None"}, Diet - ${
            entry?.dietPlan || "None"
        }.`;
        setProgramSaveMessage(message);
        toast({ title: "Programs saved", description: message, variant: "success" });
    };

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
                        <CardTitle className="whitespace-nowrap">All Members ({MOCK_MEMBERS.length})</CardTitle>
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
                    {filteredMembers.length === 0 ? (
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
                                        <TableCell>{member.expiry}</TableCell>
                                        <TableCell>{member.lastVisit}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {memberPrograms[member.id]?.workoutPlan || memberPrograms[member.id]?.dietPlan ? (
                                                <div className="space-y-1">
                                                    {memberPrograms[member.id]?.workoutPlan && (
                                                        <div>
                                                            <span className="font-semibold">W: </span>
                                                            <span>{memberPrograms[member.id]?.workoutPlan}</span>
                                                        </div>
                                                    )}
                                                    {memberPrograms[member.id]?.dietPlan && (
                                                        <div>
                                                            <span className="font-semibold">D: </span>
                                                            <span>{memberPrograms[member.id]?.dietPlan}</span>
                                                        </div>
                                                    )}
                                                    {!memberPrograms[member.id]?.workoutPlan &&
                                                        !memberPrograms[member.id]?.dietPlan && (
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
                                    <Input value={selectedMember?.expiry} readOnly />
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
                                            {memberPrograms[selectedMember.id]?.workoutPlan || "Not assigned"}
                                        </span>
                                        " • Diet: "
                                        <span className="font-semibold">
                                            {memberPrograms[selectedMember.id]?.dietPlan || "Not assigned"}
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
                                                    value={memberPrograms[selectedMember.id]?.workoutPlan || ""}
                                                    onChange={(e) =>
                                                        handleProgramChange(selectedMember.id, "workoutPlan", e.target.value)
                                                    }
                                                >
                                                    <option value="">None</option>
                                                    <option value="Beginner Full Body">Beginner Full Body</option>
                                                    <option value="Strength Split">Strength Split</option>
                                                    <option value="Fat Loss HIIT">Fat Loss HIIT</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Diet plan</Label>
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                    value={memberPrograms[selectedMember.id]?.dietPlan || ""}
                                                    onChange={(e) =>
                                                        handleProgramChange(selectedMember.id, "dietPlan", e.target.value)
                                                    }
                                                >
                                                    <option value="">None</option>
                                                    <option value="Fat Loss Basics">Fat Loss Basics</option>
                                                    <option value="Muscle Gain Pro">Muscle Gain Pro</option>
                                                    <option value="General Wellness">General Wellness</option>
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
                                                Save Programs (mock)
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <div className="border rounded-md p-4 bg-gray-50 text-center text-muted-foreground text-sm">
                                Program assignment is mock-only for now. Later this can show the member's current
                                workout and diet plans, progress, and next review date.
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    );
}
