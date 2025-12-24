"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Bell, CheckCircle2, AlertCircle, History, RefreshCcw, Smartphone, Mail, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, communicationsApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { BroadcastMessage, MessageChannel } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";

export default function CommunicationsPage() {
    const { toast } = useToast();
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
        <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
                {/* Abstract Background pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
                    <MessageSquare className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Communications
                        </h2>
                        <p className="text-indigo-100 mt-2 text-lg font-light">
                            Engage with your members via SMS, WhatsApp, and Email.
                        </p>
                    </div>
                    <Button
                        onClick={() => loadLogs()}
                        variant="outline"
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm shadow-xl"
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Refresh Logs
                    </Button>
                </div>
            </div>

            <div className="px-1 grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card className="border-0 shadow-lg bg-white h-fit overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                <Send className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Quick Announcement</CardTitle>
                                <CardDescription>Send a message to all active members.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Subject / Title</Label>
                            <Input
                                placeholder="e.g. Gym Closed Tomorrow"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10 shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Message Content</Label>
                            <Textarea
                                className="min-h-[150px] bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none shadow-sm"
                                placeholder="Type your message here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <p className="text-[10px] text-right text-gray-400 font-mono">{content.length} characters</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Channel</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <label className={`flex flex-col items-center justify-center gap-2 border rounded-xl px-2 py-4 cursor-pointer transition-all ${channel === 'sms' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600 shadow-sm' : 'hover:bg-slate-50 border-slate-200 text-gray-600'}`}>
                                    <input
                                        type="radio"
                                        name="channel"
                                        value="sms"
                                        checked={channel === "sms"}
                                        onChange={() => setChannel("sms")}
                                        className="sr-only"
                                    />
                                    <Smartphone className="h-5 w-5" />
                                    <span className="text-xs font-bold">SMS</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center gap-2 border rounded-xl px-2 py-4 cursor-pointer transition-all ${channel === 'whatsapp' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600 shadow-sm' : 'hover:bg-slate-50 border-slate-200 text-gray-600'}`}>
                                    <input
                                        type="radio"
                                        name="channel"
                                        value="whatsapp"
                                        checked={channel === "whatsapp"}
                                        onChange={() => setChannel("whatsapp")}
                                        className="sr-only"
                                    />
                                    <MessageSquare className="h-5 w-5" />
                                    <span className="text-xs font-bold">WhatsApp</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center gap-2 border rounded-xl px-2 py-4 cursor-pointer transition-all ${channel === 'email' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600 shadow-sm' : 'hover:bg-slate-50 border-slate-200 text-gray-600'}`}>
                                    <input
                                        type="radio"
                                        name="channel"
                                        value="email"
                                        checked={channel === "email"}
                                        onChange={() => setChannel("email")}
                                        className="sr-only"
                                    />
                                    <Mail className="h-5 w-5" />
                                    <span className="text-xs font-bold">Email</span>
                                </label>
                            </div>
                        </div>
                        <Button
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-11"
                            onClick={handleSend}
                            disabled={sending}
                        >
                            {sending ? "Sending Broadcast..." : "Send Announcement"} <Send className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-0 shadow-lg bg-white overflow-hidden flex flex-col h-[500px]">
                        <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                                    <History className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Recent Campaigns</CardTitle>
                                    <CardDescription>History of sent broadcasts.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 p-0 flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="py-12 text-center text-sm text-muted-foreground">Loading history...</div>
                            ) : logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-3 p-8">
                                    <div className="p-4 rounded-full bg-slate-50">
                                        <History className="h-8 w-8 opacity-20" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-600">No history</p>
                                        <p className="text-xs">No recent broadcasts found.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {logs.map((log, i) => (
                                        <div key={log.id || i} className="flex items-start justify-between p-4 hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 h-9 w-9 rounded-full flex items-center justify-center border shadow-sm ${log.channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        log.channel === 'email' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                    }`}>
                                                    {log.channel === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                                                    {log.channel === 'email' && <Mail className="h-4 w-4" />}
                                                    {log.channel === 'sms' && <Smartphone className="h-4 w-4" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-gray-900">{log.title}</p>
                                                    <p className="text-xs text-gray-500 line-clamp-2 max-w-[280px] leading-relaxed">{log.content}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium pt-1">
                                                        {new Date(log.sentAt || Date.now()).toLocaleDateString()} at {new Date(log.sentAt || Date.now()).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border ${log.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                                        }`}
                                                >
                                                    {log.status}
                                                </Badge>
                                                {log.recipientCount > 0 && (
                                                    <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> {log.recipientCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-white overflow-hidden">
                        <CardHeader className="py-3 bg-slate-50 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-gray-500" />
                                <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Automated Triggers</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50">
                                <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Welcome Message</span>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold uppercase">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Payment Receipt</span>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold uppercase">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Expiry Reminder (3 days)</span>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold uppercase">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                                        <span className="text-sm font-medium text-gray-400">Birthday Wish</span>
                                    </div>
                                    <Badge variant="outline" className="text-gray-400 bg-gray-50 border-gray-100 text-[9px] font-bold uppercase">Inactive</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
