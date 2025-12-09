import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, CalendarClock } from "lucide-react";

interface UpcomingClassProps {
    className?: string;
    title: string;
    time: string;
    location: string;
    duration: string;
    isToday?: boolean;
}

export function UpcomingClassCard({
    title,
    time,
    location,
    duration,
    isToday = false,
    className
}: UpcomingClassProps) {
    return (
        <Card className={`border-l-4 border-l-primary shadow-sm ${className}`}>
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gray-50 flex flex-col items-center justify-center font-bold text-gray-600 border border-gray-100">
                        {isToday ? (
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Today</span>
                        ) : (
                            <CalendarClock className="h-4 w-4 text-primary" />
                        )}
                        <span className="text-lg">{time}</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-base text-gray-900">{title}</h4>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 mr-1" /> {location} • {duration}
                        </div>
                    </div>
                    <Button size="sm" className="rounded-full px-4 h-8 text-xs">Check In</Button>
                </div>
            </CardContent>
        </Card>
    );
}
