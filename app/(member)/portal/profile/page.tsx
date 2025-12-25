"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { meApi, ApiError, staffApi } from "@/lib/api/client";
import { User, Mail, Phone, MapPin, Calendar, Shield, CreditCard, Bell, Lock, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import type { Member } from "@/lib/types";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Partial<Member>>({});
    const [trainerName, setTrainerName] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const data = await meApi.getProfile();
                setProfile(data);

                if (data.trainerId && data.branchId) {
                    const staff = await staffApi.list({ branchId: data.branchId, role: 'trainer', page: "1", pageSize: "100" });
                    const trainer = staff.data.find(s => s.id === data.trainerId);
                    if (trainer) setTrainerName(trainer.name);
                }

            } catch (err) {
                console.error("Failed to load profile:", err);
                toast({
                    title: "Sync Error",
                    description: "We couldn't retrieve your latest profile data.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchProfile();
        }
    }, [user, toast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await meApi.updateProfile({
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                dateOfBirth: profile.dateOfBirth,
                address: profile.address,
            });
            setProfile(updated);
            toast({
                title: "Changes Saved",
                description: "Your digital profile has been updated.",
                variant: "success"
            });
        } catch (err) {
            console.error("Failed to update profile:", err);
            const message = err instanceof ApiError ? err.message : "Failed to update profile";
            toast({
                title: "Protocol Error",
                description: message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex items-center gap-6">
                    <Skeleton className="h-24 w-24 rounded-3xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Skeleton className="h-64 rounded-3xl" />
                    <Skeleton className="h-[400px] md:col-span-2 rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Premium Profile Header */}
            <div className="relative overflow-hidden rounded-[40px] bg-slate-900 text-white shadow-2xl p-8 md:p-12">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-left">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[36px] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <Avatar className="h-32 w-32 rounded-[32px] border-4 border-slate-800 shadow-2xl relative">
                            <AvatarImage src={profile.image || user.avatar} className="object-cover" />
                            <AvatarFallback className="text-4xl bg-slate-800 text-slate-400 font-black">
                                {profile.name?.charAt(0) || user.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-emerald-500 border-4 border-slate-900 rounded-2xl flex items-center justify-center">
                            <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <Badge className="bg-blue-500/20 text-blue-400 font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full border-0 uppercase">
                                Verified Athlete
                            </Badge>
                            <Badge className="bg-slate-800 text-slate-400 font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full border-0 uppercase">
                                Member ID: #{profile.id?.slice(-6) || "N/A"}
                            </Badge>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            {profile.name || user.name}
                        </h1>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] flex items-center justify-center md:justify-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-500" /> {profile.branchId || "Global Access"}
                        </p>
                    </div>

                    <div className="flex-1 md:text-right">
                        <Button
                            variant="ghost"
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl p-4 font-black text-xs tracking-widest uppercase gap-3"
                            onClick={() => logout()}
                        >
                            <LogOut className="w-4 h-4" /> Final Logout
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Information Strategy Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-0 shadow-xl rounded-[40px] overflow-hidden bg-white">
                        <CardHeader className="p-8 pb-0">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Quick Stats</h3>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:rotate-6 transition-all">
                                    <Calendar className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Since</p>
                                    <p className="text-sm font-black text-slate-700">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-amber-50 group-hover:rotate-6 transition-all">
                                    <Shield className="w-5 h-5 text-slate-400 group-hover:text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Membership Status</p>
                                    <p className="text-sm font-black text-emerald-500 uppercase">{profile.status || "ACTIVE"}</p>
                                </div>
                            </div>
                            {profile.trainerId && (
                                <div className="flex items-center gap-4 group">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:rotate-6 transition-all">
                                        <User className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Master Trainer</p>
                                        <p className="text-sm font-black text-slate-700">{trainerName || "Syncing..."}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl rounded-[40px] overflow-hidden bg-slate-900 text-white p-8 space-y-6">
                        <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-blue-400" />
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Security Protocol</h4>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed italic">
                            "Protect your digital identity. We recommend bi-weekly password rotation for maximum account security."
                        </p>
                        <Button className="w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-blue-500 hover:text-white font-black text-xs tracking-widest uppercase">
                            Reset Access Key
                        </Button>
                    </Card>
                </div>

                {/* Content Matrix */}
                <div className="lg:col-span-8 space-y-10">
                    <Card className="border-0 shadow-2xl rounded-[40px] overflow-hidden bg-white">
                        <CardHeader className="p-10 pb-0">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                                    <div className="h-2 w-8 bg-blue-600 rounded-full"></div>
                                    Identity Matrix
                                </h3>
                                <User className="w-6 h-6 text-slate-200" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Name</Label>
                                    <div className="group relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            value={profile.name || ""}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                                            placeholder="Your name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporal Origin (DOB)</Label>
                                    <div className="group relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            type="date"
                                            value={profile.dateOfBirth || ""}
                                            onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Endpoint (Email)</Label>
                                    <div className="group relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            value={profile.email || ""}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                                            placeholder="athlete@gym.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct Contact (Phone)</Label>
                                    <div className="group relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            value={profile.phone || ""}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                                            placeholder="+91 XXXXX XXXXX"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Coordinates (Address)</Label>
                                    <div className="group relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            value={profile.address || ""}
                                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 font-bold transition-all"
                                            placeholder="Base coordinates"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-16 w-full rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black text-sm tracking-widest uppercase shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {saving ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Updating Matrix...
                                        </>
                                    ) : (
                                        <>
                                            Authorize Profile Updates
                                            <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl rounded-[40px] overflow-hidden bg-white">
                        <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                                <div className="h-2 w-8 bg-amber-500 rounded-full"></div>
                                System Preferences
                            </h3>
                            <Bell className="w-6 h-6 text-slate-200" />
                        </CardHeader>
                        <CardContent className="p-10 space-y-6">
                            {[
                                { label: "Pulse Notifications", desc: "Real-time updates on classes & events", icon: Bell },
                                { label: "SMS Protocol", desc: "Automated direct-line reminders", icon: Phone },
                                { label: "Identity Visibility", desc: "Allow discovery in member community", icon: User }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 group hover:bg-slate-100/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                            <item.icon className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{item.label}</Label>
                                            <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                    <Switch className="data-[state=checked]:bg-blue-500" defaultChecked={i < 2} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
