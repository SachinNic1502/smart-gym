"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { meApi, ApiError, staffApi } from "@/lib/api/client";
import { User, Mail, Phone, MapPin, Calendar, Shield, CreditCard, Bell, Lock, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import type { Member } from "@/lib/types";

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Partial<Member>>({});
    const [trainerName, setTrainerName] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const data = await meApi.getProfile();
                setProfile(data);

                if (data.trainerId && data.branchId) {
                    // Try to finding trainer in the list as we don't have getById exposed in client yet, 
                    // or better, implement getById if needed. 
                    // Actually, staffApi.list({ branchId, role: 'trainer' }) is cleaner.
                    const staff = await staffApi.list({ branchId: data.branchId, role: 'trainer', page: "1", pageSize: "100" });
                    const trainer = staff.data.find(s => s.id === data.trainerId);
                    if (trainer) setTrainerName(trainer.name);
                }

            } catch (err) {
                console.error("Failed to load profile:", err);
                toast({
                    title: "Error",
                    description: "Failed to load profile data",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchProfile();
        }
    }, [user, toast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await meApi.updateProfile({
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                dateOfBirth: profile.dateOfBirth,
                address: profile.address,
            });
            setProfile(updated);
            toast({
                title: "Success",
                description: "Profile updated successfully",
                variant: "success"
            });
        } catch (err) {
            console.error("Failed to update profile:", err);
            const message = err instanceof ApiError ? err.message : "Failed to update profile";
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your profile information and preferences.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-6">
                    <Card className="border-none shadow-md overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary"></div>
                        <div className="px-6 pb-6 -mt-12 text-center">
                            <div className="relative inline-block">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                                    <AvatarImage src={profile.image || user.avatar} />
                                    <AvatarFallback className="text-2xl bg-slate-100">{profile.name?.charAt(0) || user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <h2 className="mt-3 text-xl font-bold">{profile.name || user.name}</h2>
                            <p className="text-sm text-muted-foreground">{profile.email || user.email}</p>
                            <Badge variant="secondary" className="mt-3 px-3 py-1 font-medium bg-primary/10 text-primary hover:bg-primary/20">
                                {user.role === 'member' ? 'Premium Member' : 'Admin'}
                            </Badge>
                        </div>
                    </Card>

                    <div className="space-y-1">
                        <div className="px-3 py-2 text-sm font-medium text-slate-500 uppercase tracking-wider">
                            Settings
                        </div>
                        <Button variant="ghost" className="w-full justify-start gap-3 bg-slate-100/80 font-medium">
                            <User className="w-4 h-4" /> Personal Info
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600">
                            <CreditCard className="w-4 h-4" /> Billing & Plans
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600">
                            <Bell className="w-4 h-4" /> Notifications
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600">
                            <Shield className="w-4 h-4" /> Security
                        </Button>

                        <Separator className="my-4" />

                        <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => logout()}>
                            <LogOut className="w-4 h-4" /> Sign Out
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="firstName"
                                            value={profile.name || ""}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="dob"
                                            type="date"
                                            value={profile.dateOfBirth || ""}
                                            onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        value={profile.email || ""}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        value={profile.phone || ""}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="address"
                                        value={profile.address || ""}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        placeholder="123 Gym Street, City"
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preferences */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Preferences</CardTitle>
                            <CardDescription>Manage your app experience.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive updates about your membership and classes.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">SMS Reminders</Label>
                                    <p className="text-sm text-muted-foreground">Get text alerts for upcoming bookings.</p>
                                </div>
                                <Switch />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Public Profile</Label>
                                    <p className="text-sm text-muted-foreground">Allow other members to find you in the community.</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>

                    {/* My Trainer */}
                    {profile.trainerId && (
                        <Card className="border-none shadow-sm bg-indigo-50/50">
                            <CardHeader>
                                <CardTitle className="text-indigo-900">My Personal Trainer</CardTitle>
                                <CardDescription className="text-indigo-700/80">Your assigned fitness coach.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl border-4 border-white shadow-sm">
                                        <span className="uppercase">{trainerName ? trainerName.charAt(0) : "T"}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-indigo-950">{trainerName || "Loading..."}</h3>
                                        <p className="text-sm text-indigo-700 font-medium">Certified Personal Trainer</p>
                                        <Button variant="link" className="px-0 text-indigo-600 h-auto mt-1">Send Message</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
