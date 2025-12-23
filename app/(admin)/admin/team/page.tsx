"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, ShieldCheck, Mail, Phone, Building, Search, SlidersHorizontal, UserPlus, Fingerprint, Settings2, MoreVertical, Shield } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { User, Branch } from "@/lib/types";
import { adminUsersApi, branchesApi, ApiError } from "@/lib/api/client";
import { createBranchAdminSchema, type CreateBranchAdminFormData } from "@/lib/validations/auth";

export default function TeamPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);

  const inviteForm = useForm<CreateBranchAdminFormData>({
    resolver: zodResolver(createBranchAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      branchId: "",
      password: "",
    },
  });

  type ManageAdminFormValues = {
    name: string;
    email: string;
    phone?: string;
    branchId?: string;
    password?: string;
  };

  const manageForm = useForm<ManageAdminFormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      branchId: "",
      password: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminResult, branchResult] = await Promise.all([
          adminUsersApi.list(),
          branchesApi.list(),
        ]);
        setAdmins(adminResult.data);
        setBranches(branchResult.data);
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Failed to load admin users";
        toast({ title: "Error", description: message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const filteredTeam = admins.filter((member) => {
    const matchesSearch =
      !search.trim() ||
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active") ||
      (statusFilter === "inactive" && false); // no inactive state yet

    return matchesSearch && matchesStatus;
  });

  const handleInviteAdmin = async (data: CreateBranchAdminFormData) => {
    setIsSaving(true);
    try {
      await adminUsersApi.createBranchAdmin(data);
      toast({
        title: "Admin created",
        description: `${data.name} has been added as a branch admin.`,
        variant: "success",
      });
      const result = await adminUsersApi.list();
      setAdmins(result.data);
      setIsInviteOpen(false);
      inviteForm.reset();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to create admin";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenManage = (admin: User) => {
    setSelectedAdmin(admin);
    manageForm.reset({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      branchId: admin.branchId,
      password: "",
    });
    setIsManageOpen(true);
  };

  const handleUpdateAdmin = async (values: ManageAdminFormValues) => {
    if (!selectedAdmin) return;
    setIsSaving(true);
    try {
      await adminUsersApi.updateAdmin(selectedAdmin.id, {
        name: values.name,
        email: values.email,
        phone: values.phone,
        branchId: selectedAdmin.role === "branch_admin" ? values.branchId : undefined,
        password: values.password || undefined,
      });

      const result = await adminUsersApi.list();
      setAdmins(result.data);

      toast({
        title: "Admin updated",
        description: `${values.name} has been updated.`,
        variant: "success",
      });

      setIsManageOpen(false);
      setSelectedAdmin(null);
      manageForm.reset();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update admin";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-700 text-white p-8 rounded-[2rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-12 -translate-y-12">
          <Shield className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-4xl font-black tracking-tight">Team</h2>
            </div>
            <p className="text-orange-50 mt-1 text-lg font-light max-w-xl">
              Manage admins and assign them to specific gym branches.
            </p>
          </div>

          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-orange-700 hover:bg-orange-50 font-bold px-6 py-6 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                <UserPlus className="mr-2 h-5 w-5" />
                Invite Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Invite New Admin</DialogTitle>
                <DialogDescription className="font-medium text-gray-500">
                  Fill in the details below to add a new administrator.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={inviteForm.handleSubmit(handleInviteAdmin)}
                className="mt-6 space-y-6"
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin-name" className="text-sm font-semibold ml-1">Name</Label>
                    <Input
                      id="admin-name"
                      placeholder="Alex Manager"
                      className="h-11 rounded-xl"
                      {...inviteForm.register("name")}
                    />
                    {inviteForm.formState.errors.name && (
                      <p className="text-xs text-red-500 font-medium ml-1">
                        {inviteForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-sm font-semibold ml-1">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="manager@branch.com"
                      className="h-11 rounded-xl"
                      {...inviteForm.register("email")}
                    />
                    {inviteForm.formState.errors.email && (
                      <p className="text-xs text-red-500 font-medium ml-1">
                        {inviteForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-phone" className="text-sm font-semibold ml-1">Phone</Label>
                    <Input
                      id="admin-phone"
                      placeholder="+1 (555) 000-0000"
                      className="h-11 rounded-xl"
                      {...inviteForm.register("phone")}
                    />
                    {inviteForm.formState.errors.phone && (
                      <p className="text-xs text-red-500 font-medium ml-1">
                        {inviteForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-branch" className="text-sm font-semibold ml-1">Assign to Branch</Label>
                    <select
                      id="admin-branch"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                      {...inviteForm.register("branchId")}
                    >
                      <option value="">Select Branch...</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    {inviteForm.formState.errors.branchId && (
                      <p className="text-xs text-red-500 font-medium ml-1">
                        {inviteForm.formState.errors.branchId.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-sm font-semibold ml-1">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    className="h-11 rounded-xl"
                    {...inviteForm.register("password")}
                  />
                  {inviteForm.formState.errors.password && (
                    <p className="text-xs text-red-500 font-medium ml-1">
                      {inviteForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <DialogFooter className="gap-2 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 rounded-xl"
                    onClick={() => setIsInviteOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving} className="h-11 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold px-8 shadow-lg shadow-orange-100">
                    {isSaving ? "Inviting..." : "Invite Admin"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Admin Registry */}
      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden mx-1">
        <CardHeader className="bg-white border-b border-gray-100 pb-6 pt-8 px-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Admin List</CardTitle>
              <CardDescription className="font-medium">
                Manage your gym admins ({admins.length} total)
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              <Input
                placeholder="Search by name or email"
                className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:ring-orange-500 rounded-xl transition-all text-xs font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 px-3">
                <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Status</span>
              </div>
              <select
                className="h-8 rounded-lg border-0 bg-white shadow-sm px-3 text-xs font-black text-gray-700 focus:ring-2 focus:ring-orange-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              >
                <option value="all">All Roles</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="font-bold text-gray-600 px-8 py-4 uppercase text-[11px] tracking-wider">Admin Details</TableHead>
                  <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Branch</TableHead>
                  <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider font-semibold">Role</TableHead>
                  <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Status</TableHead>
                  <TableHead className="text-right font-bold text-gray-600 px-8 py-4 uppercase text-[11px] tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading admins...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTeam.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Users className="h-16 w-16" />
                        <p className="font-black text-gray-500 uppercase tracking-widest text-lg">No admins found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeam.map((member, index) => {
                    const isSuperAdmin = member.role === "super_admin";
                    const status = "Active";
                    const statusHint = isSuperAdmin
                      ? "All Branches"
                      : (branches.find(b => b.id === member.branchId)?.name || 'Regional Scope');

                    return (
                      <TableRow key={member.id} className="group hover:bg-orange-50/30 transition-all border-b border-gray-50">
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <Avatar className={`h-11 w-11 rounded-2xl shadow-sm border border-white bg-gradient-to-br ${index % 2 === 0 ? 'from-orange-500 to-amber-600' : 'from-yellow-500 to-orange-600'}`}>
                              <AvatarFallback className="text-white font-black text-xs">{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase text-xs tracking-tight">{member.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500 lowercase">{member.email}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-3.5 w-3.5 text-gray-400" />
                            <p className="text-xs font-black text-gray-600 uppercase tracking-tighter">{statusHint}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest border-0 py-1 px-3 ${isSuperAdmin ? 'bg-slate-900 text-white' : 'bg-orange-50 text-orange-700'}`}>
                            {isSuperAdmin ? "Super Admin" : "Branch Admin"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-900 hover:bg-gray-50 font-black text-[10px] px-4 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleOpenManage(member)}
                          >
                            <Settings2 className="mr-2 h-3.5 w-3.5" />
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={isManageOpen} onOpenChange={(open) => {
        setIsManageOpen(open);
        if (!open) setSelectedAdmin(null);
      }}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Admin</DialogTitle>
            <DialogDescription className="font-medium text-gray-500">
              Update details for {selectedAdmin?.name}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={manageForm.handleSubmit(handleUpdateAdmin)}
            className="mt-6 space-y-6"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manage-name" className="text-sm font-semibold ml-1">Name</Label>
                <Input
                  id="manage-name"
                  placeholder="Full name"
                  className="h-11 rounded-xl"
                  {...manageForm.register("name", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manage-email" className="text-sm font-semibold ml-1">Email</Label>
                <Input
                  id="manage-email"
                  type="email"
                  placeholder="email@example.com"
                  className="h-11 rounded-xl"
                  {...manageForm.register("email", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manage-phone" className="text-sm font-semibold ml-1">Phone</Label>
                <Input
                  id="manage-phone"
                  placeholder="+1 (555) 000-0000"
                  className="h-11 rounded-xl"
                  {...manageForm.register("phone")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manage-branch" className="text-sm font-semibold ml-1">Branch</Label>
                {selectedAdmin?.role === "branch_admin" ? (
                  <select
                    id="manage-branch"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    {...manageForm.register("branchId")}
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="h-11 flex items-center px-4 bg-slate-900 rounded-xl text-white font-black text-[10px] uppercase tracking-widest border-0">
                    All Branches
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manage-password" className="text-sm font-semibold ml-1">Update Password</Label>
              <Input
                id="manage-password"
                type="password"
                placeholder="Leave blank to keep current password"
                className="h-11 rounded-xl"
                {...manageForm.register("password", { minLength: 6 })}
              />
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 ml-1 leading-relaxed">
                Passwords must be at least 6 characters long.
              </p>
            </div>
            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                className="h-11 rounded-xl font-bold"
                onClick={() => setIsManageOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="h-11 rounded-xl bg-slate-900 hover:bg-black text-white font-bold px-8 shadow-lg shadow-slate-200">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
