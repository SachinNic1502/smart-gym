"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, Smartphone, History, Send, Radio, Zap, LayoutTemplate, MessageCircle, MoreVertical, Search, CheckCircle2, AlertCircle, Clock, Plus } from "lucide-react";
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

    const { toast } = useToast();

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
            toast({ title: "Message sent", variant: "success" });
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
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 text-white p-10 rounded-[2.5rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-12 -translate-y-12">
                    <Radio className="w-80 h-80" />
                </div>
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <MessageCircle className="h-7 w-7 text-white" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">Communications</h2>
                        </div>
                        <p className="text-indigo-50 text-xl font-light max-w-2xl leading-relaxed">
                            Send announcements and manage message limits across all channels.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge className="bg-white/20 text-white border-0 px-4 py-2 rounded-xl backdrop-blur-md font-bold uppercase tracking-widest text-[10px]">
                            Connected
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Quota Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-0 shadow-xl bg-white group hover:shadow-2xl transition-all rounded-[1.5rem] overflow-hidden">
                    <CardHeader className="p-7 flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">SMS Status</p>
                            <CardTitle className="text-3xl font-black text-gray-800">SMS</CardTitle>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <Smartphone className="h-6 w-6" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-7 pb-7 space-y-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                            <span>STATUS</span>
                            <span>ACTIVE</span>
                        </div>
                        <Progress value={100} className="h-2.5 bg-indigo-50" indicatorClassName="bg-indigo-500" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight italic">Service online</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-xl bg-white group hover:shadow-2xl transition-all rounded-[1.5rem] overflow-hidden">
                    <CardHeader className="p-7 flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">WhatsApp Status</p>
                            <CardTitle className="text-3xl font-black text-gray-800">WhatsApp</CardTitle>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-7 pb-7 space-y-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                            <span>STATUS</span>
                            <span className="text-emerald-500">CONNECTED</span>
                        </div>
                        <Progress value={85} className="h-2.5 bg-emerald-50" indicatorClassName="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight italic">Service online</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-xl bg-white group hover:shadow-2xl transition-all rounded-[1.5rem] overflow-hidden">
                    <CardHeader className="p-7 flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Email Status</p>
                            <CardTitle className="text-3xl font-black text-gray-800">Email</CardTitle>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                            <Mail className="h-6 w-6" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-7 pb-7 space-y-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                            <span>DAILY LIMIT</span>
                            <span>100,000 / DAY</span>
                        </div>
                        <Progress value={45} className="h-2.5 bg-orange-50" indicatorClassName="bg-orange-500" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight italic">Service online</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Message Composer */}
                <Card className="md:col-span-2 border-0 shadow-2xl shadow-indigo-100 rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 p-8 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-900 rounded-2xl text-white">
                                <Send className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-gray-800">Send Message</CardTitle>
                                <CardDescription className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Send announcements to all members</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase text-gray-400 ml-1">Title</Label>
                                <Input
                                    placeholder="e.g. Maintenance Update"
                                    className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 font-bold"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase text-gray-400 ml-1">Platform</Label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'whatsapp', icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                        { id: 'sms', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50' },
                                        { id: 'email', icon: Mail, color: 'text-orange-500', bg: 'bg-orange-50' }
                                    ].map(ch => (
                                        <button
                                            key={ch.id}
                                            onClick={() => setBroadcastChannel(ch.id as any)}
                                            className={`flex-1 h-12 flex items-center justify-center rounded-2xl transition-all ${broadcastChannel === ch.id
                                                ? `${ch.bg} border-2 border-indigo-500 shadow-inner`
                                                : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                                                }`}
                                        >
                                            <ch.icon className={`h-5 w-5 ${ch.color}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-xs font-black uppercase text-gray-400">Message Content</Label>
                                <Badge className={`rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 ${characterCount > 160 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {characterCount} / 160 CHARS
                                </Badge>
                            </div>
                            <Textarea
                                placeholder="Type your message here..."
                                className="min-h-[160px] rounded-[1.5rem] bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 p-6 font-medium leading-relaxed"
                                value={broadcastContent}
                                onChange={(e) => setBroadcastContent(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <Zap className="h-4 w-4 text-amber-500" />
                                Send now
                            </div>
                            <Button
                                size="lg"
                                className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black px-10 shadow-lg shadow-indigo-100 gap-3"
                                onClick={handleSendBroadcast}
                                disabled={isSending}
                            >
                                <Send className="h-4 w-4" />
                                {isSending ? 'Sending...' : 'Send Message'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent History */}
                <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                <History className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-xl font-black text-gray-800">Sent Messages</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-50">
                            {logsError && <div className="p-8 text-center text-rose-500 font-bold">{logsError}</div>}
                            {logsLoading ? (
                                <div className="p-12 text-center animate-pulse">
                                    <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading history...</p>
                                </div>
                            ) : recentLogs.length === 0 ? (
                                <div className="p-16 text-center opacity-30 italic">No messages sent yet</div>
                            ) : (
                                recentLogs.map((log) => (
                                    <div key={log.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
                                        <div className="relative">
                                            <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm text-gray-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-800 transition-all">
                                                {log.channel === 'whatsapp' && <MessageSquare className="h-5 w-5" />}
                                                {log.channel === 'sms' && <Smartphone className="h-5 w-5" />}
                                                {log.channel === 'email' && <Mail className="h-5 w-5" />}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${log.status === 'sent' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-800 uppercase tracking-tight truncate">{log.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="h-3 w-3 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {log.sentAt ? new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className={`rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {log.status}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                        <Button variant="ghost" className="w-full py-4 rounded-none h-auto font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50" onClick={loadLogs}>
                            View All Logs
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Templates Registry */}
            <Card className="border-0 shadow-2xl shadow-slate-100 rounded-[2.5rem] overflow-hidden mx-1">
                <CardHeader className="p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-gray-100">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-slate-900 rounded-[2rem] text-white">
                            <LayoutTemplate className="h-8 w-8" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black text-gray-800 tracking-tight">Templates</CardTitle>
                            <CardDescription className="font-bold text-gray-400 uppercase tracking-widest text-xs mt-1">
                                Reusable messages for welcome hints, reminders, and offers.
                            </CardDescription>
                        </div>
                    </div>
                    <Button size="lg" className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-3" disabled>
                        <Plus className="h-5 w-5" />
                        Create Template
                    </Button>
                </CardHeader>
                <CardContent className="p-12 text-center flex flex-col items-center gap-6 bg-slate-50/30">
                    <div className="p-8 bg-white rounded-full shadow-inner opacity-40">
                        <AlertCircle className="h-16 w-16 text-slate-300" />
                    </div>
                    <div className="max-w-md space-y-2">
                        <p className="text-xl font-black text-slate-400 uppercase tracking-widest">No Templates Found</p>
                        <p className="font-bold text-slate-300 italic">Message templates are not yet available.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
