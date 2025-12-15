"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, MapPin, User, RefreshCcw, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ApiError, classesApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { GymClass } from "@/lib/types";

export default function MemberSchedulePage() {
    const { user } = useAuth();
    const branchId = user?.branchId;

    const [classes, setClasses] = useState<GymClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const loadClasses = useCallback(async () => {
        if (!branchId) {
            setError("Branch not assigned");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await classesApi.list({ branchId, status: "active" });
            setClasses(res.data ?? []);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to load classes";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        loadClasses();
    }, [loadClasses]);

    const filteredClasses = classes.filter((cls) =>
        cls.name.toLowerCase().includes(search.toLowerCase()) ||
        cls.trainerName?.toLowerCase().includes(search.toLowerCase())
    );

    // Helper to get next schedule day
    const getNextScheduleDay = (schedule: GymClass["schedule"]) => {
        if (!schedule || schedule.length === 0) return { day: "TBD", time: "TBD" };
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = new Date().getDay();
        
        // Find the next upcoming day
        for (let i = 0; i < 7; i++) {
            const checkDay = (today + i) % 7;
            const slot = schedule.find((s) => s.dayOfWeek === checkDay);
            if (slot) {
                const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[checkDay];
                return { day: label, time: slot.startTime };
            }
        }
        return { day: days[schedule[0]?.dayOfWeek ?? 0] || "TBD", time: schedule[0]?.startTime || "TBD" };
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Class Schedule</h1>
                    <p className="text-muted-foreground text-sm">View upcoming fitness classes at your gym.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search classes..." 
                            className="pl-9" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={loadClasses}>
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-muted-foreground animate-pulse">Loading classes...</div>
            ) : error ? (
                <div className="py-20 text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={loadClasses}>Retry</Button>
                </div>
            ) : filteredClasses.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="font-medium">No classes available</p>
                    <p className="text-sm">Check back later for new class schedules.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClasses.map((cls) => {
                        const nextSlot = getNextScheduleDay(cls.schedule);
                        const spotsLeft = cls.capacity - (cls.enrolled || 0);
                        const isFull = spotsLeft <= 0;

                        return (
                            <Card key={cls.id} className="border-l-4 border-l-primary/50 hover:border-l-primary transition-all hover:shadow-md">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant={isFull ? "destructive" : "secondary"}>
                                            {isFull ? "Full" : "Open"}
                                        </Badge>
                                        <span className="text-xs font-bold text-muted-foreground uppercase">{nextSlot.day}</span>
                                    </div>
                                    <CardTitle className="text-lg mt-2">{cls.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <User className="mr-2 h-4 w-4 text-primary" /> {cls.trainerName || "Staff"}
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <Clock className="mr-2 h-4 w-4 text-primary" /> {nextSlot.time}
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPin className="mr-2 h-4 w-4 text-primary" /> {cls.type}
                                        </div>

                                        <div className="pt-4 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {spotsLeft > 0 ? `${spotsLeft} spots left` : "Waitlist available"}
                                            </span>
                                            <Button size="sm" disabled={isFull} variant={isFull ? "outline" : "default"}>
                                                {isFull ? "Join Waitlist" : "Book Now"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
