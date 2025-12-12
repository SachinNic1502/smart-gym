"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Store, MapPin, User, Mail, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";
import { useBranches } from "@/hooks/use-branches";
import type { Branch } from "@/lib/types";
import { branchesApi, ApiError } from "@/lib/api/client";

export default function BranchesPage() {
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const { branches, loading, error, refetch } = useBranches();

    // Form State (matches Branch/createBranch schema)
    const [formData, setFormData] = useState<{
        id: string;
        name: string;
        address: string;
        city: string;
        state: string;
        phone: string;
        email: string;
    }>({
        id: "",
        name: "",
        address: "",
        city: "",
        state: "",
        phone: "",
        email: "",
    });

    const resetForm = () => {
        setFormData({ id: "", name: "", address: "", city: "", state: "", phone: "", email: "" });
        setIsEditMode(false);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (branch: Branch) => {
        setFormData({
            id: branch.id,
            name: branch.name,
            address: branch.address,
            city: branch.city,
            state: branch.state,
            phone: branch.phone,
            email: branch.email,
        });
        setIsEditMode(true);
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (isEditMode) {
                await branchesApi.update(formData.id, {
                    name: formData.name,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    phone: formData.phone,
                    email: formData.email,
                });
                toast({
                    title: "Branch updated",
                    description: "Branch updated successfully.",
                    variant: "success",
                });
            } else {
                await branchesApi.create({
                    name: formData.name,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    phone: formData.phone,
                    email: formData.email,
                    status: "active",
                });
                toast({
                    title: "Branch created",
                    description: "New branch created successfully.",
                    variant: "success",
                });
            }

            setIsDialogOpen(false);
            resetForm();
            await refetch();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to save branch";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this branch? This action cannot be undone.")) return;

        try {
            await branchesApi.delete(id);
            toast({
                title: "Branch deleted",
                description: "Branch removed successfully.",
                variant: "destructive",
            });
            await refetch();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to delete branch";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Branches</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your gym locations and their subscription status.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90" onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Branch
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? "Edit Branch" : "Add New Branch"}</DialogTitle>
                            <DialogDescription>
                                {isEditMode ? "Update branch details." : "Create a new gym location. We'll generate admin credentials automatically."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <div className="col-span-3 relative">
                                    <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="name"
                                        placeholder="e.g. FitStop West"
                                        className="pl-9"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="address" className="text-right">
                                    Address
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="address"
                                        placeholder="Street address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="city" className="text-right">
                                    City
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="city"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="state" className="text-right">
                                    State
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="state"
                                        placeholder="State"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">
                                    Phone
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="phone"
                                        placeholder="Contact phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="branch@gym.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleSubmit}>{isEditMode ? "Update Branch" : "Create Branch"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-sm border-t-4 border-t-primary/20">
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>All Branches</CardTitle>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search branches..."
                                className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="min-w-[820px]">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-gray-600">Branch Name</TableHead>
                                <TableHead className="font-semibold text-gray-600">Location</TableHead>
                                <TableHead className="font-semibold text-gray-600">Members</TableHead>
                                <TableHead className="font-semibold text-gray-600">Devices</TableHead>
                                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(loading ? [] : branches)
                                .filter((branch) =>
                                    !searchTerm.trim() ||
                                    branch.name.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((branch) => (
                                    <TableRow key={branch.id} className="cursor-pointer hover:bg-gray-50">
                                        <TableCell className="font-medium text-primary">
                                            <Link href={`/admin/branches/${branch.id}`} className="hover:underline">
                                                {branch.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-gray-500">
                                            {branch.city}, {branch.state}
                                        </TableCell>
                                        <TableCell className="font-medium">{branch.memberCount}</TableCell>
                                        <TableCell className="font-medium">{branch.deviceCount}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={branch.status === "active" ? "success" : "warning"}
                                                className="px-3 py-1"
                                            >
                                                {branch.status === "active" ? "Active" : branch.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-blue-50 text-blue-600 h-8 w-8"
                                                    onClick={() => handleOpenEdit(branch)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-red-50 text-red-600 h-8 w-8"
                                                    onClick={() => handleDelete(branch.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
