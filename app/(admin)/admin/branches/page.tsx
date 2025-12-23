"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Store, MapPin, User, Mail, Pencil, Trash2, Building2, Globe, Phone, MapPinned, Sparkles } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BranchesPage() {
    const router = useRouter();
    const { toast } = useToast();
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

    const handleOpenEdit = (branch: Branch, e: React.MouseEvent) => {
        e.stopPropagation();
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
                    description: "Branch details have been updated successfully.",
                    variant: "success",
                });
            } else {
                const response = await branchesApi.create({
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
                    description: response.message || "New branch has been created successfully.",
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

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toast({
            title: "Delete Branch?",
            description: "Are you sure? This will remove the branch and all associated data.",
            variant: "warning",
            duration: Infinity,
            action: ({ dismiss }) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-amber-100 text-amber-900" onClick={dismiss}>Cancel</Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={async () => {
                            dismiss();
                            try {
                                await branchesApi.delete(id);
                                toast({
                                    title: "Branch deleted",
                                    description: "Branch has been removed successfully.",
                                    variant: "success",
                                });
                                await refetch();
                            } catch (error) {
                                const message = error instanceof ApiError ? error.message : "Failed to delete branch";
                                toast({ title: "Error", description: message, variant: "destructive" });
                            }
                        }}
                    >
                        Confirm
                    </Button>
                </div>
            )
        });
    };

    const handleRowClick = (branchId: string) => {
        router.push(`/admin/branches/${branchId}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white p-8 rounded-[2rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-12 -translate-y-12">
                    <Building2 className="w-64 h-64" />
                </div>
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <Store className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">Branches</h2>
                        </div>
                        <p className="text-blue-100 mt-1 text-lg font-light max-w-xl">
                            Add and manage all gym branches, their admins, and status across your network.
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-6 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
                                onClick={handleOpenCreate}
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Add New Branch
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">{isEditMode ? "Edit Branch" : "Add New Branch"}</DialogTitle>
                                <DialogDescription className="text-gray-500">
                                    {isEditMode ? "Update branch details." : "Create a new gym location. Admin credentials will be generated automatically using the email."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 ml-1">Branch Name</Label>
                                    <div className="relative group">
                                        <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            id="name"
                                            placeholder="e.g. FitStop West"
                                            className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">Admin Email</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="branch@gym.com"
                                            className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-2 ml-1 flex items-center gap-1">
                                            <Sparkles className="h-3 w-3 text-amber-500" />
                                            Default password will be set to: admin123
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 ml-1">Phone Number</Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input
                                                id="phone"
                                                placeholder="e.g. +91 9876543210"
                                                className="pl-10 h-11 rounded-xl border-gray-200"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-sm font-semibold text-gray-700 ml-1">City</Label>
                                        <div className="relative group">
                                            <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input
                                                id="city"
                                                placeholder="e.g. Mumbai"
                                                className="pl-10 h-11 rounded-xl border-gray-200"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state" className="text-sm font-semibold text-gray-700 ml-1">State / Province</Label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            id="state"
                                            placeholder="e.g. Maharashtra"
                                            className="pl-10 h-11 rounded-xl border-gray-200"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-sm font-semibold text-gray-700 ml-1">Address</Label>
                                    <div className="relative group">
                                        <MapPinned className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            id="address"
                                            placeholder="Full street address"
                                            className="pl-10 h-11 rounded-xl border-gray-200"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="gap-3">
                                <Button type="button" variant="ghost" className="h-11 rounded-xl" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button
                                    type="submit"
                                    className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 px-8 font-bold shadow-lg shadow-blue-200"
                                    onClick={handleSubmit}
                                >
                                    {isEditMode ? "Save Changes" : "Create Branch"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* List Section */}
            <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden mx-1">
                <CardHeader className="bg-white border-b border-gray-100 pb-6 pt-8 px-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-gray-800">Branch List</CardTitle>
                            <p className="text-sm text-gray-500 mt-1 font-medium">View and manage {branches.length} gym locations</p>
                        </div>
                        <div className="relative w-full sm:w-80 group">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search by name or city..."
                                className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:ring-blue-500 rounded-xl transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableHead className="font-bold text-gray-600 px-8 py-4 uppercase text-[11px] tracking-wider">Branch Info</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Contact Info</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider font-semibold">Location</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Stats</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Status</TableHead>
                                    <TableHead className="text-right font-bold text-gray-600 px-8 py-4 uppercase text-[11px] tracking-wider">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(loading ? [] : branches)
                                    .filter((branch) =>
                                        !searchTerm.trim() ||
                                        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        branch.city.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((branch, index) => (
                                        <TableRow
                                            key={branch.id}
                                            className="group cursor-pointer hover:bg-blue-50/30 transition-all border-b border-gray-50"
                                            onClick={() => handleRowClick(branch.id)}
                                        >
                                            <TableCell className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <Avatar className="h-12 w-12 rounded-2xl shadow-inner border border-white">
                                                            <AvatarFallback className={`text-white font-black text-lg bg-gradient-to-br ${index % 2 === 0 ? 'from-blue-500 to-indigo-600' : 'from-violet-500 to-purple-600'}`}>
                                                                {branch.name.substring(0, 1)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase text-xs tracking-tight">{branch.name}</p>
                                                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{branch.id}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                        <Mail className="h-3 w-3 text-gray-400" />
                                                        {branch.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                        <Phone className="h-3 w-3 text-gray-300" />
                                                        {branch.phone}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                                                    <MapPin className="h-4 w-4 text-rose-400" />
                                                    {branch.city}, {branch.state}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-center p-2 rounded-xl bg-blue-50 border border-blue-100 min-w-[50px]">
                                                        <span className="text-[10px] font-bold text-blue-400 uppercase leading-none">Members</span>
                                                        <span className="text-sm font-black text-blue-700 mt-1">{branch.memberCount}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-2 rounded-xl bg-purple-50 border border-purple-100 min-w-[50px]">
                                                        <span className="text-[10px] font-bold text-purple-400 uppercase leading-none">Devices</span>
                                                        <span className="text-sm font-black text-purple-700 mt-1">{branch.deviceCount}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={branch.status === "active" ? "success" : "warning"}
                                                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${branch.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                >
                                                    {branch.status === "active" ? "Active" : branch.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-8 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-blue-100 text-blue-600 h-9 w-9 rounded-xl shadow-sm bg-white border border-blue-100"
                                                        onClick={(e) => handleOpenEdit(branch, e)}
                                                        title="Edit Branch"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-red-100 text-red-600 h-9 w-9 rounded-xl shadow-sm bg-white border border-red-100"
                                                        onClick={(e) => handleDelete(branch.id, e)}
                                                        title="Delete Branch"
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
                <div className="bg-gray-50/50 p-6 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Branches: {branches.length}</p>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Connected</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
