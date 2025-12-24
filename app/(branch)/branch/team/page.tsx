"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Search, Filter, Briefcase, Mail, Phone, ShieldCheck, Edit, Trash2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { staffApi, ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Staff } from "@/lib/types";

export default function BranchTeamPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const branchId = user?.branchId;

  const [team, setTeam] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "active" as "active" | "inactive",
  });

  // Delete dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const fetchTeam = async () => {
    if (!branchId) {
      setTeam([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await staffApi.list({ branchId, page: "1", pageSize: "100" });
      setTeam(res.data ?? []);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load team";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [branchId]);

  const handleCreateStaff = async () => {
    if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.phone.trim() || !staffForm.role) {
      toast({ title: "Missing fields", description: "All fields are required", variant: "warning" });
      return;
    }

    setCreating(true);
    try {
      await staffApi.create({
        name: staffForm.name,
        email: staffForm.email,
        phone: staffForm.phone,
        role: staffForm.role as Staff["role"],
        branchId: branchId!,
        joiningDate: new Date().toISOString().split("T")[0],
        status: "active",
        updatedAt: new Date().toISOString(),
      });
      toast({ title: "Staff added", description: `${staffForm.name} has been added to the team`, variant: "success" });
      setIsCreateOpen(false);
      setStaffForm({ name: "", email: "", phone: "", role: "" });
      fetchTeam();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to create staff";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (member: Staff) => {
    setEditingStaff(member);
    setEditForm({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      role: member.role,
      status: member.status,
    });
    setIsEditOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;

    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.role) {
      toast({ title: "Missing fields", description: "Name, email, and role are required", variant: "warning" });
      return;
    }

    setUpdating(true);
    try {
      await staffApi.update(editingStaff.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role as Staff["role"],
        status: editForm.status,
      });
      toast({ title: "Updated", description: `${editForm.name}'s details have been updated`, variant: "success" });
      setIsEditOpen(false);
      setEditingStaff(null);
      fetchTeam();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to update staff";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (member: Staff) => {
    setDeletingStaff(member);
    setIsDeleteOpen(true);
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;

    setDeleting(true);
    try {
      await staffApi.delete(deletingStaff.id);
      toast({ title: "Removed", description: `${deletingStaff.name} has been removed from the team`, variant: "success" });
      setIsDeleteOpen(false);
      setDeletingStaff(null);
      fetchTeam();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to delete staff";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const filteredTeam = team.filter((member) => {
    const matchesSearch =
      !search.trim() ||
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && member.status === "active") ||
      (statusFilter === "inactive" && member.status === "inactive");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-900 via-sky-800 to-blue-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
          <Users className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Directorship & Team
            </h2>
            <p className="text-blue-100 mt-2 text-lg font-light">
              Orchestrating branch operations and excellence.
            </p>
          </div>

          {/* Create Staff Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-blue-900 hover:bg-blue-50 shadow-xl border-0 font-semibold h-11 px-6">
                <UserPlus className="mr-2 h-5 w-5" />
                Add Expert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-2 bg-blue-50/30">
                <DialogTitle className="text-blue-900 text-xl">Add Staff Member</DialogTitle>
                <DialogDescription>
                  Create a new staff account. Credentials will be sent via email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="staff-name" className="text-xs font-bold uppercase text-gray-500">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="staff-name"
                    placeholder="e.g. John Smith"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-email" className="text-xs font-bold uppercase text-gray-500">
                      Email <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="e.g. john@company.com"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-phone" className="text-xs font-bold uppercase text-gray-500">
                      Phone <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="staff-phone"
                      placeholder="e.g. +1 234 567 8900"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      className="bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-role" className="text-xs font-bold uppercase text-gray-500">
                    Role <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={staffForm.role} onValueChange={(value) => setStaffForm({ ...staffForm, role: value })}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trainer">Trainer</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="branch_admin">Branch Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="p-4 border-t bg-slate-50/50">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-200">
                  Cancel
                </Button>
                <Button onClick={handleCreateStaff} disabled={creating} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {creating ? "Creating..." : "Add Staff"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 bg-blue-50/30">
            <DialogTitle className="text-blue-900 text-xl">Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member details and status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-xs font-bold uppercase text-gray-500">
                Full Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g. John Smith"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-xs font-bold uppercase text-gray-500">
                  Email <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="e.g. john@company.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-xs font-bold uppercase text-gray-500">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  placeholder="e.g. +1 234 567 8900"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-xs font-bold uppercase text-gray-500">
                  Role <span className="text-rose-500">*</span>
                </Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="branch_admin">Branch Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-xs font-bold uppercase text-gray-500">
                  Status <span className="text-rose-500">*</span>
                </Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value as "active" | "inactive" })}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 border-t bg-slate-50/50">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleUpdateStaff} disabled={updating} className="bg-blue-600 hover:bg-blue-700 text-white">
              {updating ? "Updating..." : "Update Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              Remove Staff Member?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to remove <strong>{deletingStaff?.name}</strong> from the team?
              </p>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. All audit logs will be preserved.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStaff}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? "Removing..." : "Remove Staff"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="px-1 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Find specialist by name or email..."
              className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-lg focus:bg-white transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              >
                <option value="all">Every Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Lapsed</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
            {error}
          </div>
        ) : null}

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg">Branch Directory</CardTitle>
            <CardDescription>
              {loading ? "Initializing..." : `${filteredTeam.length} Team Members`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[300px] pl-6 font-semibold text-gray-600">Staff Member</TableHead>
                    <TableHead className="font-semibold text-gray-600">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-600">Role</TableHead>
                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                    <TableHead className="text-right pr-6 font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                        Loading team...
                      </TableCell>
                    </TableRow>
                  ) : filteredTeam.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-16 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 rounded-full bg-slate-100">
                            <Users className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="text-sm font-medium">No team members found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeam.map((member) => (
                      <TableRow key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{member.name}</span>
                              <span className="text-xs text-slate-500 font-medium">ID: {member.id.substring(0, 8)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail className="w-3.5 h-3.5 text-gray-400" /> {member.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Phone className="w-3.5 h-3.5 text-gray-400" /> {member.phone || "—"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 capitalize font-medium border border-slate-200">
                            <Briefcase className="w-3 h-3 mr-1 opacity-70" />
                            {member.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant="outline"
                            className={`uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 border ${member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-medium bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 shadow-sm"
                              onClick={() => handleEditClick(member)}
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-medium bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 shadow-sm"
                              onClick={() => handleDeleteClick(member)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Remove
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
    </div>
  );
}
