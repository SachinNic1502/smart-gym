"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, User, Search, BookOpen, Users, CheckCircle, XCircle } from "lucide-react";
import { ApiError, classesApi, meApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast-provider";
import type { Member, GymClass } from "@/lib/types";

interface ClassBooking {
  id: string;
  classId: string;
  memberId: string;
  bookingDate: string;
  status: "confirmed" | "cancelled" | "completed";
  bookedAt: string;
}

export default function MemberBookingsPage() {
  const { user } = useAuth();
  const branchId = user?.branchId;
  const toast = useToast();

  const [profile, setProfile] = useState<Member | null>(null);
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
  const [bookingDialog, setBookingDialog] = useState(false);

  const loadData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch profile
      const profileRes = await meApi.getProfile();
      setProfile(profileRes);

      // Fetch available classes
      const classesRes = await classesApi.list({ branchId, status: "active" });
      setClasses(classesRes.data ?? []);

      // Fetch member's bookings (mock data for now)
      const mockBookings: ClassBooking[] = [
        {
          id: "1",
          classId: "class1",
          memberId: profileRes?.id || "",
          bookingDate: new Date().toISOString(),
          status: "confirmed",
          bookedAt: new Date().toISOString()
        }
      ];
      setBookings(mockBookings);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load bookings";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const bookClass = async (classItem: GymClass) => {
    if (!profile) return;

    // Check if already booked
    const existingBooking = bookings.find(b => b.classId === classItem.id);
    if (existingBooking) {
      toast({ 
        title: "Already Booked", 
        description: "You have already booked this class",
        variant: "warning" 
      });
      return;
    }

    // Check class capacity
    const currentBookings = bookings.filter(b => b.classId === classItem.id && b.status === "confirmed").length;
    if (currentBookings >= (classItem.capacity || 20)) {
      toast({ 
        title: "Class Full", 
        description: "This class is already at maximum capacity",
        variant: "destructive" 
      });
      return;
    }

    const newBooking: ClassBooking = {
      id: Date.now().toString(),
      classId: classItem.id,
      memberId: profile.id,
      bookingDate: new Date().toISOString(),
      status: "confirmed",
      bookedAt: new Date().toISOString()
    };

    setBookings([...bookings, newBooking]);
    setBookingDialog(false);
    setSelectedClass(null);

    toast({ 
      title: "Class Booked", 
      description: `Successfully booked ${classItem.name}`,
      variant: "success" 
    });
  };

  const cancelBooking = async (bookingId: string) => {
    setBookings(bookings.map(b => 
      b.id === bookingId ? { ...b, status: "cancelled" } : b
    ));

    toast({ 
      title: "Booking Cancelled", 
      description: "Your booking has been cancelled",
      variant: "success" 
    });
  };

  const getBookedClasses = () => {
    return bookings
      .filter(b => b.status === "confirmed")
      .map(booking => classes.find(c => c.id === booking.classId))
      .filter(Boolean) as GymClass[];
  };

  const getAvailableClasses = () => {
    const bookedClassIds = bookings.map(b => b.classId);
    return classes.filter(c => !bookedClassIds.includes(c.id));
  };

  const getClassStatus = (classItem: GymClass) => {
    const booking = bookings.find(b => b.classId === classItem.id);
    if (booking) {
      switch (booking.status) {
        case "confirmed": return { text: "Booked", variant: "default" as const };
        case "cancelled": return { text: "Cancelled", variant: "secondary" as const };
        case "completed": return { text: "Completed", variant: "outline" as const };
        default: return { text: "Unknown", variant: "outline" as const };
      }
    }
    return { text: "Available", variant: "secondary" as const };
  };

  const filteredAvailableClasses = getAvailableClasses().filter(cls =>
    cls.name.toLowerCase().includes(search.toLowerCase()) ||
    cls.trainerName?.toLowerCase().includes(search.toLowerCase())
  );

  const bookedClasses = getBookedClasses();

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading bookings...</div>;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Class Bookings</h1>
        <p className="text-muted-foreground">Book and manage your fitness classes</p>
      </div>

      {/* Booking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Booked Classes</p>
                <p className="text-2xl font-bold">{bookedClasses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{filteredAvailableClasses.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Classes to book</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* My Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookedClasses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No classes booked yet</p>
              <p className="text-sm text-muted-foreground">Browse available classes below</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookedClasses.map((classItem) => (
                <div key={classItem.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{classItem.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {classItem.schedule?.[0] ? 
                            `Day ${classItem.schedule[0].dayOfWeek}` : 
                            "Flexible schedule"
                          }
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {classItem.schedule?.[0]?.startTime || "TBD"} - {classItem.schedule?.[0]?.endTime || "TBD"}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {classItem.type}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {classItem.trainerName || "TBD"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Booked</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelBooking(bookings.find(b => b.classId === classItem.id)?.id || "")}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Available Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredAvailableClasses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No available classes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAvailableClasses.map((classItem) => (
                <div key={classItem.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{classItem.name}</h3>
                    <Badge variant="secondary">{classItem.type}</Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{classItem.description}</p>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {classItem.schedule?.[0] ? 
                        `Day ${classItem.schedule[0].dayOfWeek}` : 
                        "Flexible schedule"
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {classItem.schedule?.[0]?.startTime || "TBD"} - {classItem.schedule?.[0]?.endTime || "TBD"}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {classItem.type}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {classItem.trainerName || "No trainer assigned"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {classItem.capacity || 20} max capacity
                    </div>
                  </div>

                  <Dialog open={bookingDialog && selectedClass?.id === classItem.id} onOpenChange={setBookingDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full"
                        onClick={() => setSelectedClass(classItem)}
                      >
                        Book Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Booking</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold">{classItem.name}</h4>
                          <p className="text-sm text-muted-foreground">{classItem.description}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><strong>Schedule:</strong> {classItem.schedule?.[0] ? `Day ${classItem.schedule[0].dayOfWeek}` : "Flexible schedule"}</div>
                          <div><strong>Time:</strong> {classItem.schedule?.[0]?.startTime || "TBD"} - {classItem.schedule?.[0]?.endTime || "TBD"}</div>
                          <div><strong>Trainer:</strong> {classItem.trainerName || "TBD"}</div>
                          <div><strong>Location:</strong> {classItem.type}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => bookClass(classItem)}>Confirm Booking</Button>
                          <Button variant="outline" onClick={() => setBookingDialog(false)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
