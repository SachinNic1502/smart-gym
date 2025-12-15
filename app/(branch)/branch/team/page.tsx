"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError, staffApi } from "@/lib/api/client";
import type { Staff } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

export default function BranchTeamPage() {
  const toast = useToast();
  const { user } = useAuth();
  const branchId = user?.branchId;

  const [team, setTeam] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            Manage your local branch staff and their access.
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            toast({
              title: "Add team member",
              description: "Staff creation from this page will be available soon.",
              variant: "info",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
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
