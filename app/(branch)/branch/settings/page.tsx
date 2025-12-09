"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Check if Label component exists, if not create basic one or use html label
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast-provider";

export default function SettingsPage() {
    const toast = useToast();

    return (
        <div className="max-w-5xl space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Branch Settings</h2>
                <p className="text-muted-foreground">Manage your gym configuration.</p>
            </div>

            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="plans">Membership Plans</TabsTrigger>
                    <TabsTrigger value="devices">Devices</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Branch Details</CardTitle>
                            <CardDescription>Update your contact and location info.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Branch Name</label>
                                <Input defaultValue="FitStop Downtown" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone</label>
                                <Input defaultValue="+1 (555) 000-1234" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">Address</label>
                                <Input defaultValue="123 Main St, New York, NY" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Time zone</label>
                                <Input defaultValue="Asia/Kolkata" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Business hours</label>
                                <Input defaultValue="Mon - Sun, 6:00 AM - 10:00 PM" />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        toast({
                                            title: "Settings saved",
                                            description: "Branch settings saved locally (mock).",
                                            variant: "success",
                                        })
                                    }
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="plans" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Membership Plans</CardTitle>
                            <CardDescription>Map global plans to this branch and control visibility.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center justify-between border rounded-md px-3 py-2">
                                <div>
                                    <p className="font-medium">Gold Premium</p>
                                    <p className="text-xs text-muted-foreground">₹2,499 / month • Includes classes + biometrics</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">Visible</label>
                                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between border rounded-md px-3 py-2">
                                <div>
                                    <p className="font-medium">Silver Monthly</p>
                                    <p className="text-xs text-muted-foreground">₹1,499 / month • Limited access</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">Visible</label>
                                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between border rounded-md px-3 py-2">
                                <div>
                                    <p className="font-medium">Corporate / Custom</p>
                                    <p className="text-xs text-muted-foreground">Hidden from public – used for special deals.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">Visible</label>
                                    <input type="checkbox" className="h-4 w-4" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="devices" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Devices</CardTitle>
                            <CardDescription>Basic configuration for check-in devices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Main gate device name</label>
                                <Input defaultValue="Gate Reader #1" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fallback mode</label>
                                <Input defaultValue="Allow offline check-ins for 2 hours" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Toggle key alerts for this branch.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between border rounded-md px-3 py-2">
                                <div>
                                    <p className="font-medium">Membership expiry alerts</p>
                                    <p className="text-xs text-muted-foreground">Notify staff daily about upcoming expiries.</p>
                                </div>
                                <input type="checkbox" defaultChecked className="h-4 w-4" />
                            </div>
                            <div className="flex items-center justify-between border rounded-md px-3 py-2">
                                <div>
                                    <p className="font-medium">Device offline alerts</p>
                                    <p className="text-xs text-muted-foreground">Send alert when any device is offline for 10+ minutes.</p>
                                </div>
                                <input type="checkbox" defaultChecked className="h-4 w-4" />
                            </div>
                            <div className="flex items-center justify-between border rounded-md px-3 py-2">
                                <div>
                                    <p className="font-medium">Low SMS credits</p>
                                    <p className="text-xs text-muted-foreground">Warn when communications credits drop below threshold.</p>
                                </div>
                                <input type="checkbox" defaultChecked className="h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
