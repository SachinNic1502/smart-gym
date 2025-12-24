"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Plus, User, MoreHorizontal, TrendingUp, Sparkles, Users, Award, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, classesApi, staffApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { GymClass, Staff, ClassType } from "@/lib/types";

export default function ClassesPage() {
    const { user } = useAuth();
    const branchId = user?.branchId;
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState("classes");

    // Data State
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [trainers, setTrainers] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog State
    const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
    const [isTrainerDialogOpen, setIsTrainerDialogOpen] = useState(false);

    // Forms
    const [classForm, setClassForm] = useState({
        name: "",
        trainerId: "",
        type: "yoga" as ClassType,
        scheduleTime: "",
        duration: "60",
        capacity: "20",
        description: "",
    });

    const [trainerForm, setTrainerForm] = useState({
        name: "",
        role: "trainer" as any,
        email: "",
        phone: "",
    });



    const [typeSearch, setTypeSearch] = useState("");
    const [customType, setCustomType] = useState("");
    const CLASS_TYPES: ClassType[] = ["yoga", "zumba", "spinning", "hiit", "strength", "cardio", "pilates", "other"];
    const filteredClassTypes = CLASS_TYPES.filter(t => t.toLowerCase().includes(typeSearch.toLowerCase()));

    const loadData = useCallback(async () => {
        if (!user) return;
        if (user.role === "branch_admin" && !branchId) {
            setError("Branch not assigned");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [classesRes, staffRes] = await Promise.all([
                classesApi.list({ branchId: branchId ?? "", page: "1", pageSize: "100" }),
                staffApi.list({ branchId: branchId ?? "", page: "1", pageSize: "100" }),
            ]);
            setClasses(classesRes.data ?? []);
            setTrainers(staffRes.data ?? []);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to load data";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [branchId, user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totalBookings = classes.reduce((sum, cls) => sum + (cls.enrolled || 0), 0);
    const totalCapacity = classes.reduce((sum, cls) => sum + cls.capacity, 0);
    const utilizationRate = totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0;

    const handlePrimaryAction = () => {
        if (activeTab === "classes") {
            setIsClassDialogOpen(true);
        } else {
            setIsTrainerDialogOpen(true);
        }
    };

    const handleCreateClass = async () => {
        if (!classForm.name.trim() || !classForm.trainerId || !classForm.scheduleTime) {
            toast({
                title: "Missing details",
                description: "Please fill class name, trainer and schedule time.",
                variant: "warning",
            });
            return;
        }

        const trainer = trainers.find(t => t.id === classForm.trainerId);

        // Simple end time calc
        const [hours, minutes] = classForm.scheduleTime.split(":").map(Number);
        const durationMin = parseInt(classForm.duration) || 60;
        const endDate = new Date();
        endDate.setHours(hours, minutes + durationMin);
        const endTimeVal = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

        try {
            await classesApi.create({
                name: classForm.name,
                trainerId: classForm.trainerId,
                trainerName: trainer?.name || "Unknown",
                type: classForm.type,
                branchId: branchId,
                capacity: parseInt(classForm.capacity) || 20,
                description: classForm.type === "other" && customType ? `Custom Type: ${customType}. ${classForm.description}` : classForm.description,
                status: "active",
                schedule: [
                    {
                        dayOfWeek: new Date().getDay(),
                        startTime: classForm.scheduleTime,
                        endTime: endTimeVal,
                    }
                ]
            });

            toast({ title: "Class scheduled", variant: "success" });
            setIsClassDialogOpen(false);
            setCustomType("");
            setClassForm({
                name: "",
                trainerId: "",
                type: "yoga",
                scheduleTime: "",
                duration: "60",
                capacity: "20",
                description: "",
            });
            loadData();
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to create class";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const handleCreateTrainer = async () => {
        if (!trainerForm.name.trim()) {
            toast({ title: "Missing name", description: "Please enter the trainer name.", variant: "warning" });
            return;
        }

        try {
            await staffApi.create({
                name: trainerForm.name,
                role: trainerForm.role,
                branchId: branchId!,
                email: trainerForm.email,
                phone: trainerForm.phone,
                status: "active",
                joiningDate: new Date().toISOString().split("T")[0],
                updatedAt: new Date().toISOString(),
            });
            setIsTrainerDialogOpen(false);
            setTrainerForm({ name: "", role: "trainer", email: "", phone: "" });
            loadData();
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to add trainer";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };
    return (
        <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
                {/* Abstract Background pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
                    <Award className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Classes & Trainers
                        </h2>
                        <p className="text-slate-300 mt-2 text-lg font-light">
                            Manage your gym schedules, sessions, and staff.
                        </p>
                    </div>
                    <Button onClick={handlePrimaryAction} className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl border-0">
                        <Plus className="mr-2 h-4 w-4" />
                        {activeTab === "classes" ? "Schedule Class" : "Add Trainer"}
                    </Button>
                </div>
            </div>

            <div className="px-1 space-y-6">
                {/* Stats */}
                <div className="grid gap-6 grid-cols-2 md:grid-cols-4 px-1">
                    {/* Total Classes */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                            <Calendar className="w-24 h-24" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium opacity-90 text-blue-100">
                                Total Classes
                            </CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Calendar className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight">
                                {loading ? "—" : classes.length}
                            </div>
                            <p className="text-xs mt-2 font-medium opacity-90">
                                Scheduled active
                            </p>
                        </CardContent>
                    </Card>

                    {/* Trainers */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                            <Users className="w-24 h-24" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium opacity-90 text-emerald-100">
                                Trainers
                            </CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Users className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight">
                                {loading ? "—" : trainers.length}
                            </div>
                            <p className="text-xs mt-2 font-medium opacity-90">
                                Active staff
                            </p>
                        </CardContent>
                    </Card>

                    {/* Capacity */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-violet-600 to-purple-600 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                            <Users className="w-24 h-24" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium opacity-90 text-violet-100">
                                Capacity
                            </CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Users className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight">
                                {loading ? "—" : totalCapacity}
                            </div>
                            <p className="text-xs mt-2 font-medium opacity-90">
                                Total spots
                            </p>
                        </CardContent>
                    </Card>

                    {/* Utilization */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-rose-500 to-pink-600 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                            <TrendingUp className="w-24 h-24" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium opacity-90 text-rose-100">
                                Utilization
                            </CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <TrendingUp className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight">
                                {loading ? "—" : `${utilizationRate}%`}
                            </div>
                            <p className="text-xs mt-2 font-medium opacity-90">
                                Overall fill
                            </p>
                        </CardContent>
                    </Card>
                </div>


                {/* Tabs */}
                <Tabs defaultValue="classes" onValueChange={setActiveTab} className="w-full space-y-6">
                    <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm inline-flex">
                        <TabsList className="justify-start h-10 bg-transparent p-0 space-x-2">
                            <TabsTrigger
                                value="classes"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-all"
                            >
                                Classes
                            </TabsTrigger>
                            <TabsTrigger
                                value="trainers"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-all"
                            >
                                Trainers
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="classes" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {loading ? (
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />
                                ))}
                            </div>
                        ) : classes.length === 0 ? (
                            <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
                                <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                                        <Calendar className="h-8 w-8 text-blue-300" />
                                    </div>
                                    <div className="max-w-xs">
                                        <h3 className="font-bold text-lg text-gray-900">No classes scheduled yet</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Start building your schedule by adding your first class session.
                                        </p>
                                    </div>
                                    <Button onClick={handlePrimaryAction} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Schedule Class
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {classes.map((cls) => {
                                    const currentSchedule = cls.schedule?.[0]; // Taking first schedule for display
                                    const utilizationRaw = ((cls.enrolled || 0) / cls.capacity) * 100;
                                    const utilization = Math.min(100, Math.round(utilizationRaw));
                                    let statusLabel = "Available";
                                    let statusColor = "bg-emerald-500";
                                    let statusTextColor = "text-emerald-600";

                                    if (utilization >= 100) {
                                        statusLabel = "Full";
                                        statusColor = "bg-rose-500";
                                        statusTextColor = "text-rose-600";
                                    } else if (utilization >= 80) {
                                        statusLabel = "Filling Fast";
                                        statusColor = "bg-amber-500";
                                        statusTextColor = "text-amber-600";
                                    }

                                    return (
                                        <Card key={cls.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white">
                                            <div className={`h-2 w-full ${statusColor}`} />
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start mb-4">
                                                    <Badge variant="secondary" className="uppercase text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600 px-2 py-1">
                                                        {cls.type}
                                                    </Badge>
                                                    <Badge variant="outline" className={`text-[10px] font-bold uppercase border-0 ${statusTextColor} bg-opacity-10 px-2 py-0.5`}>
                                                        {statusLabel}
                                                    </Badge>
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">{cls.name}</h3>

                                                <div className="space-y-3 mt-4">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <User className="mr-2 h-4 w-4 text-gray-400" />
                                                        <span className="font-medium text-gray-700">{cls.trainerName}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Clock className="mr-2 h-4 w-4 text-gray-400" />
                                                        <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                                            {currentSchedule ? `${currentSchedule.startTime} - ${currentSchedule.endTime}` : "No schedule"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-6 space-y-2">
                                                    <div className="flex justify-between text-xs font-medium text-gray-500">
                                                        <span>{cls.enrolled || 0} / {cls.capacity} Enrolled</span>
                                                        <span>{utilization}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
                                                            style={{ width: `${utilization}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="trainers" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {loading ? (
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />
                                ))}
                            </div>
                        ) : trainers.length === 0 ? (
                            <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
                                <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                                        <Users className="h-8 w-8 text-emerald-300" />
                                    </div>
                                    <div className="max-w-xs">
                                        <h3 className="font-bold text-lg text-gray-900">No trainers added yet</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Add your first trainer to assign classes and track performance.
                                        </p>
                                    </div>
                                    <Button onClick={handlePrimaryAction} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Trainer
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {trainers.map((trainer) => (
                                    <Card key={trainer.id} className="border-0 shadow-lg bg-white overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                                        <div className="h-20 bg-gradient-to-r from-slate-200 to-slate-300 relative">
                                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                                <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
                                                    <AvatarFallback className="text-xl font-bold bg-slate-900 text-white">
                                                        {trainer.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </div>
                                        <CardContent className="pt-12 pb-6 text-center space-y-3">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{trainer.name}</h3>
                                                <Badge variant="secondary" className="mt-1 capitalize bg-slate-100 text-slate-600 hover:bg-slate-200">
                                                    {trainer.role}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-col gap-1 text-sm text-gray-500 pt-2">
                                                <span className="truncate">{trainer.email || "No email"}</span>
                                                <span className="font-mono text-xs">{trainer.phone || "No phone"}</span>
                                            </div>

                                            <div className="flex gap-2 justify-center pt-4">
                                                <Button variant="outline" size="sm" className="w-full text-xs h-8">View Profile</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Dialogs */}
            <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Schedule Class</DialogTitle>
                        <DialogDescription>Create a new class for the schedule.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Class Name *</Label>
                            <Input
                                placeholder="e.g. Morning Yoga"
                                value={classForm.name}
                                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Class Type *</Label>
                            <Input
                                placeholder="Search & select type..."
                                value={typeSearch}
                                onChange={(e) => setTypeSearch(e.target.value)}
                                className="mb-2"
                            />
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/20">
                                {filteredClassTypes.length === 0 ? (
                                    <div className="col-span-2 text-center text-xs text-muted-foreground py-2">No types found</div>
                                ) : (
                                    filteredClassTypes.map((t) => (
                                        <div
                                            key={t}
                                            onClick={() => setClassForm({ ...classForm, type: t })}
                                            className={`cursor-pointer rounded-md px-3 py-2 text-center text-sm border transition-all ${classForm.type === t
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "bg-background hover:bg-zinc-100 border-zinc-200"
                                                }`}
                                        >
                                            <span className="capitalize font-medium">{t}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            {classForm.type === "other" && (
                                <Input
                                    placeholder="Specify custom type..."
                                    value={customType}
                                    onChange={(e) => setCustomType(e.target.value)}
                                    className="mt-2"
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Trainer *</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={classForm.trainerId}
                                onChange={(e) => setClassForm({ ...classForm, trainerId: e.target.value })}
                            >
                                <option value="">Select Trainer</option>
                                {trainers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time *</Label>
                                <Input
                                    type="time"
                                    value={classForm.scheduleTime}
                                    onChange={(e) => setClassForm({ ...classForm, scheduleTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (min)</Label>
                                <Input
                                    type="number"
                                    value={classForm.duration}
                                    onChange={(e) => setClassForm({ ...classForm, duration: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Capacity</Label>
                            <Input
                                type="number"
                                value={classForm.capacity}
                                onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsClassDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateClass}>Save Class</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isTrainerDialogOpen} onOpenChange={setIsTrainerDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Add Trainer</DialogTitle>
                        <DialogDescription>Add a new staff member to your team.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                                placeholder="e.g. John Doe"
                                value={trainerForm.name}
                                onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={trainerForm.role}
                                onChange={(e) => setTrainerForm({ ...trainerForm, role: e.target.value as any })}
                            >
                                <option value="trainer">Trainer</option>
                                <option value="manager">Manager</option>
                                <option value="receptionist">Receptionist</option>
                                <option value="cleaner">Cleaner</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={trainerForm.email}
                                    onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={trainerForm.phone}
                                    onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTrainerDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateTrainer}>Save Trainer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
