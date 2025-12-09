"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Globe, Lock, Bell, Palette } from "lucide-react";

export default function AdminSettingsPage() {
    return (
        <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
                <p className="text-muted-foreground">Global configuration for your SaaS.</p>
            </div>

            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="api">API</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Identity</CardTitle>
                            <CardDescription>Basic details about your SaaS application.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>SaaS Name</Label>
                                <Input defaultValue="SmartFit Management" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Support Email</Label>
                                <Input defaultValue="support@smartfit.com" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Default Currency</Label>
                                <Input defaultValue="INR (₹)" disabled />
                            </div>
                            <Button className="mt-4">Save Changes</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="branding" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Look & Feel</CardTitle>
                            <CardDescription>Customize the appearance for your tenants.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold">SF</div>
                                <Button variant="outline">Upload Logo</Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex gap-2">
                                        <div className="h-10 w-10 rounded-md bg-[#3A86FF] border border-gray-200"></div>
                                        <Input defaultValue="#3A86FF" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Secondary Color</Label>
                                    <div className="flex gap-2">
                                        <div className="h-10 w-10 rounded-md bg-[#0A2540] border border-gray-200"></div>
                                        <Input defaultValue="#0A2540" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Policies</CardTitle>
                            <CardDescription>Define global security rules for all admins and staff logins.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Minimum Password Length</Label>
                                <Input defaultValue="8" type="number" min={6} max={32} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Session Timeout (minutes)</Label>
                                <Input defaultValue="30" type="number" min={5} max={240} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Allowed Login IP Range (optional)</Label>
                                <Input placeholder="e.g. 0.0.0.0/0 or 10.0.0.0/24" />
                            </div>
                            <Button className="mt-4">Save Security Settings</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>API & Webhooks</CardTitle>
                            <CardDescription>Manage API keys for integrations and webhook callbacks.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Public API Base URL</Label>
                                <Input value="https://api.smartfit.saashost.com" disabled />
                            </div>
                            <div className="grid gap-2">
                                <Label>Admin API Key</Label>
                                <div className="flex gap-2">
                                    <Input type="password" value="••••••••••••" disabled className="flex-1" />
                                    <Button variant="outline">Regenerate</Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Webhook URL</Label>
                                <Input placeholder="https://your-server.com/webhooks/smartfit" />
                            </div>
                            <Button className="mt-4">Save API Settings</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
