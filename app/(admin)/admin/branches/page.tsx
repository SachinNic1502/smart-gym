"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, Store, MapPin, User, Mail, Pencil, Trash2 } from "lucide-react";
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

const MOCK_BRANCHES = [
    {
        id: "BR001",
        name: "FitStop Downtown",
        location: "New York, NY",
        admin: "John Doe",
        adminEmail: "john@fitstop.com",
        status: "Active",
        members: 892,
        revenue: "₹34,50,000",
    },
    {
        id: "BR002",
        name: "Iron Gym East",
        location: "Brooklyn, NY",
        admin: "Sarah Connor",
        adminEmail: "sarah@irongym.com",
        status: "Active",
        members: 650,
        revenue: "₹24,50,000",
    },
    {
        id: "BR003",
        name: "Flex Studio",
        location: "Queens, NY",
        admin: "Mike Tyson",
        adminEmail: "mike@flex.com",
        status: "Pending",
        members: 0,
        revenue: "₹0",
    },
];

export default function BranchesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [branches, setBranches] = useState(MOCK_BRANCHES);
    const toast = useToast();

    // Form State
    const [formData, setFormData] = useState({ id: "", name: "", location: "", adminName: "", adminEmail: "" });

    const filteredBranches = branches.filter((branch) =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setFormData({ id: "", name: "", location: "", adminName: "", adminEmail: "" });
        setIsEditMode(false);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (branch: any) => {
        setFormData({
            id: branch.id,
            name: branch.name,
            location: branch.location,
            adminName: branch.admin,
            adminEmail: branch.adminEmail || ""
        });
        setIsEditMode(true);
        setIsDialogOpen(true);
    };

    const handleSubmit = () => {
        if (isEditMode) {
            // Update existing
            setBranches(branches.map(b => b.id === formData.id ? { ...b, name: formData.name, location: formData.location, admin: formData.adminName, adminEmail: formData.adminEmail } : b));
            toast({
                title: "Branch updated",
                description: "Branch updated successfully (mock).",
                variant: "success",
            });
        } else {
            // Create new
            const newId = `BR00${branches.length + 1}`;
            setBranches([...branches, {
                id: newId,
                name: formData.name,
                location: formData.location,
                admin: formData.adminName,
                adminEmail: formData.adminEmail,
                members: 0,
                revenue: "₹0",
                status: "Pending"
            }]);
            toast({
                title: "Branch created",
                description: "New branch created successfully (mock).",
                variant: "success",
            });
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this branch? This action cannot be undone.")) {
            setBranches(branches.filter(b => b.id !== id));
            toast({
                title: "Branch deleted",
                description: "Branch removed from the list (mock).",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
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
                                <Label htmlFor="location" className="text-right">
                                    Location
                                </Label>
                                <div className="col-span-3 relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="location"
                                        placeholder="City, State"
                                        className="pl-9"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="admin" className="text-right">
                                    Admin Name
                                </Label>
                                <div className="col-span-3 relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="admin"
                                        placeholder="Full Name"
                                        className="pl-9"
                                        value={formData.adminName}
                                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Admin Email
                                </Label>
                                <div className="col-span-3 relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@gym.com"
                                        className="pl-9"
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
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
                    <div className="flex items-center justify-between">
                        <CardTitle>All Branches</CardTitle>
                        <div className="relative w-72">
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
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-gray-600">Branch Name</TableHead>
                                <TableHead className="font-semibold text-gray-600">Location</TableHead>
                                <TableHead className="font-semibold text-gray-600">Admin</TableHead>
                                <TableHead className="font-semibold text-gray-600">Members</TableHead>
                                <TableHead className="font-semibold text-gray-600">Revenue (YTD)</TableHead>
                                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBranches.map((branch) => (
                                <TableRow key={branch.id} className="cursor-pointer hover:bg-gray-50">
                                    <TableCell className="font-medium text-primary">
                                        <Link href={`/admin/branches/${branch.id}`} className="hover:underline">
                                            {branch.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-gray-500">{branch.location}</TableCell>
                                    <TableCell className="text-gray-500">{branch.admin}</TableCell>
                                    <TableCell className="font-medium">{branch.members}</TableCell>
                                    <TableCell className="font-medium">{branch.revenue}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                branch.status === "Active" ? "success" : "warning"
                                            }
                                            className="px-3 py-1"
                                        >
                                            {branch.status}
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
                </CardContent>
            </Card>
        </div>
    );
}
