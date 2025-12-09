import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Calendar, Clock, Trophy, MapPin } from "lucide-react";
import { UpcomingClassCard } from "@/components/widgets/upcoming-class-card";

export default function MemberDashboard() {
    return (
        <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">

            {/* Welcome Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Hello, Alex 👋</h1>
                    <p className="text-muted-foreground text-sm">Let's crush your goals today!</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-md">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Profile" />
                </div>
            </div>

            {/* Membership Card */}
            <div className="relative group perspective">
                <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <Card className="relative bg-gradient-to-br from-[#0A2540] to-[#3A86FF] text-white border-none shadow-2xl overflow-hidden rounded-2xl">
                    {/* Decorative circles */}
                    <div className="absolute top-[-50px] right-[-50px] h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-[-20px] left-[-20px] h-32 w-32 rounded-full bg-blue-400/20 blur-2xl"></div>

                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">SmartFit Member</p>
                                <h2 className="text-2xl font-bold tracking-tight">Gold Premium</h2>
                                <div className="mt-6 flex flex-col gap-1">
                                    <span className="text-xs text-blue-200">Alex Johnson</span>
                                    <span className="text-sm font-mono tracking-widest opacity-80">•••• •••• •••• 1092</span>
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded-xl h-28 w-28 flex flex-col items-center justify-center shadow-lg">
                                <QrCode className="h-20 w-20 text-black" />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between items-end">
                            <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 backdrop-blur-sm">Active Status</Badge>
                            <span className="text-xs text-blue-200">Valid thru Dec 2025</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <p className="text-xs text-center text-muted-foreground">Scan this QR code at the entrance for access.</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white shadow border-none">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-orange-50 rounded-full mb-2">
                            <Trophy className="h-6 w-6 text-orange-500" />
                        </div>
                        <div className="font-bold text-2xl">12</div>
                        <div className="text-xs text-muted-foreground font-medium">Visits this month</div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow border-none">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-purple-50 rounded-full mb-2">
                            <Calendar className="h-6 w-6 text-purple-500" />
                        </div>
                        <div className="font-bold text-2xl">3</div>
                        <div className="text-xs text-muted-foreground font-medium">Classes Booked</div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Class */}
            <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-lg">Up Next</h3>
                <a href="/portal/schedule" className="text-xs text-primary hover:underline">View Schedule</a>
            </div>
            <UpcomingClassCard
                title="HIIT Training"
                time="18:00"
                location="Studio A"
                duration="45 mins"
                isToday={true}
            />

            {/* Recent Activity */}
            <div>
                <h3 className="font-semibold text-lg mb-3 px-1">History</h3>
                <Card className="shadow-sm border-none bg-white">
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Gym Visit</p>
                                            <p className="text-xs text-muted-foreground">Yesterday, 5:30 PM</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">1h 20m</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
