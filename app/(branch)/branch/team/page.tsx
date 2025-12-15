"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Search, Filter, MoreHorizontal } from "lucide-react";
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
import { useToast } from "@/components/ui/toast-provider";
import { staffApi, ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Staff } from "@/lib/types";

export default function BranchTeamPage() {
  const toast = useToast();
  const { user } = useAuth();
  const branchId = user?.branchId;

  const [team, setTeam] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    const fetchTeam = async () => {
      if (!branchId) {
        setTeam([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await staffApi.list({ branchId });
        setTeam(res.data);
      } catch (e) {
        const message = e instanceof ApiError ? e.message : "Failed to load team";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

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
      toast({ title: "Staff added", description: "New staff member created successfully", variant: "success" });
      setIsCreateOpen(false);
      setStaffForm({ name: "", email: "", phone: "", role: "" });
      // Refresh the list
      const fetchTeam = async () => {
        if (!branchId) return;
        try {
          const res = await staffApi.list({ branchId, page: "1", pageSize: "50" });
          setTeam(res.data ?? []);
        } catch (e) {
          const message = e instanceof ApiError ? e.message : "Failed to load team";
          setError(message);
        }
      };
      fetchTeam();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to create staff";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setCreating(false);
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team</h2>
          <p className="text-muted-foreground">
            Manage your branch staff and their permissions.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>
                Create a new staff account for your branch. They will receive login credentials via email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="staff-name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="staff-name"
                  placeholder="e.g. John Smith"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="e.g. john@company.com"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="staff-phone"
                  placeholder="e.g. +1 234 567 8900"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select value={staffForm.role} onValueChange={(value) => setStaffForm({ ...staffForm, role: value })}>
                  <SelectTrigger>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStaff} disabled={creating}>
                {creating ? "Creating..." : "Add Staff"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-t-4 border-t-primary/20">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Branch Team</CardTitle>
            <CardDescription>
              Manage your branch staff directory and access.
            </CardDescription>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {loading ? "Loading team..." : `Showing ${filteredTeam.length} of ${team.length} team members.`}
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

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </div>
          ) : null}

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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                      Loading team...
                    </TableCell>
                  </TableRow>
                ) : filteredTeam.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-xs text-muted-foreground"
                    >
                      No team members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeam.map((member) => {
                    let hint = "Core branch staff member";

                    if (member.role === "manager") {
                      hint = "Leads day-to-day branch operations.";
                    } else if (member.role === "receptionist") {
                      hint = "Handles member check-ins and front desk queries.";
                    } else if (member.role === "trainer") {
                      hint = "Runs sessions and supports member goals.";
                    }

                    if (member.status === "inactive") {
                      hint = "Currently inactive in this branch.";
                    }

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
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              variant={member.status === "active" ? "success" : "destructive"}
                              className="text-xs"
                            >
                              {member.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{hint}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="text-xs"
                            onClick={() =>
                              toast({
                                title: "Manage staff",
                                description: "Staff management from this page will be available soon.",
                                variant: "info",
                              })
                            }
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
    </div>
  );
}
