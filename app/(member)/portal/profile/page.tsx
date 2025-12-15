"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Lock, Bell, LogOut, Camera, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, meApi } from "@/lib/api/client";
import type { Member } from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";

export default function MemberProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const toast = useToast();

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await meApi.getProfile();
            setProfile(res);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to load profile";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePasswordChange = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast({ title: "Missing fields", description: "All password fields are required", variant: "warning" });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast({ title: "Password too short", description: "New password must be at least 6 characters", variant: "warning" });
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast({ title: "Passwords don't match", description: "New password and confirmation must match", variant: "warning" });
            return;
        }

        setPasswordChanging(true);
        try {
            await meApi.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            toast({ title: "Password changed", description: "Your password has been updated successfully", variant: "success" });
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to change password";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setPasswordChanging(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const displayName = profile?.name || user?.name || "Member";
    const nameParts = displayName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    const initials = displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const memberSince = profile?.createdAt 
        ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "—";

    if (loading) {
        return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading profile...</div>;
    }

    if (error) {
        return (
            <div className="py-20 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={loadProfile}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-muted-foreground text-sm">Manage your personal information and account settings.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadProfile}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar / Profile Card */}
                <Card className="md:w-1/3 h-fit shadow-sm">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={profile?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} />
                                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md">
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <h2 className="mt-4 text-xl font-bold">{displayName}</h2>
                        <Badge variant={profile?.status === "Active" ? "success" : "secondary"} className="mt-1">
                            {profile?.plan || "No Plan"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">Member since {memberSince}</p>
                        
                        {profile?.expiryDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Expires: {new Date(profile.expiryDate).toLocaleDateString()}
                            </p>
                        )}

                        <div className="w-full mt-6 space-y-2">
                            <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {}}
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Log Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings Tabs */}
                <div className="md:w-2/3">
                    <Tabs defaultValue="general">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general"><User className="mr-2 h-4 w-4" /> Detail</TabsTrigger>
                            <TabsTrigger value="security"><Lock className="mr-2 h-4 w-4" /> Security</TabsTrigger>
                            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Alerts</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="mt-4">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle>Personal Details</CardTitle>
                                    <CardDescription>Your contact information.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input id="firstName" value={firstName} readOnly className="bg-muted/50" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input id="lastName" value={lastName} readOnly className="bg-muted/50" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" value={profile?.email || ""} readOnly className="bg-muted/50" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" type="tel" value={profile?.phone || ""} readOnly className="bg-muted/50" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Input id="address" value={profile?.address || "—"} readOnly className="bg-muted/50" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Contact your gym to update your details.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security" className="mt-4">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                    <CardDescription>Ensure your account remains secure.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <Input 
                                            id="currentPassword" 
                                            type="password" 
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <Input 
                                            id="newPassword" 
                                            type="password" 
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            placeholder="Enter new password (min 6 characters)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <Input 
                                            id="confirmPassword" 
                                            type="password" 
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                    <Button 
                                        onClick={handlePasswordChange}
                                        disabled={passwordChanging || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                                        className="w-full"
                                    >
                                        {passwordChanging ? "Updating..." : "Update Password"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notifications" className="mt-4">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle>Preferences</CardTitle>
                                    <CardDescription>Choose how we communicate with you.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-zinc-50 transition-colors">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Email Notifications</Label>
                                            <p className="text-xs text-muted-foreground">Receive invoices and newsletters.</p>
                                        </div>
                                        <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-zinc-50 transition-colors">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">SMS Alerts</Label>
                                            <p className="text-xs text-muted-foreground">Get urgent updates about class cancellations.</p>
                                        </div>
                                        <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-zinc-50 transition-colors">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">WhatsApp Reminders</Label>
                                            <p className="text-xs text-muted-foreground">Receive class reminders and expiry alerts.</p>
                                        </div>
                                        <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
