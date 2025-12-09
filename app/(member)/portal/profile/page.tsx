"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Lock, Bell, LogOut, Camera } from "lucide-react";

export default function MemberProfilePage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">Manage your personal information and account settings.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar / Profile Card */}
                <Card className="md:w-1/3 h-fit">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
                                <AvatarFallback>AJ</AvatarFallback>
                            </Avatar>
                            <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md">
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <h2 className="mt-4 text-xl font-bold">Alex Johnson</h2>
                        <p className="text-sm text-muted-foreground">Gold Premium Member</p>
                        <p className="text-xs text-muted-foreground mt-1">Member since Jan 2024</p>

                        <div className="w-full mt-6 space-y-2">
                            <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Details</CardTitle>
                                    <CardDescription>Update your contact information.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input id="firstName" defaultValue="Alex" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input id="lastName" defaultValue="Johnson" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" defaultValue="alex@example.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" type="tel" defaultValue="+1 555 123 4567" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Input id="address" defaultValue="123 Fitness Blvd, Gym City" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button>Save Changes</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                    <CardDescription>Ensure your account remains secure.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current">Current Password</Label>
                                        <Input id="current" type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new">New Password</Label>
                                        <Input id="new" type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm">Confirm Password</Label>
                                        <Input id="confirm" type="password" />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button>Update Password</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notifications" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Preferences</CardTitle>
                                    <CardDescription>Choose how we communicate with you.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Mock Toggles */}
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Email Notifications</Label>
                                            <p className="text-xs text-muted-foreground">Receive invoices and newsletters.</p>
                                        </div>
                                        <div className="h-6 w-11 rounded-full bg-primary relative cursor-pointer"><div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm"></div></div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">SMS Alerts</Label>
                                            <p className="text-xs text-muted-foreground">Get urgent updates about class cancellations.</p>
                                        </div>
                                        <div className="h-6 w-11 rounded-full bg-primary relative cursor-pointer"><div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm"></div></div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">WhatsApp Reminders</Label>
                                            <p className="text-xs text-muted-foreground">Receive class reminders and expiry alerts.</p>
                                        </div>
                                        <div className="h-6 w-11 rounded-full bg-primary relative cursor-pointer"><div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm"></div></div>
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
