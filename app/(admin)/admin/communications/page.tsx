"use client";

import { useEffect, useMemo, useState } from "react";
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
import { communicationsApi, ApiError } from "@/lib/api/client";
import type { BroadcastMessage, MessageChannel } from "@/lib/types";

export default function CommunicationsPage() {
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState("");
    const [broadcastContent, setBroadcastContent] = useState("");
    const [broadcastChannel, setBroadcastChannel] = useState<MessageChannel>("whatsapp");
    const [isSending, setIsSending] = useState(false);

    const [recentLogs, setRecentLogs] = useState<BroadcastMessage[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [logsError, setLogsError] = useState<string | null>(null);

    const [templateForm, setTemplateForm] = useState({
        name: "",
        channel: "WhatsApp",
        audience: "",
    });

    const toast = useToast();

    const characterCount = useMemo(() => broadcastContent.length, [broadcastContent]);

    const loadLogs = async () => {
        setLogsLoading(true);
        setLogsError(null);
        try {
            const res = await communicationsApi.list({ page: "1", pageSize: "5" });
            setRecentLogs(res.data || []);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to load communications";
            setLogsError(message);
            setRecentLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleSendBroadcast = async () => {
        if (!broadcastTitle.trim() || !broadcastContent.trim()) {
            toast({
                title: "Missing details",
                description: "Please enter a campaign name and message body.",
                variant: "warning",
            });
            return;
        }

        setIsSending(true);
        try {
            await communicationsApi.create({
                title: broadcastTitle.trim(),
                content: broadcastContent.trim(),
                channel: broadcastChannel,
                status: "sent",
                recipientCount: 0,
            });
            toast({ title: "Broadcast sent", variant: "success" });
            setBroadcastTitle("");
            setBroadcastContent("");
            setBroadcastChannel("whatsapp");
            await loadLogs();
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to send broadcast";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    const handleSaveTemplate = () => {
        toast({
            title: "Not available",
            description: "Message templates are not enabled yet because there is no backend API for templates.",
            variant: "info",
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
                        <div className="text-3xl font-bold mb-2">—</div>
                        <Progress value={0} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">Usage data not available</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">WhatsApp Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-2">—</div>
                        <Progress value={0} className="h-2 bg-green-100" indicatorClassName="bg-green-500" />
                        <p className="text-xs text-muted-foreground mt-2">Usage data not available</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Email Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-2">—</div>
                        <p className="text-xs text-muted-foreground mt-2">Usage data not available</p>
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
                            <Input
                                placeholder="e.g. Diwali Maintenance Update"
                                value={broadcastTitle}
                                onChange={(e) => setBroadcastTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message Body</label>
                            <Textarea
                                placeholder="Type your message here..."
                                className="min-h-[120px]"
                                value={broadcastContent}
                                onChange={(e) => setBroadcastContent(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground text-right">{characterCount}/160 characters</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Channel Priority</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setBroadcastChannel("whatsapp")}
                                    className={`flex items-center space-x-2 border p-3 rounded-lg w-full cursor-pointer hover:bg-gray-50 ${
                                        broadcastChannel === "whatsapp" ? "border-primary" : ""
                                    }`}
                                >
                                    <MessageSquare className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">WhatsApp</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBroadcastChannel("sms")}
                                    className={`flex items-center space-x-2 border p-3 rounded-lg w-full cursor-pointer hover:bg-gray-50 ${
                                        broadcastChannel === "sms" ? "border-primary" : ""
                                    }`}
                                >
                                    <Smartphone className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm">SMS</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBroadcastChannel("email")}
                                    className={`flex items-center space-x-2 border p-3 rounded-lg w-full cursor-pointer hover:bg-gray-50 ${
                                        broadcastChannel === "email" ? "border-primary" : ""
                                    }`}
                                >
                                    <Mail className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm">Email</span>
                                </button>
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <Button className="gap-2" onClick={handleSendBroadcast} disabled={isSending}>
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
                            {logsError && <p className="text-xs text-red-500">{logsError}</p>}
                            {logsLoading ? (
                                <p className="text-xs text-muted-foreground">Loading...</p>
                            ) : recentLogs.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No broadcasts yet.</p>
                            ) : (
                                recentLogs.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <History className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{log.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(log.sentAt ? new Date(log.sentAt).toLocaleString() : "—")} • {log.channel}
                                        </p>
                                    </div>
                                    <Badge variant={log.status === 'sent' ? 'success' : log.status === 'draft' ? 'outline' : 'destructive'} className="ml-auto text-[10px] px-1 py-0 h-5">
                                        {log.status}
                                    </Badge>
                                </div>
                                ))
                            )}
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
                            <Button size="sm" disabled>
                                Create Template
                            </Button>
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
                    <p className="text-xs text-muted-foreground">
                        No templates configured.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
