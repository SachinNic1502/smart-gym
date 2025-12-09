"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";

const INITIAL_CLASSES = [
    { name: "Morning Yoga", trainer: "Sarah Connor", time: "07:00 AM", duration: "60 min", attendees: 12, max: 20 },
    { name: "HIIT Blast", trainer: "Mike Tyson", time: "06:00 PM", duration: "45 min", attendees: 18, max: 20 },
    { name: "Zumba", trainer: "Alex Dance", time: "05:00 PM", duration: "60 min", attendees: 8, max: 25 },
];

const INITIAL_TRAINERS = [
    { name: "Sarah Connor", role: "Yoga Instructor", clients: 15, rating: 4.9, img: "" },
    { name: "Mike Tyson", role: "Boxing Coach", clients: 22, rating: 5.0, img: "" },
];

export default function ClassesPage() {
    const [activeTab, setActiveTab] = useState("classes");
    const [classes, setClasses] = useState(INITIAL_CLASSES);
    const [trainers, setTrainers] = useState(INITIAL_TRAINERS);
    const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
    const [isTrainerDialogOpen, setIsTrainerDialogOpen] = useState(false);
    const [classForm, setClassForm] = useState({
        name: "",
        trainer: "",
        time: "",
        duration: "",
        max: "",
    });
    const [trainerForm, setTrainerForm] = useState({
        name: "",
        role: "",
        clients: "",
        rating: "",
    });
    const toast = useToast();

    const totalBookings = classes.reduce((sum, cls) => sum + cls.attendees, 0);

    const handlePrimaryAction = () => {
        if (activeTab === "classes") {
            setIsClassDialogOpen(true);
        } else {
            setIsTrainerDialogOpen(true);
        }
    };

    const handleCreateClass = () => {
        if (!classForm.name.trim() || !classForm.trainer.trim() || !classForm.time.trim()) {
            toast({
                title: "Missing details",
                description: "Please fill class name, trainer and time.",
                variant: "warning",
            });
            return;
        }

        const max = Number(classForm.max) || 20;
        const newClass = {
            name: classForm.name,
            trainer: classForm.trainer,
            time: classForm.time,
            duration: classForm.duration || "60 min",
            attendees: 0,
            max,
        };

        setClasses((prev) => [...prev, newClass]);
        setIsClassDialogOpen(false);
        setClassForm({ name: "", trainer: "", time: "", duration: "", max: "" });
        toast({
            title: "Class scheduled",
            description: `${newClass.name} has been added to today's schedule (mock).`,
            variant: "success",
        });
    };

    const handleCreateTrainer = () => {
        if (!trainerForm.name.trim()) {
            toast({
                title: "Missing name",
                description: "Please enter the trainer name.",
                variant: "warning",
            });
            return;
        }

        const clients = Number(trainerForm.clients) || 0;
        const rating = Number(trainerForm.rating) || 5.0;
        const newTrainer = {
            name: trainerForm.name,
            role: trainerForm.role || "Trainer",
            clients,
            rating,
            img: "",
        };

        setTrainers((prev) => [...prev, newTrainer]);
        setIsTrainerDialogOpen(false);
        setTrainerForm({ name: "", role: "", clients: "", rating: "" });
        toast({
            title: "Trainer added",
            description: `${newTrainer.name} has been added to your branch team (mock).`,
            variant: "success",
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Classes & Trainers</h2>
                    <p className="text-muted-foreground">Manage your gym schedules and staff.</p>
                </div>
                <Button
                    type="button"
                    onClick={handlePrimaryAction}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {activeTab === "classes" ? "Schedule Class" : "Add Trainer"}
                </Button>
            </div>

            <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Schedule Class</DialogTitle>
                        <DialogDescription>
                            Create a new class for today. This is mock-only and does not affect real schedules.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="cls-name">
                                Class name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="cls-name"
                                placeholder="e.g. Evening Strength"
                                value={classForm.name}
                                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cls-trainer">
                                Trainer <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="cls-trainer"
                                placeholder="e.g. Coach Neha"
                                value={classForm.trainer}
                                onChange={(e) => setClassForm({ ...classForm, trainer: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cls-time">
                                    Time <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="cls-time"
                                    placeholder="e.g. 06:30 PM"
                                    value={classForm.time}
                                    onChange={(e) => setClassForm({ ...classForm, time: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cls-duration">Duration</Label>
                                <Input
                                    id="cls-duration"
                                    placeholder="e.g. 45 min"
                                    value={classForm.duration}
                                    onChange={(e) => setClassForm({ ...classForm, duration: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cls-max">Capacity</Label>
                            <Input
                                id="cls-max"
                                type="number"
                                placeholder="e.g. 20"
                                value={classForm.max}
                                onChange={(e) => setClassForm({ ...classForm, max: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => {
                                setIsClassDialogOpen(false);
                                setClassForm({ name: "", trainer: "", time: "", duration: "", max: "" });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateClass}
                            disabled={!classForm.name.trim() || !classForm.trainer.trim() || !classForm.time.trim()}
                        >
                            Save Class
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isTrainerDialogOpen} onOpenChange={setIsTrainerDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Add Trainer</DialogTitle>
                        <DialogDescription>
                            Add a new trainer profile for this branch (mock-only).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="tr-name">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="tr-name"
                                placeholder="e.g. Coach Rahul"
                                value={trainerForm.name}
                                onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tr-role">Role</Label>
                            <Input
                                id="tr-role"
                                placeholder="e.g. Strength Coach"
                                value={trainerForm.role}
                                onChange={(e) => setTrainerForm({ ...trainerForm, role: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tr-clients">Clients</Label>
                                <Input
                                    id="tr-clients"
                                    type="number"
                                    placeholder="e.g. 10"
                                    value={trainerForm.clients}
                                    onChange={(e) => setTrainerForm({ ...trainerForm, clients: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tr-rating">Rating</Label>
                                <Input
                                    id="tr-rating"
                                    type="number"
                                    step="0.1"
                                    placeholder="e.g. 4.8"
                                    value={trainerForm.rating}
                                    onChange={(e) => setTrainerForm({ ...trainerForm, rating: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => {
                                setIsTrainerDialogOpen(false);
                                setTrainerForm({ name: "", role: "", clients: "", rating: "" });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateTrainer}
                            disabled={!trainerForm.name.trim()}
                        >
                            Save Trainer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{classes.length}</div>
                        <p className="text-xs text-muted-foreground">Scheduled for today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Trainers</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{trainers.length}</div>
                        <p className="text-xs text-muted-foreground">On shift currently</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBookings}</div>
                        <p className="text-xs text-muted-foreground">Based on scheduled classes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilization</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">78%</div>
                        <p className="text-xs text-muted-foreground">Class capacity fill rate</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="classes" onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                    <TabsTrigger value="trainers">Trainers</TabsTrigger>
                </TabsList>

                <TabsContent value="classes" className="mt-6 space-y-4">
                    {classes.length === 0 ? (
                        <Card className="border-dashed border-muted-foreground/30">
                            <CardContent className="py-10 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-1">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">No classes scheduled yet</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Use the Schedule Class button to add your first session (mock-only).
                                    </p>
                                </div>
                                <Button type="button" size="sm" onClick={handlePrimaryAction}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Schedule your first class
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {classes.map((cls, i) => {
                                const utilizationRaw = (cls.attendees / cls.max) * 100;
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
                                    <Card
                                        key={`${cls.name}-${i}`}
                                        className="overflow-hidden border-l-4 border-l-primary"
                                    >
                                        <CardHeader className="pb-3 bg-muted/20">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Badge variant="secondary" className="mb-2">
                                                        Today
                                                    </Badge>
                                                    <CardTitle>{cls.name}</CardTitle>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    type="button"
                                                    onClick={() =>
                                                        toast({
                                                            title: "Class actions",
                                                            description:
                                                                "Class edit/cancel options are mock-only in this UI.",
                                                            variant: "info",
                                                        })
                                                    }
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <div className="space-y-3 text-sm">
                                                <div className="flex items-center text-muted-foreground">
                                                    <User className="mr-2 h-4 w-4 text-primary" /> {cls.trainer}
                                                </div>
                                                <div className="flex items-center text-muted-foreground">
                                                    <Clock className="mr-2 h-4 w-4 text-primary" /> {cls.time} ({cls.duration})
                                                </div>
                                                <div className="w-full bg-secondary/10 rounded-full h-2 mt-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all"
                                                        style={{ width: `${utilization}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{cls.attendees} booked</span>
                                                    <span>{cls.max} capacity</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className={statusClass}>{statusLabel}</span>
                                                    <span className="text-muted-foreground">{utilization}% utilization</span>
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
                    {trainers.length === 0 ? (
                        <Card className="border-dashed border-muted-foreground/30">
                            <CardContent className="py-10 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-1">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">No trainers added yet</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Add your first trainer to assign classes and track performance (mock-only).
                                    </p>
                                </div>
                                <Button type="button" size="sm" onClick={handlePrimaryAction}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add your first trainer
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {trainers.map((trainer, i) => {
                                let statusLabel = "Taking new clients";
                                let statusClass = "text-emerald-600";

                                if (trainer.clients === 0) {
                                    statusLabel = "No clients yet";
                                    statusClass = "text-muted-foreground";
                                } else if (trainer.clients >= 20 || trainer.rating >= 4.8) {
                                    statusLabel = "In high demand";
                                    statusClass = "text-amber-600";
                                } else if (trainer.clients >= 10) {
                                    statusLabel = "Healthy roster";
                                    statusClass = "text-sky-600";
                                }

                                return (
                                    <Card key={`${trainer.name}-${i}`}>
                                        <CardContent className="pt-6 text-center">
                                            <Avatar className="h-24 w-24 mx-auto mb-4">
                                                <AvatarImage src={trainer.img} />
                                                <AvatarFallback className="text-xl">
                                                    {trainer.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <h3 className="font-bold text-lg">{trainer.name}</h3>
                                            <p className="text-sm text-muted-foreground mb-4">{trainer.role}</p>

                                            <div className="flex justify-center gap-4 text-sm mb-2">
                                                <div>
                                                    <p className="font-bold text-foreground">{trainer.clients}</p>
                                                    <p className="text-muted-foreground text-xs">Clients</p>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{trainer.rating}</p>
                                                    <p className="text-muted-foreground text-xs">Rating</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 text-xs font-medium">
                                                <span className={statusClass}>{statusLabel}</span>
                                            </div>

                                            <div className="flex gap-2 justify-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    type="button"
                                                    onClick={() =>
                                                        toast({
                                                            title: "Trainer profile",
                                                            description:
                                                                "Trainer profile details are mock-only here.",
                                                            variant: "info",
                                                        })
                                                    }
                                                >
                                                    Profile
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    type="button"
                                                    onClick={() =>
                                                        toast({
                                                            title: "Trainer message",
                                                            description: "Messaging trainers is mock-only in this demo.",
                                                            variant: "info",
                                                        })
                                                    }
                                                >
                                                    Message
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
