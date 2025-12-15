"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Plus, User, MoreHorizontal, TrendingUp } from "lucide-react";
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
    const toast = useToast();

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
        duration: "60 min",
        capacity: "20",
        description: "",
    });

    const [trainerForm, setTrainerForm] = useState({
        name: "",
        role: "trainer" as any,
        email: "",
        phone: "",
    });

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
                description: classForm.description,
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
            setClassForm({
                name: "",
                trainerId: "",
                type: "yoga",
                scheduleTime: "",
                duration: "60 min",
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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Classes & Trainers</h2>
                    <p className="text-muted-foreground">Manage your gym schedules and staff.</p>
                </div>
                <Button onClick={handlePrimaryAction}>
                    <Plus className="mr-2 h-4 w-4" />
                    {activeTab === "classes" ? "Schedule Class" : "Add Trainer"}
                </Button>
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
                                onChange={(e) => setClassForm({...classForm, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Trainer *</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={classForm.trainerId}
                                onChange={(e) => setClassForm({...classForm, trainerId: e.target.value})}
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
                                    onChange={(e) => setClassForm({...classForm, scheduleTime: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (min)</Label>
                                <Input 
                                    type="number"
                                    value={classForm.duration}
                                    onChange={(e) => setClassForm({...classForm, duration: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Capacity</Label>
                            <Input 
                                type="number"
                                value={classForm.capacity}
                                onChange={(e) => setClassForm({...classForm, capacity: e.target.value})}
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
                                onChange={(e) => setTrainerForm({...trainerForm, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={trainerForm.role}
                                onChange={(e) => setTrainerForm({...trainerForm, role: e.target.value as any})}
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
                                    onChange={(e) => setTrainerForm({...trainerForm, email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input 
                                    value={trainerForm.phone}
                                    onChange={(e) => setTrainerForm({...trainerForm, phone: e.target.value})}
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

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "—" : classes.length}</div>
                        <p className="text-xs text-muted-foreground">Scheduled active classes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Trainers</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "—" : trainers.length}</div>
                        <p className="text-xs text-muted-foreground">Staff members</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "—" : totalCapacity}</div>
                        <p className="text-xs text-muted-foreground">Total spots available</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilization</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "—" : `${utilizationRate}%`}</div>
                        <p className="text-xs text-muted-foreground">Overall fill rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="classes" onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                    <TabsTrigger value="trainers">Trainers</TabsTrigger>
                </TabsList>

                <TabsContent value="classes" className="mt-6 space-y-4">
                    {loading ? (
                        <div className="py-10 text-center text-muted-foreground">Loading classes...</div>
                    ) : classes.length === 0 ? (
                        <Card className="border-dashed border-muted-foreground/30">
                            <CardContent className="py-10 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-1">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">No classes scheduled yet</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Use the Schedule Class button to add your first session.
                                    </p>
                                </div>
                                <Button size="sm" onClick={handlePrimaryAction}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Schedule your first class
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {classes.map((cls) => {
                                const currentSchedule = cls.schedule?.[0]; // Taking first schedule for display
                                const utilizationRaw = ((cls.enrolled || 0) / cls.capacity) * 100;
                                const utilization = Math.min(100, Math.round(utilizationRaw));
                                let statusLabel = "Plenty of spots";
                                let statusClass = "text-emerald-600";

                                if (utilization === 0) {
                                    statusLabel = "No bookings yet";
                                    statusClass = "text-muted-foreground";
                                } else if (utilization >= 90) {
                                    statusLabel = "Almost full";
                                    statusClass = "text-amber-600";
                                } else if (utilization >= 60) {
                                    statusLabel = "Filling up";
                                    statusClass = "text-amber-600";
                                }

                                return (
                                    <Card key={cls.id} className="overflow-hidden border-l-4 border-l-primary">
                                        <CardHeader className="pb-3 bg-muted/20">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Badge variant="secondary" className="mb-2 uppercase text-[10px]">
                                                        {cls.type}
                                                    </Badge>
                                                    <CardTitle className="text-base">{cls.name}</CardTitle>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <div className="space-y-3 text-sm">
                                                <div className="flex items-center text-muted-foreground">
                                                    <User className="mr-2 h-4 w-4 text-primary" /> {cls.trainerName}
                                                </div>
                                                <div className="flex items-center text-muted-foreground">
                                                    <Clock className="mr-2 h-4 w-4 text-primary" /> 
                                                    {currentSchedule ? `${currentSchedule.startTime} - ${currentSchedule.endTime}` : "No schedule"}
                                                </div>
                                                <div className="w-full bg-secondary/10 rounded-full h-2 mt-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all"
                                                        style={{ width: `${utilization}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{cls.enrolled || 0} booked</span>
                                                    <span>{cls.capacity} capacity</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className={statusClass}>{statusLabel}</span>
                                                    <span className="text-muted-foreground">{utilization}% filled</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="trainers" className="mt-6">
                    {loading ? (
                        <div className="py-10 text-center text-muted-foreground">Loading trainers...</div>
                    ) : trainers.length === 0 ? (
                        <Card className="border-dashed border-muted-foreground/30">
                            <CardContent className="py-10 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-1">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">No trainers added yet</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Add your first trainer to assign classes and track performance.
                                    </p>
                                </div>
                                <Button size="sm" onClick={handlePrimaryAction}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add your first trainer
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {trainers.map((trainer) => (
                                <Card key={trainer.id}>
                                    <CardContent className="pt-6 text-center">
                                        <Avatar className="h-24 w-24 mx-auto mb-4">
                                            <AvatarFallback className="text-xl">
                                                {trainer.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-bold text-lg">{trainer.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-4 capitalize">{trainer.role}</p>

                                        <div className="flex gap-2 justify-center">
                                            <Button variant="outline" size="sm">Profile</Button>
                                            <Button size="sm" variant="ghost">Message</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
