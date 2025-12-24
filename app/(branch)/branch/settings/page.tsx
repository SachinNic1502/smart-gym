"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCcw, Wifi, Power, Settings as SettingsIcon, BellRing, Smartphone, Briefcase, Sparkles } from "lucide-react";
import { ApiError, branchesApi, plansApi, devicesApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Branch, MembershipPlan, Device } from "@/lib/types";

export default function SettingsPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const branchId = user?.branchId;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [branch, setBranch] = useState<Branch | null>(null);
    const [plans, setPlans] = useState<MembershipPlan[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);

    // Form State
    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        email: "",
    });

    const loadData = useCallback(async () => {
        if (!user) return;
        if (user.role === "branch_admin" && !branchId) {
            setError("Branch not assigned");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [branchRes, plansRes, devicesRes] = await Promise.all([
                branchesApi.get(branchId ?? ""),
                plansApi.getMembershipPlans(),
                devicesApi.list({ branchId: branchId ?? "", page: "1", pageSize: "50" }),
            ]);

            setBranch(branchRes);
            setForm({
                name: branchRes.name,
                phone: branchRes.phone,
                address: branchRes.address,
                city: branchRes.city,
                state: branchRes.state,
                email: branchRes.email,
            });
            setPlans(plansRes.data);
            setDevices(devicesRes.data ?? []);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to load settings";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [branchId, user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSaveBranch = async () => {
        if (!branch) return;
        setSaving(true);
        try {
            await branchesApi.update(branch.id, {
                name: form.name,
                phone: form.phone,
                address: form.address,
                city: form.city,
                state: form.state,
                email: form.email,
            });
            toast({ title: "Settings saved", description: "Branch details updated successfully.", variant: "success" });
            loadData();
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to save settings";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading settings...</div>;
    }

    if (error) {
        return (
            <div className="py-20 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={loadData}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
                {/* Abstract Background pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
                    <Sparkles className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <SettingsIcon className="w-8 h-8 opacity-80" />
                            Branch Settings
                        </h2>
                        <p className="text-slate-300 mt-2 text-lg font-light">
                            Manage your gym configuration and preferences.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadData} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm shadow-xl">
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            <div className="px-1">
                <Tabs defaultValue="general" className="w-full space-y-6">
                    <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm inline-flex">
                        <TabsList className="flex w-full justify-start h-10 bg-transparent p-0 space-x-2">
                            <TabsTrigger
                                value="general"
                                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-all"
                            >
                                <SettingsIcon className="w-4 h-4 mr-2" /> General
                            </TabsTrigger>
                            <TabsTrigger
                                value="plans"
                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-all"
                            >
                                <Briefcase className="w-4 h-4 mr-2" /> Membership Plans
                            </TabsTrigger>
                            <TabsTrigger
                                value="devices"
                                className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-all"
                            >
                                <Smartphone className="w-4 h-4 mr-2" /> Devices
                            </TabsTrigger>
                            <TabsTrigger
                                value="notifications"
                                className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-all"
                            >
                                <BellRing className="w-4 h-4 mr-2" /> Notifications
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="general" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="shadow-lg border-0 bg-white">
                            <CardHeader className="bg-slate-50/50 border-b border-gray-100 rounded-t-xl">
                                <CardTitle className="text-xl">Branch Details</CardTitle>
                                <CardDescription>Update your contact and location info.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500">Branch Name</Label>
                                        <Input
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="bg-gray-50 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500">Phone</Label>
                                        <Input
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            className="bg-gray-50 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500">Address</Label>
                                        <Input
                                            value={form.address}
                                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                                            className="bg-gray-50 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500">City</Label>
                                        <Input
                                            value={form.city}
                                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                                            className="bg-gray-50 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500">State</Label>
                                        <Input
                                            value={form.state}
                                            onChange={(e) => setForm({ ...form, state: e.target.value })}
                                            className="bg-gray-50 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500">Email</Label>
                                        <Input
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="bg-gray-50 focus:bg-white transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-6 border-t border-gray-100">
                                    <Button onClick={handleSaveBranch} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl transition-all hover:scale-105 active:scale-95">
                                        {saving ? "Saving..." : "Save Changes"} <Save className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="plans" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="shadow-lg border-0 bg-white">
                            <CardHeader className="bg-blue-50/30 border-b border-gray-100 rounded-t-xl">
                                <CardTitle className="text-xl text-blue-900">Membership Plans</CardTitle>
                                <CardDescription>Available plans for this branch (configured by Super Admin).</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                {plans.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 gap-3 border-2 border-dashed border-gray-100 rounded-xl">
                                        <Briefcase className="h-10 w-10 text-gray-200" />
                                        <p className="text-sm">No plans available.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {plans.map((plan) => (
                                            <div key={plan.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-5 hover:bg-blue-50/50 hover:border-blue-100 transition-all duration-300 group bg-white shadow-sm">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-800 text-base group-hover:text-blue-700 transition-colors">{plan.name}</p>
                                                        <Badge variant="outline" className="text-[10px] bg-white border-blue-100 text-blue-600 shadow-sm">{plan.durationDays} days</Badge>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-500 mt-1">₹{plan.price.toLocaleString()}</p>
                                                </div>
                                                <Badge
                                                    variant={plan.isActive ? "success" : "secondary"}
                                                    className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 ${plan.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    {plan.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="devices" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="shadow-lg border-0 bg-white">
                            <CardHeader className="bg-emerald-50/30 border-b border-gray-100 rounded-t-xl">
                                <CardTitle className="text-xl text-emerald-900">Devices</CardTitle>
                                <CardDescription>Connected hardware for access control.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                {devices.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 gap-3 border-2 border-dashed border-gray-100 rounded-xl">
                                        <Smartphone className="h-10 w-10 text-gray-200" />
                                        <p className="text-sm">No devices connected.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {devices.map((dev) => (
                                            <div key={dev.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-5 hover:bg-emerald-50/30 hover:border-emerald-100 transition-all duration-300 bg-white shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-full shadow-sm ${dev.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                        {dev.status === 'online' ? <Wifi className="h-5 w-5" /> : <Power className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">{dev.name}</p>
                                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">{dev.type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge
                                                        variant={dev.status === "online" ? "success" : "destructive"}
                                                        className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 ${dev.status === 'online' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                                                    >
                                                        {dev.status}
                                                    </Badge>
                                                    <p className="text-[10px] text-gray-400 mt-1 font-mono">
                                                        {dev.ipAddress || "Cloud"}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="shadow-lg border-0 bg-white">
                            <CardHeader className="bg-rose-50/30 border-b border-gray-100 rounded-t-xl">
                                <CardTitle className="text-xl text-rose-900">Notifications</CardTitle>
                                <CardDescription>Toggle key alerts for this branch (local preferences).</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                <div className="flex items-center justify-between border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-gray-800 text-sm">Membership expiry alerts</p>
                                        <p className="text-xs text-gray-500">Notify staff daily about upcoming expiries.</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" defaultChecked className="h-5 w-5 accent-rose-600 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-gray-800 text-sm">Device offline alerts</p>
                                        <p className="text-xs text-gray-500">Send alert when any device is offline for 10+ minutes.</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" defaultChecked className="h-5 w-5 accent-rose-600 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-gray-800 text-sm">Low SMS credits</p>
                                        <p className="text-xs text-gray-500">Warn when communications credits drop below threshold.</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" defaultChecked className="h-5 w-5 accent-rose-600 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
