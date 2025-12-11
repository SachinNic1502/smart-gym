"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { User, Branch } from "@/lib/types";
import { adminUsersApi, branchesApi, ApiError } from "@/lib/api/client";
import { createBranchAdminSchema, type CreateBranchAdminFormData } from "@/lib/validations/auth";

export default function TeamPage() {
  const toast = useToast();
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team</h2>
          <p className="text-muted-foreground">
            Manage internal Super Admin users who can access this SaaS control panel.
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button type="button">
              <Plus className="mr-2 h-4 w-4" />
              Invite Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Branch Admin</DialogTitle>
              <DialogDescription>
                Create a branch admin with login credentials and branch assignment.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={inviteForm.handleSubmit(handleInviteAdmin)}
              className="mt-4 space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    placeholder="Alex Manager"
                    {...inviteForm.register("name")}
                  />
                  {inviteForm.formState.errors.name && (
                    <p className="text-xs text-red-500">
                      {inviteForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="manager@branch.com"
                    {...inviteForm.register("email")}
                  />
                  {inviteForm.formState.errors.email && (
                    <p className="text-xs text-red-500">
                      {inviteForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admin-phone">Phone (optional)</Label>
                  <Input
                    id="admin-phone"
                    placeholder="+1 (555) 000-0000"
                    {...inviteForm.register("phone")}
                  />
                  {inviteForm.formState.errors.phone && (
                    <p className="text-xs text-red-500">
                      {inviteForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admin-branch">Branch</Label>
                  <select
                    id="admin-branch"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    {...inviteForm.register("branchId")}
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {inviteForm.formState.errors.branchId && (
                    <p className="text-xs text-red-500">
                      {inviteForm.formState.errors.branchId.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Min 6 characters"
                  {...inviteForm.register("password")}
                />
                {inviteForm.formState.errors.password && (
                  <p className="text-xs text-red-500">
                    {inviteForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Creating..." : "Create Admin"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-t-4 border-t-primary/20">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>
              Admin users who can access this SaaS control panel.
            </CardDescription>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Showing {filteredTeam.length} of {admins.length} admins.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <Input
              placeholder="Search by name or email"
              className="h-8 max-w-xs text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Status:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-xs text-muted-foreground"
                    >
                      Loading admin users...
                    </TableCell>
                  </TableRow>
                ) : filteredTeam.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-xs text-muted-foreground"
                    >
                      No admins match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeam.map((member) => {
                    const isSuperAdmin = member.role === "super_admin";
                    const status = "Active";
                    const statusHint = isSuperAdmin
                      ? "Full platform access"
                      : "Manages a specific branch";

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {isSuperAdmin ? "Super Admin" : "Branch Admin"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              variant={status === "Active" ? "success" : "destructive"}
                              className="text-xs"
                            >
                              {status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{statusHint}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="text-xs"
                            onClick={() => handleOpenManage(member)}
                          >
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

      {/* Manage Admin Dialog */}
      <Dialog open={isManageOpen} onOpenChange={(open) => {
        setIsManageOpen(open);
        if (!open) setSelectedAdmin(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Admin</DialogTitle>
            <DialogDescription>
              Update admin details and optionally reset their password.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={manageForm.handleSubmit(handleUpdateAdmin)}
            className="mt-4 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="manage-name">Full Name</Label>
                <Input
                  id="manage-name"
                  placeholder="Full name"
                  {...manageForm.register("name", { required: true })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="manage-email">Email</Label>
                <Input
                  id="manage-email"
                  type="email"
                  placeholder="email@example.com"
                  {...manageForm.register("email", { required: true })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="manage-phone">Phone</Label>
                <Input
                  id="manage-phone"
                  placeholder="+1 (555) 000-0000"
                  {...manageForm.register("phone")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="manage-branch">Branch</Label>
                {selectedAdmin?.role === "branch_admin" ? (
                  <select
                    id="manage-branch"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    {...manageForm.register("branchId")}
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="manage-branch"
                    value="All branches"
                    readOnly
                  />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="manage-password">New Password (optional)</Label>
              <p className="text-[11px] text-muted-foreground">
                Super admin can set a new password for this admin. Leave blank to keep the current password.
              </p>
              <Input
                id="manage-password"
                type="password"
                placeholder="Min 6 characters, or leave blank to keep current password"
                {...manageForm.register("password", { minLength: 6 })}
              />
              {manageForm.formState.errors.password && (
                <p className="text-xs text-red-500">
                  Password must be at least 6 characters.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsManageOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
