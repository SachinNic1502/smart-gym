"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, Smartphone, History, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";

const MOCK_TEMPLATES = [
    {
        id: "welcome",
        name: "Welcome New Member",
        channel: "WhatsApp",
        audience: "New sign-ups",
    },
    {
        id: "expiry",
        name: "Membership Expiry Reminder",
        channel: "SMS",
        audience: "Expiring in 3 days",
    },
    {
        id: "birthday",
        name: "Birthday Wishes",
        channel: "Email",
        audience: "Members with birthday today",
    },
];

export default function CommunicationsPage() {
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        name: "",
        channel: "WhatsApp",
        audience: "",
    });

    const toast = useToast();

    const handleSaveTemplate = () => {
        setIsTemplateDialogOpen(false);
        setTemplateForm({ name: "", channel: "WhatsApp", audience: "" });
        toast({
            title: "Template saved",
            description: "Template saved (mock). In a real system this would persist to your backend.",
            variant: "success",
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Communications Control</h2>
                    <p className="text-muted-foreground">Manage global message quotas, templates, and broadcasts.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total SMS Credits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-2">12,450 / 20,000</div>
                        <Progress value={65} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">65% used this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">WhatsApp Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-2">8,200 / 10,000</div>
                        <Progress value={82} className="h-2 bg-green-100" indicatorClassName="bg-green-500" />
                        <p className="text-xs text-muted-foreground mt-2">82% used this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Email Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-2">45,000</div>
                        <p className="text-xs text-muted-foreground mt-2">Unlimited Plan Active</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Global Broadcast</CardTitle>
                        <CardDescription>Send system-wide announcements to all branches.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Campaign Name</label>
                            <Input placeholder="e.g. Diwali Maintenance Update" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message Body</label>
                            <Textarea placeholder="Type your message here..." className="min-h-[120px]" />
                            <p className="text-xs text-muted-foreground text-right">0/160 characters</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Channel Priority</label>
                            <div className="flex gap-4">
                                <div className="flex items-center space-x-2 border p-3 rounded-lg w-full cursor-pointer hover:bg-gray-50">
                                    <MessageSquare className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">WhatsApp</span>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-lg w-full cursor-pointer hover:bg-gray-50">
                                    <Smartphone className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm">SMS</span>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-lg w-full cursor-pointer hover:bg-gray-50">
                                    <Mail className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm">Email</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <Button className="gap-2">
                                <Send className="h-4 w-4" /> Send Broadcast
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { title: "System Maintenance", time: "2 hours ago", status: "Sent", channel: "Email" },
                                { title: "New Feature Alert", time: "Yesterday", status: "Sent", channel: "WhatsApp" },
                                { title: "Server Downtime", time: "3 days ago", status: "Failed", channel: "SMS" },
                                { title: "Holiday Wish", time: "1 week ago", status: "Sent", channel: "WhatsApp" },
                            ].map((log, i) => (
                                <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <History className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{log.title}</p>
                                        <p className="text-xs text-muted-foreground">{log.time} • {log.channel}</p>
                                    </div>
                                    <Badge variant={log.status === 'Sent' ? 'success' : 'destructive'} className="ml-auto text-[10px] px-1 py-0 h-5">
                                        {log.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle>Message Templates</CardTitle>
                        <CardDescription>
                            Reusable content for common journeys like welcome, expiry reminders, and offers.
                        </CardDescription>
                    </div>
                    <Dialog
                        open={isTemplateDialogOpen}
                        onOpenChange={(open) => {
                            setIsTemplateDialogOpen(open);
                            if (!open) {
                                setTemplateForm({ name: "", channel: "WhatsApp", audience: "" });
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button size="sm">Create Template</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle>Create Message Template</DialogTitle>
                                <DialogDescription>
                                    Define reusable content that branches can trigger from their automations.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="tpl-name">Template name</Label>
                                    <Input
                                        id="tpl-name"
                                        placeholder="e.g. Trial Expiry Reminder"
                                        value={templateForm.name}
                                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tpl-channel">Channel</Label>
                                    <select
                                        id="tpl-channel"
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                        value={templateForm.channel}
                                        onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value })}
                                    >
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="SMS">SMS</option>
                                        <option value="Email">Email</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tpl-audience">Target audience</Label>
                                    <Input
                                        id="tpl-audience"
                                        placeholder="e.g. Members expiring in 7 days"
                                        value={templateForm.audience}
                                        onChange={(e) => setTemplateForm({ ...templateForm, audience: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tpl-body">Sample content</Label>
                                    <Textarea
                                        id="tpl-body"
                                        placeholder="Hi {{name}}, your membership expires on {{expiry_date}}..."
                                        className="min-h-[100px]"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Use merge tags like <code>{"{{name}}"}</code> and <code>{"{{expiry_date}}"}</code> to personalize messages.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => {
                                        setIsTemplateDialogOpen(false);
                                        setTemplateForm({ name: "", channel: "WhatsApp", audience: "" });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="button" onClick={handleSaveTemplate}>
                                    Save Template
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {MOCK_TEMPLATES.map((tpl) => (
                            <div
                                key={tpl.id}
                                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                                <div>
                                    <p className="font-medium">{tpl.name}</p>
                                    <p className="text-xs text-muted-foreground">{tpl.audience}</p>
                                </div>
                                <Badge variant="outline" className="text-[11px]">
                                    {tpl.channel}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
