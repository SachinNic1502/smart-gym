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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/40 shadow-sm transition-all duration-300 hover:shadow-md lg:p-0 lg:bg-transparent lg:border-none lg:shadow-none">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">Directorship & Team</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
              Orchestrating branch operations and excellence
            </p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-11 px-8 transition-all hover:scale-[1.02] active:scale-95">
              <UserPlus className="mr-2 h-5 w-5" />
              Add Expert
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
      <Card className="shadow-sm border-border/60 bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-4 border-b border-border/40 bg-zinc-50/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-black text-slate-800">Branch Directory</CardTitle>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {loading ? "Initializing..." : `${filteredTeam.length} TEAM MEMBERS FOUND`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Find specialist by name or email..."
                  className="pl-10 h-10 bg-white border-slate-200 rounded-xl focus-visible:ring-primary/20 text-sm font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 min-w-[140px]">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-1 text-[11px] font-black uppercase tracking-wider outline-none focus:ring-1 focus:ring-primary/20"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                >
                  <option value="all">Global Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Lapsed</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto no-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-50/50">
                  <TableHead className="w-[300px] min-w-[240px] h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 pl-8">Directorship / Staff</TableHead>
                  <TableHead className="min-w-[200px] h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Communication</TableHead>
                  <TableHead className="min-w-[140px] h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Role</TableHead>
                  <TableHead className="min-w-[160px] h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">System Status</TableHead>
                  <TableHead className="text-right h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 pr-8 min-w-[120px]">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                      Loading team...
                    </TableCell>
                  </TableRow>
                ) : filteredTeam.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-xs text-muted-foreground"
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
                      <TableRow key={member.id} className="group transition-all hover:bg-slate-50/80 border-slate-100 cursor-pointer">
                        <TableCell className="pl-8 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-11 w-11 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                              <AvatarFallback className="bg-slate-100 text-slate-500 text-[13px] font-black">{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-slate-800 text-[15px] tracking-tight group-hover:text-primary transition-colors">{member.name}</p>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Team member</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-600">{member.email}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{member.phone || "No contact"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-600 border-transparent rounded-lg">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              variant={member.status === "active" ? "success" : "destructive"}
                              className={`font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm ${member.status === 'active' ? 'bg-emerald-500 text-white border-transparent' : ''}`}
                            >
                              {member.status}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400 italic truncate max-w-[140px] opacity-70">{hint}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8 py-4">
                          <Button
                            variant="outline"
                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-all text-slate-600"
                            onClick={() =>
                              toast({
                                title: "Identity Management",
                                description: "Credential controls will be available in the next sync.",
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
    </div >
  );
}
