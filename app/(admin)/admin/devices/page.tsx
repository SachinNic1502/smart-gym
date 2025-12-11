"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCcw, Power, Wifi, Fingerprint, Plus, Pencil, Trash2 } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
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

export default function DevicesPage() {
    const toast = useToast();
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
        if (!confirm("Are you sure you want to delete this device? This action cannot be undone.")) return;

        try {
            await devicesApi.delete(id);
            toast({ title: "Device deleted", description: "Device removed successfully.", variant: "destructive" });
            await refetch();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to delete device";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    useEffect(() => {
        if (userBranchId && filters.branchId !== userBranchId) {
            updateFilters({ branchId: userBranchId });
        }
    }, [userBranchId, filters.branchId, updateFilters]);

    const onlineCount = stats?.online ?? 0;
    const offlineCount = stats?.offline ?? 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Device Fleet</h2>
                    <p className="text-muted-foreground">Monitor and manage biometric devices across all branches.</p>
                </div>
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}
                >
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90" onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Device
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? "Edit Device" : "Add New Device"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="device-name" className="text-right">
                                    Name
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="device-name"
                                        placeholder="e.g. Main Entrance A"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value });
                                            setFormErrors((prev) => ({ ...prev, name: undefined }));
                                        }}
                                    />
                                    {formErrors.name && (
                                        <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Type</Label>
                                <div className="col-span-3">
                                    <Select
                                        defaultValue={formData.type}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, type: value as DeviceType })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fingerprint">Fingerprint</SelectItem>
                                            <SelectItem value="qr_scanner">QR Scanner</SelectItem>
                                            <SelectItem value="face_recognition">Face Recognition</SelectItem>
                                            <SelectItem value="turnstile">Turnstile</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="model" className="text-right">
                                    Model
                                </Label>
                                <div className="col-span-3 space-y-2">
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, model: "eSSL K30" })}
                                        >
                                            eSSL K30
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, model: "eSSL X990" })}
                                        >
                                            eSSL X990
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, model: "eSSL F22" })}
                                        >
                                            eSSL F22
                                        </Button>
                                    </div>
                                    <Input
                                        id="model"
                                        placeholder="e.g. eSSL K30, X990, F22"
                                        value={formData.model}
                                        onChange={(e) =>
                                            setFormData({ ...formData, model: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Status</Label>
                                <div className="col-span-3">
                                    <Select
                                        defaultValue={formData.status}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, status: value as DeviceStatus })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="offline">Offline</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Connection</Label>
                                <div className="col-span-3">
                                    <Select
                                        defaultValue={formData.connectionType || "lan"}
                                        onValueChange={(value) => {
                                            setFormData({
                                                ...formData,
                                                connectionType: value as DeviceConnectionType,
                                            });
                                            setFormErrors((prev) => ({
                                                ...prev,
                                                ipAddress: undefined,
                                                cloudUrl: undefined,
                                            }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select connection" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lan">LAN (Local Network)</SelectItem>
                                            <SelectItem value="cloud">Cloud</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Branch</Label>
                                <div className="col-span-3">
                                    {isBranchAdmin ? (
                                        <div className="text-xs text-muted-foreground">
                                            {
                                                branches.find((b) => b.id === userBranchId)?.name ||
                                                userBranchId ||
                                                "Current branch"
                                            }
                                        </div>
                                    ) : (
                                        <Select
                                            defaultValue={formData.branchId}
                                            onValueChange={(value) => {
                                                setFormData({ ...formData, branchId: value });
                                                setFormErrors((prev) => ({ ...prev, branchId: undefined }));
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={branch.id}>
                                                        {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {formErrors.branchId && !isBranchAdmin && (
                                        <p className="mt-1 text-xs text-red-500">{formErrors.branchId}</p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="firmware" className="text-right">
                                    Firmware
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="firmware"
                                        placeholder="e.g. 2.1.0"
                                        value={formData.firmwareVersion}
                                        onChange={(e) =>
                                            setFormData({ ...formData, firmwareVersion: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            {formData.connectionType === "lan" || formData.connectionType === "" ? (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="ip" className="text-right">
                                        LAN IP Address
                                    </Label>
                                    <div className="col-span-3">
                                        <Input
                                            id="ip"
                                            placeholder="e.g. 192.168.1.101"
                                            value={formData.ipAddress}
                                            onChange={(e) => {
                                                setFormData({ ...formData, ipAddress: e.target.value });
                                                setFormErrors((prev) => ({ ...prev, ipAddress: undefined }));
                                            }}
                                        />
                                        {formErrors.ipAddress && (
                                            <p className="mt-1 text-xs text-red-500">{formErrors.ipAddress}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="cloudUrl" className="text-right">
                                        Cloud URL
                                    </Label>
                                    <div className="col-span-3">
                                        <Input
                                            id="cloudUrl"
                                            placeholder="e.g. https://device.vendor-cloud.com/api"
                                            value={formData.cloudUrl}
                                            onChange={(e) => {
                                                setFormData({ ...formData, cloudUrl: e.target.value });
                                                setFormErrors((prev) => ({ ...prev, cloudUrl: undefined }));
                                            }}
                                        />
                                        {formErrors.cloudUrl && (
                                            <p className="mt-1 text-xs text-red-500">{formErrors.cloudUrl}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleSubmit}>
                                {isEditMode ? "Update Device" : "Create Device"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Online</p>
                            <p className="text-2xl font-bold text-green-700">{onlineCount}</p>
                        </div>
                        <Wifi className="h-8 w-8 text-green-500 opacity-50" />
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600">Offline</p>
                            <p className="text-2xl font-bold text-red-700">{offlineCount}</p>
                        </div>
                        <Power className="h-8 w-8 text-red-500 opacity-50" />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <CardTitle>All Devices{stats ? ` (${stats.total})` : ""}</CardTitle>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {!isBranchAdmin && (
                                <div className="flex items-center gap-2">
                                    <span>Branch</span>
                                    <div className="w-40 md:w-48">
                                        <Select
                                            key={filters.branchId || "all"}
                                            defaultValue={filters.branchId || ""}
                                            onValueChange={(value) => {
                                                updateFilters({ branchId: value || undefined });
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All branches" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All branches</SelectItem>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={branch.id}>
                                                        {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <span>Status</span>
                                <div className="w-28">
                                    <Select
                                        key={filters.status || "all"}
                                        defaultValue={filters.status || ""}
                                        onValueChange={(value) => {
                                            updateFilters({ status: value || undefined });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="offline">Offline</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span>Type</span>
                                <div className="w-32">
                                    <Select
                                        key={filters.type || "all"}
                                        defaultValue={filters.type || ""}
                                        onValueChange={(value) => {
                                            updateFilters({ type: value || undefined });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All types</SelectItem>
                                            <SelectItem value="fingerprint">Fingerprint</SelectItem>
                                            <SelectItem value="qr_scanner">QR Scanner</SelectItem>
                                            <SelectItem value="face_recognition">Face</SelectItem>
                                            <SelectItem value="turnstile">Turnstile</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    updateFilters({
                                        branchId: isBranchAdmin ? userBranchId : undefined,
                                        status: undefined,
                                        type: undefined,
                                    });
                                }}
                            >
                                Clear
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => refetch()}
                            >
                                <RefreshCcw className="mr-1 h-3 w-3" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <p className="mb-2 text-xs text-red-500">{error}</p>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Device Name</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Last Sync</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                                        Loading devices...
                                    </TableCell>
                                </TableRow>
                            ) : devices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                                        No devices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                devices.map((device) => (
                                    <TableRow key={device.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`h-2.5 w-2.5 rounded-full ${
                                                        device.status === "online"
                                                            ? "bg-green-500 animate-pulse"
                                                            : device.status === "offline"
                                                            ? "bg-red-500"
                                                            : "bg-yellow-500"
                                                    }`}
                                                />
                                                <span className="text-xs font-medium">
                                                    {device.status === "online"
                                                        ? "Online"
                                                        : device.status === "offline"
                                                        ? "Offline"
                                                        : "Maintenance"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Fingerprint className="h-4 w-4 text-gray-400" />
                                                <Link href={`/admin/devices/${device.id}`} className="hover:underline">
                                                    {device.name}
                                                </Link>
                                            </div>
                                        </TableCell>
                                        <TableCell>{device.branchName}</TableCell>
                                        <TableCell>
                                            {device.lastPing ? new Date(device.lastPing).toLocaleString() : "—"}
                                        </TableCell>
                                        <TableCell>{device.model ?? device.firmwareVersion ?? device.type}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-blue-50 text-blue-600 h-8 w-8"
                                                    onClick={() => handleOpenEdit(device)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-red-50 text-red-600 h-8 w-8"
                                                    onClick={() => handleDelete(device.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                                    Sync
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
