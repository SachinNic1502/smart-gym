"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Clock, MapPin, User } from "lucide-react";
import { Input } from "@/components/ui/input";

const SCHEDULE_DATA = [
    {
        id: 1,
        title: "Morning Yoga Flow",
        trainer: "Sarah Connor",
        time: "07:00 AM",
        duration: "60 min",
        location: "Studio A",
        spots: 5,
        status: "Open",
        day: "Today"
    },
    {
        id: 2,
        title: "HIIT Blast",
        trainer: "Mike Tyson",
        time: "06:00 PM",
        duration: "45 min",
        location: "Main Gym Floor",
        spots: 0,
        status: "Full",
        day: "Today"
    },
    {
        id: 3,
        title: "Zumba Dance",
        trainer: "Alex Dance",
        time: "05:00 PM",
        duration: "60 min",
        location: "Studio B",
        spots: 12,
        status: "Open",
        day: "Tomorrow"
    },
    {
        id: 4,
        title: "Power Lifting",
        trainer: "Ronnie Coleman",
        time: "08:00 PM",
        duration: "90 min",
        location: "Weight Room",
        spots: 8,
        status: "Open",
        day: "Tomorrow"
    }
];

export default function MemberSchedulePage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Class Schedule</h1>
                    <p className="text-muted-foreground">Book your spot in upcoming fitness classes.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search classes..." className="pl-9" />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Date Filters (Mock) */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['Today', 'Tomorrow', 'Wed 11', 'Thu 12', 'Fri 13'].map((day, i) => (
                    <Button
                        key={day}
                        variant={i === 0 ? "default" : "outline"}
                        className={`rounded-full px-6 ${i === 0 ? 'shadow-md shadow-primary/20' : 'border-gray-200'}`}
                    >
                        {day}
                    </Button>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {SCHEDULE_DATA.map((cls) => (
                    <Card key={cls.id} className="border-l-4 border-l-primary/50 hover:border-l-primary transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant={cls.status === 'Full' ? 'destructive' : 'secondary'}>
                                    {cls.status}
                                </Badge>
                                <span className="text-xs font-bold text-muted-foreground uppercase">{cls.day}</span>
                            </div>
                            <CardTitle className="text-lg mt-2">{cls.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center text-muted-foreground">
                                    <User className="mr-2 h-4 w-4 text-primary" /> {cls.trainer}
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                    <Clock className="mr-2 h-4 w-4 text-primary" /> {cls.time} ({cls.duration})
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                    <MapPin className="mr-2 h-4 w-4 text-primary" /> {cls.location}
                                </div>

                                <div className="pt-4 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {cls.spots > 0 ? `${cls.spots} spots left` : 'Waitlist available'}
                                    </span>
                                    <Button size="sm" disabled={cls.status === 'Full'}>
                                        {cls.status === 'Full' ? 'Join Waitlist' : 'Book Now'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
