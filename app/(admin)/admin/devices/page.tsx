"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCcw, Power, Wifi, Fingerprint, Plus, Pencil, Trash2, Cpu, Activity, Signal, Globe, Zap, Network, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";
import { useDevices } from "@/hooks/use-devices";
import { useBranches } from "@/hooks/use-branches";
import { useAuth } from "@/hooks/use-auth";
import { devicesApi, ApiError } from "@/lib/api/client";
import type { Device, DeviceType, DeviceStatus, DeviceConnectionType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function DevicesPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const isBranchAdmin = user?.role === "branch_admin";
    const userBranchId = isBranchAdmin ? user.branchId : undefined;

    const { branches } = useBranches();
    const { devices, stats, loading, error, updateFilters, filters, refetch } = useDevices();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<{
        id: string;
        name: string;
        type: DeviceType | "";
        status: DeviceStatus | "";
        branchId: string;
        firmwareVersion: string;
        model: string;
        connectionType: DeviceConnectionType | "";
        ipAddress: string;
        cloudUrl: string;
    }>({
        id: "",
        name: "",
        type: "fingerprint",
        status: "online",
        branchId: userBranchId ?? "",
        firmwareVersion: "",
        model: "",
        connectionType: "lan",
        ipAddress: "",
        cloudUrl: "",
    });

    const [formErrors, setFormErrors] = useState<{
        name?: string;
        branchId?: string;
        connectionType?: string;
        ipAddress?: string;
        cloudUrl?: string;
    }>({});

    const resetForm = () => {
        setFormData({
            id: "",
            name: "",
            type: "fingerprint",
            status: "online",
            branchId: userBranchId ?? "",
            firmwareVersion: "",
            model: "",
            connectionType: "lan",
            ipAddress: "",
            cloudUrl: "",
        });
        setIsEditMode(false);
        setFormErrors({});
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (device: Device) => {
        setFormData({
            id: device.id,
            name: device.name,
            type: device.type,
            status: device.status,
            branchId: device.branchId,
            firmwareVersion: device.firmwareVersion || "",
            model: device.model || "",
            connectionType: device.connectionType || "lan",
            ipAddress: device.ipAddress || "",
            cloudUrl: device.cloudUrl || "",
        });
        setFormErrors({});
        setIsEditMode(true);
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        const branchId = formData.branchId || userBranchId;
        const connectionType: DeviceConnectionType =
            (formData.connectionType as DeviceConnectionType) || "lan";

        const newErrors: typeof formErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Device name is required";
        }

        if (!branchId) {
            newErrors.branchId = "Branch is required";
        }

        if (connectionType === "lan" && !formData.ipAddress.trim()) {
            newErrors.ipAddress = "IP address is required for LAN devices";
        }

        if (connectionType === "cloud" && !formData.cloudUrl.trim()) {
            newErrors.cloudUrl = "Cloud URL is required for Cloud devices";
        }

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            toast({ title: "Please fix the highlighted errors", variant: "destructive" });
            return;
        }

        try {
            const payloadBase = {
                name: formData.name.trim(),
                type: formData.type || "fingerprint",
                status: formData.status || "online",
                branchId,
                firmwareVersion: formData.firmwareVersion || undefined,
                model: formData.model || undefined,
                connectionType,
                ipAddress:
                    connectionType === "lan" ? formData.ipAddress.trim() || undefined : undefined,
                cloudUrl:
                    connectionType === "cloud" ? formData.cloudUrl.trim() || undefined : undefined,
            };

            if (isEditMode) {
                await devicesApi.update(formData.id, payloadBase);
                toast({ title: "Device updated", description: "Device updated successfully.", variant: "success" });
            } else {
                await devicesApi.create(payloadBase);
                toast({ title: "Device created", description: "New device created successfully.", variant: "success" });
            }

            setIsDialogOpen(false);
            resetForm();
            await refetch();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to save device";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        toast({
            title: "Confirm Deletion",
            description: "Are you sure you want to delete this device? This action cannot be undone.",
            variant: "warning",
            duration: Infinity,
            action: ({ dismiss }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs font-semibold hover:bg-amber-100 text-amber-900"
                        onClick={dismiss}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        onClick={async () => {
                            dismiss();
                            try {
                                await devicesApi.delete(id);
                                toast({ title: "Device deleted", description: "The device has been removed successfully.", variant: "success" });
                                await refetch();
                            } catch (error) {
                                const message = error instanceof ApiError ? error.message : "Failed to delete device";
                                toast({ title: "Error", description: message, variant: "destructive" });
                            }
                        }}
                    >
                        Confirm Delete
                    </Button>
                </div>
            )
        });
    };

    useEffect(() => {
        if (userBranchId && filters.branchId !== userBranchId) {
            updateFilters({ branchId: userBranchId });
        }
    }, [userBranchId, filters.branchId, updateFilters]);

    const onlineCount = stats?.online ?? 0;
    const offlineCount = stats?.offline ?? 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white p-8 rounded-[2rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-12 -translate-y-12">
                    <Cpu className="w-64 h-64" />
                </div>
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <Network className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">Devices</h2>
                        </div>
                        <p className="text-emerald-50 mt-1 text-lg font-light max-w-xl">
                            Manage and monitor all biometric hardware across your gym branches.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-xl transition-all hover:scale-105 px-6 font-bold"
                            onClick={() => refetch()}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Dialog
                            open={isDialogOpen}
                            onOpenChange={(open) => {
                                setIsDialogOpen(open);
                                if (!open) resetForm();
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button className="bg-white text-teal-700 hover:bg-teal-50 font-bold px-6 py-6 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95" onClick={handleOpenCreate}>
                                    <Plus className="mr-2 h-5 w-5" />
                                    Add Device
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[480px] rounded-[2rem]">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">{isEditMode ? "Edit Device" : "Add New Device"}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="device-name" className="text-sm font-semibold ml-1">Device Name</Label>
                                        <Input
                                            id="device-name"
                                            placeholder="e.g. Main Entrance A"
                                            className="h-11 rounded-xl"
                                            value={formData.name}
                                            onChange={(e) => {
                                                setFormData({ ...formData, name: e.target.value });
                                                setFormErrors((prev) => ({ ...prev, name: undefined }));
                                            }}
                                        />
                                        {formErrors.name && (
                                            <p className="mt-1 text-xs text-red-500 font-medium ml-1">{formErrors.name}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold ml-1">Type</Label>
                                            <select
                                                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value as DeviceType })}
                                            >
                                                <option value="fingerprint">Fingerprint</option>
                                                <option value="qr_scanner">QR Scanner</option>
                                                <option value="face_recognition">Face Recognition</option>
                                                <option value="turnstile">Turnstile</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold ml-1">Status</Label>
                                            <select
                                                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as DeviceStatus })}
                                            >
                                                <option value="online">Online</option>
                                                <option value="offline">Offline</option>
                                                <option value="maintenance">Maintenance</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold ml-1">Device Model</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {["eSSL K30", "eSSL X990", "eSSL F22"].map(m => (
                                                <Badge
                                                    key={m}
                                                    variant="secondary"
                                                    className="cursor-pointer hover:bg-teal-100 transition-colors py-1 px-3 rounded-lg border-0"
                                                    onClick={() => setFormData({ ...formData, model: m })}
                                                >
                                                    {m}
                                                </Badge>
                                            ))}
                                        </div>
                                        <Input
                                            id="model"
                                            placeholder="Custom Model Name"
                                            className="h-11 rounded-xl"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold ml-1">Connection</Label>
                                            <select
                                                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                                                value={formData.connectionType || "lan"}
                                                onChange={(e) => {
                                                    const value = e.target.value as DeviceConnectionType;
                                                    setFormData({ ...formData, connectionType: value });
                                                    setFormErrors((prev) => ({ ...prev, ipAddress: undefined, cloudUrl: undefined }));
                                                }}
                                            >
                                                <option value="lan">Local (LAN)</option>
                                                <option value="cloud">Remote (Cloud)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold ml-1">Branch</Label>
                                            {isBranchAdmin ? (
                                                <div className="h-11 flex items-center px-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold text-gray-500 truncate">
                                                    {branches.find((b) => b.id === userBranchId)?.name || userBranchId}
                                                </div>
                                            ) : (
                                                <select
                                                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                                                    value={formData.branchId}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, branchId: e.target.value });
                                                        setFormErrors((prev) => ({ ...prev, branchId: undefined }));
                                                    }}
                                                >
                                                    <option value="" disabled>Select Branch</option>
                                                    {branches.map((branch) => (
                                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold ml-1">{formData.connectionType === "cloud" ? "Cloud URL" : "IP Address"}</Label>
                                        <Input
                                            placeholder={formData.connectionType === "cloud" ? "https://..." : "192.168.1.100"}
                                            className="h-11 rounded-xl"
                                            value={formData.connectionType === "cloud" ? formData.cloudUrl : formData.ipAddress}
                                            onChange={(e) => {
                                                if (formData.connectionType === "cloud") {
                                                    setFormData({ ...formData, cloudUrl: e.target.value });
                                                    setFormErrors((prev) => ({ ...prev, cloudUrl: undefined }));
                                                } else {
                                                    setFormData({ ...formData, ipAddress: e.target.value });
                                                    setFormErrors((prev) => ({ ...prev, ipAddress: undefined }));
                                                }
                                            }}
                                        />
                                        {(formErrors.ipAddress || formErrors.cloudUrl) && (
                                            <p className="mt-1 text-xs text-red-500 font-medium ml-1">{formErrors.ipAddress || formErrors.cloudUrl}</p>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button variant="ghost" className="h-11 rounded-xl" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="h-11 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold px-8 shadow-lg shadow-teal-100" onClick={handleSubmit}>
                                        {isEditMode ? "Save Changes" : "Add Device"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-4 px-1">
                <Card className="border-0 shadow-lg bg-white overflow-hidden group hover:shadow-xl transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Online</p>
                            <p className="text-4xl font-black text-gray-800 tracking-tighter">{onlineCount}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all text-emerald-500">
                            <Wifi className="h-8 w-8" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white overflow-hidden group hover:shadow-xl transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">Offline</p>
                            <p className="text-4xl font-black text-gray-800 tracking-tighter">{offlineCount}</p>
                        </div>
                        <div className="p-4 bg-rose-50 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-all text-rose-500">
                            <Power className="h-8 w-8" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white overflow-hidden group hover:shadow-xl transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">Total Devices</p>
                            <p className="text-4xl font-black text-gray-800 tracking-tighter">{stats?.total || 0}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all text-blue-500">
                            <Activity className="h-8 w-8" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white overflow-hidden group hover:shadow-xl transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Maintenance</p>
                            <p className="text-4xl font-black text-gray-800 tracking-tighter">{stats?.maintenance || 0}</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all text-amber-500">
                            <Zap className="h-8 w-8" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Device List */}
            <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden mx-1">
                <CardHeader className="bg-white border-b border-gray-100 pb-6 pt-8 px-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-900 rounded-2xl text-white">
                                <Signal className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-800">Device List</CardTitle>
                                <p className="text-sm text-gray-500 mt-1 font-medium">View status and connection info for all devices</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 px-3">
                                    <Filter className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Filter</span>
                                </div>
                                {!isBranchAdmin && (
                                    <select
                                        className="h-8 rounded-lg border-0 bg-white shadow-sm px-3 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-teal-500 min-w-[140px]"
                                        value={filters.branchId || ""}
                                        onChange={(e) => updateFilters({ branchId: e.target.value || undefined })}
                                    >
                                        <option value="">All Branches</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                )}
                                <select
                                    className="h-8 rounded-lg border-0 bg-white shadow-sm px-3 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-teal-500 mhw-min-[90px]"
                                    value={filters.status || ""}
                                    onChange={(e) => updateFilters({ status: e.target.value || undefined })}
                                >
                                    <option value="">All Status</option>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                                <select
                                    className="h-8 rounded-lg border-0 bg-white shadow-sm px-3 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-teal-500 min-w-[110px]"
                                    value={filters.type || ""}
                                    onChange={(e) => updateFilters({ type: e.target.value || undefined })}
                                >
                                    <option value="">All Types</option>
                                    <option value="fingerprint">Fingerprint</option>
                                    <option value="qr_scanner">QR Scanner</option>
                                    <option value="face_recognition">Face Recognition</option>
                                    <option value="turnstile">Turnstile</option>
                                </select>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-lg px-3 text-[11px] font-bold text-teal-600 hover:bg-teal-50"
                                    onClick={() => updateFilters({
                                        branchId: isBranchAdmin ? userBranchId : undefined,
                                        status: undefined,
                                        type: undefined,
                                    })}
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {error && (
                        <div className="p-4 mx-8 mt-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableHead className="font-bold text-gray-600 px-8 py-4 uppercase text-[11px] tracking-wider">Status</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Device Info</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Branch</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider font-semibold">Last Ping</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Connection</TableHead>
                                    <TableHead className="text-right font-bold text-gray-600 px-8 py-4 uppercase text-[11px] tracking-wider">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading devices...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : devices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <Cpu className="h-16 w-16" />
                                                <p className="font-black text-gray-500 uppercase tracking-widest text-lg">No devices found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    devices.map((device, index) => (
                                        <TableRow key={device.id} className="group hover:bg-teal-50/30 transition-all border-b border-gray-50">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`h-3 w-3 rounded-full flex-shrink-0 shadow-sm ${device.status === "online"
                                                            ? "bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20"
                                                            : device.status === "offline"
                                                                ? "bg-rose-500 ring-4 ring-rose-500/20"
                                                                : "bg-amber-500 ring-4 ring-amber-500/20"
                                                            }`}
                                                    />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                                                        {device.status}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${index % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                                                        <Fingerprint className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <Link href={`/admin/devices/${device.id}`} className="font-black text-gray-900 group-hover:text-teal-600 transition-colors uppercase text-xs tracking-tight">
                                                            {device.name}
                                                        </Link>
                                                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{device.model || 'Universal'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white font-black text-[10px] text-gray-500 uppercase tracking-tighter border-gray-200 py-1">
                                                    {device.branchName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">{device.lastPing ? new Date(device.lastPing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "—"}</span>
                                                    <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter mt-0.5">Last Check-in</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md ${device.connectionType === 'cloud' ? 'bg-sky-500' : 'bg-slate-700'}`}>
                                                    {device.connectionType || 'LAN'}
                                                </Badge>
                                                <p className="text-[10px] font-mono text-gray-400 mt-1 font-medium italic">{device.ipAddress || (device.cloudUrl ? 'Remote Link' : 'None')}</p>
                                            </TableCell>
                                            <TableCell className="px-8 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-2xl bg-white border border-gray-100 shadow-sm text-teal-600 hover:bg-teal-50"
                                                        onClick={() => handleOpenEdit(device)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-2xl bg-white border border-gray-100 shadow-sm text-rose-600 hover:bg-rose-50"
                                                        onClick={() => handleDelete(device.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 rounded-2xl bg-slate-900 border-0 text-white hover:bg-black font-bold text-[10px] px-4 uppercase tracking-widest hidden sm:flex"
                                                    >
                                                        <RefreshCcw className="h-3 w-3 mr-2" />
                                                        Sync
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
