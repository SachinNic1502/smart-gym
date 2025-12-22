"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCcw, Wifi, Power } from "lucide-react";
import { ApiError, branchesApi, plansApi, devicesApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Branch, MembershipPlan, Device } from "@/lib/types";

export default function SettingsPage() {
    const toast = useToast();
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
        <div className="max-w-5xl space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Branch Settings</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Manage your gym configuration and preferences.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} className="w-full sm:w-auto">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <div className="overflow-x-auto no-scrollbar border-b mb-6">
                    <TabsList className="flex w-full min-w-max justify-start h-12 bg-transparent p-0 space-x-6">
                        <TabsTrigger
                            value="general"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-none text-sm"
                        >
                            General
                        </TabsTrigger>
                        <TabsTrigger
                            value="plans"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-none text-sm"
                        >
                            Membership Plans
                        </TabsTrigger>
                        <TabsTrigger
                            value="devices"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-none text-sm"
                        >
                            Devices
                        </TabsTrigger>
                        <TabsTrigger
                            value="notifications"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-muted-foreground data-[state=active]:text-foreground transition-none text-sm"
                        >
                            Notifications
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="general" className="space-y-6">
                    <Card className="shadow-sm border-border/60">
                        <CardHeader>
                            <CardTitle>Branch Details</CardTitle>
                            <CardDescription>Update your contact and location info.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Branch Name</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Address</Label>
                                    <Input
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input
                                        value={form.state}
                                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t">
                                <Button onClick={handleSaveBranch} disabled={saving} className="shadow-md shadow-primary/20">
                                    {saving ? "Saving..." : "Save Changes"} <Save className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="plans" className="space-y-6">
                    <Card className="shadow-sm border-border/60">
                        <CardHeader>
                            <CardTitle>Membership Plans</CardTitle>
                            <CardDescription>Available plans for this branch (configured by Super Admin).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {plans.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No plans available.</p>
                            ) : (
                                plans.map((plan) => (
                                    <div key={plan.id} className="flex items-center justify-between border rounded-lg p-4 hover:bg-zinc-50 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm">{plan.name}</p>
                                                <Badge variant="outline" className="text-[10px] bg-zinc-100">{plan.durationDays} days</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">₹{plan.price.toLocaleString()}</p>
                                        </div>
                                        <Badge variant={plan.isActive ? "success" : "secondary"} className="text-[10px] uppercase tracking-wide">
                                            {plan.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="devices" className="space-y-6">
                    <Card className="shadow-sm border-border/60">
                        <CardHeader>
                            <CardTitle>Devices</CardTitle>
                            <CardDescription>Connected hardware for access control.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {devices.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No devices connected.</p>
                            ) : (
                                devices.map((dev) => (
                                    <div key={dev.id} className="flex items-center justify-between border rounded-lg p-4 hover:bg-zinc-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${dev.status === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {dev.status === 'online' ? <Wifi className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{dev.name}</p>
                                                <p className="text-xs text-muted-foreground uppercase">{dev.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={dev.status === "online" ? "success" : "destructive"} className="text-[10px] uppercase tracking-wide">
                                                {dev.status}
                                            </Badge>
                                            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                                                {dev.ipAddress || "Cloud"}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card className="shadow-sm border-border/60">
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Toggle key alerts for this branch (local preferences).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between border rounded-lg p-4 hover:bg-zinc-50 transition-colors">
                                <div>
                                    <p className="font-medium text-sm">Membership expiry alerts</p>
                                    <p className="text-xs text-muted-foreground">Notify staff daily about upcoming expiries.</p>
                                </div>
                                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                            </div>
                            <div className="flex items-center justify-between border rounded-lg p-4 hover:bg-zinc-50 transition-colors">
                                <div>
                                    <p className="font-medium text-sm">Device offline alerts</p>
                                    <p className="text-xs text-muted-foreground">Send alert when any device is offline for 10+ minutes.</p>
                                </div>
                                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                            </div>
                            <div className="flex items-center justify-between border rounded-lg p-4 hover:bg-zinc-50 transition-colors">
                                <div>
                                    <p className="font-medium text-sm">Low SMS credits</p>
                                    <p className="text-xs text-muted-foreground">Warn when communications credits drop below threshold.</p>
                                </div>
                                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
