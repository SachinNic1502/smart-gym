"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Bell, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";

export default function CommunicationsPage() {
    const toast = useToast();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Communications</h2>
                    <p className="text-muted-foreground">Engage with your members via SMS, WhatsApp, and Email.</p>
                </div>
                <Button
                    type="button"
                    onClick={() =>
                        toast({
                            title: "Broadcast composer",
                            description: "Detailed broadcast flow is mock-only on this screen.",
                            variant: "info",
                        })
                    }
                >
                    <Send className="mr-2 h-4 w-4" />
                    New Broadcast
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Announcement</CardTitle>
                        <CardDescription>Send a message to all active members.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Subject / Title</Label>
                            <Input placeholder="e.g. Gym Closed Tomorrow" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Message Content</Label>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Type your message here..."
                            ></textarea>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="sms" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                                <Label htmlFor="sms">SMS</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="wa" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                                <Label htmlFor="wa">WhatsApp</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="email" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                <Label htmlFor="email">Email</Label>
                            </div>
                        </div>
                        <Button
                            className="w-full"
                            type="button"
                            onClick={() =>
                                toast({
                                    title: "Announcement sent",
                                    description:
                                        "Quick announcement sent to all active members (mock, no real delivery).",
                                    variant: "success",
                                })
                            }
                        >
                            Send Now
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Campaigns</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { title: "Diwali Offer", sent: "2 days ago", reach: 890, type: "Promo" },
                                    { title: "Maintenance Alert", sent: "5 days ago", reach: 450, type: "Alert" },
                                    { title: "New Yoga Class", sent: "1 week ago", reach: 1200, type: "News" },
                                ].map((c, i) => (
                                    <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                <MessageSquare className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{c.title}</p>
                                                <p className="text-xs text-muted-foreground">{c.sent}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{c.reach}</p>
                                            <Badge variant="outline" className="text-xs">{c.type}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>System Triggers</CardTitle>
                            <CardDescription>Automated messages sent by the system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Welcome Message</span>
                                    <Badge variant="success">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Payment Receipt</span>
                                    <Badge variant="success">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Expiry Reminder (3 days)</span>
                                    <Badge variant="success">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2"><Bell className="h-4 w-4 text-gray-400" /> Birthday Wish</span>
                                    <Badge variant="secondary">Inactive</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
