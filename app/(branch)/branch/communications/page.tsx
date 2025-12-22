"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Bell, CheckCircle2, AlertCircle, History, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, communicationsApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { BroadcastMessage, MessageChannel } from "@/lib/types";

export default function CommunicationsPage() {
    const toast = useToast();
    const { user } = useAuth();
    const branchId = user?.branchId;

    const [logs, setLogs] = useState<BroadcastMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [channel, setChannel] = useState<MessageChannel>("sms");
    const [sending, setSending] = useState(false);

    const loadLogs = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            const res = await communicationsApi.list({ page: "1", pageSize: "10" });
            setLogs(res.data ?? []);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to load logs";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const handleSend = async () => {
        if (!title.trim() || !content.trim()) {
            toast({
                title: "Missing details",
                description: "Please enter a subject and message content.",
                variant: "warning"
            });
            return;
        }

        setSending(true);
        try {
            await communicationsApi.create({
                title,
                content,
                channel,
                recipientCount: 0, // Backend would calculate based on target
                status: "sent"
            });

            toast({ title: "Broadcast sent", variant: "success" });
            setTitle("");
            setContent("");
            loadLogs();
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to send message";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Communications</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Engage with your members via SMS, WhatsApp, and Email.
                    </p>
                </div>
                <Button onClick={() => loadLogs()} variant="outline" size="sm" className="self-start sm:self-auto">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh Logs
                </Button>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card className="border-border/60 shadow-sm h-fit">
                    <CardHeader className="bg-zinc-50/50 border-b pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                <Send className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Quick Announcement</CardTitle>
                                <CardDescription className="text-xs">Send a message to all active members.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject / Title</Label>
                            <Input
                                placeholder="e.g. Gym Closed Tomorrow"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-zinc-50/50 focus:bg-white transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message Content</Label>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-zinc-50/50 focus:bg-white transition-colors px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Type your message here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            ></textarea>
                            <p className="text-xs text-muted-foreground text-right">{content.length} characters</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel</Label>
                            <div className="flex flex-wrap gap-3">
                                <label className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 border rounded-md px-3 py-2.5 cursor-pointer transition-all ${channel === 'sms' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' : 'hover:bg-zinc-50 border-border/60'}`}>
                                    <input
                                        type="radio"
                                        name="channel"
                                        value="sms"
                                        checked={channel === "sms"}
                                        onChange={() => setChannel("sms")}
                                        className="sr-only"
                                    />
                                    <span className="text-sm font-bold tracking-tight">SMS</span>
                                </label>
                                <label className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 border rounded-md px-3 py-2.5 cursor-pointer transition-all ${channel === 'whatsapp' ? 'border-green-600 bg-green-50 text-green-700 ring-1 ring-green-600' : 'hover:bg-zinc-50 border-border/60'}`}>
                                    <input
                                        type="radio"
                                        name="channel"
                                        value="whatsapp"
                                        checked={channel === "whatsapp"}
                                        onChange={() => setChannel("whatsapp")}
                                        className="sr-only"
                                    />
                                    <span className="text-sm font-bold tracking-tight">WhatsApp</span>
                                </label>
                                <label className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 border rounded-md px-3 py-2.5 cursor-pointer transition-all ${channel === 'email' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' : 'hover:bg-zinc-50 border-border/60'}`}>
                                    <input
                                        type="radio"
                                        name="channel"
                                        value="email"
                                        checked={channel === "email"}
                                        onChange={() => setChannel("email")}
                                        className="sr-only"
                                    />
                                    <span className="text-sm font-bold tracking-tight">Email</span>
                                </label>
                            </div>
                        </div>
                        <Button
                            className="w-full shadow-md shadow-primary/20"
                            onClick={handleSend}
                            disabled={sending}
                        >
                            {sending ? "Sending..." : "Send Now"} <Send className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-border/60 shadow-sm h-full flex flex-col">
                        <CardHeader className="bg-zinc-50/50 border-b pb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-full bg-zinc-100 text-zinc-600">
                                    <History className="h-4 w-4" />
                                </div>
                                <CardTitle className="text-lg">Recent Campaigns</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 flex-1">
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground">Loading history...</div>
                                ) : logs.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
                                        <MessageSquare className="h-8 w-8 opacity-20" />
                                        <p className="text-xs">No recent broadcasts found.</p>
                                    </div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={log.id || i} className="flex items-start justify-between pb-4 border-b last:border-0 last:pb-0 group">
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border ${log.channel === 'whatsapp' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    log.channel === 'email' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-zinc-100 text-zinc-600 border-zinc-200'
                                                    }`}>
                                                    {log.channel.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{log.title}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{log.content}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                        {new Date(log.sentAt || Date.now()).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <Badge variant={log.status === 'sent' ? 'success' : 'outline'} className="text-[10px] h-5 uppercase tracking-wide">
                                                    {log.status}
                                                </Badge>
                                                {log.recipientCount > 0 && (
                                                    <span className="text-[10px] text-muted-foreground">{log.recipientCount} recipients</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">System Triggers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm p-2 rounded hover:bg-zinc-50 transition-colors">
                                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Welcome Message</span>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm p-2 rounded hover:bg-zinc-50 transition-colors">
                                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Payment Receipt</span>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm p-2 rounded hover:bg-zinc-50 transition-colors">
                                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Expiry Reminder (3 days)</span>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm p-2 rounded hover:bg-zinc-50 transition-colors">
                                    <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-zinc-400" /> Birthday Wish</span>
                                    <Badge variant="outline" className="text-zinc-500 text-[10px]">Inactive</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
