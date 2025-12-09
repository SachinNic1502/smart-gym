"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MOCK_BRANCH_TEAM = [
  {
    id: "BTM001",
    name: "Branch Manager",
    email: "manager@gymbranch.com",
    role: "Manager",
    status: "Active",
  },
  {
    id: "BTM002",
    name: "Front Desk Lead",
    email: "frontdesk@gymbranch.com",
    role: "Front Desk",
    status: "Active",
  },
  {
    id: "BTM003",
    name: "Senior Trainer",
    email: "trainer@gymbranch.com",
    role: "Trainer",
    status: "Inactive",
  },
];

export default function BranchTeamPage() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredTeam = MOCK_BRANCH_TEAM.filter((member) => {
    const matchesSearch =
      !search.trim() ||
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && member.status === "Active") ||
      (statusFilter === "inactive" && member.status !== "Active");

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
              description: "Staff management is mock-only here. This would open a staff form.",
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
              Example staff list. Later this can sync with your real staff directory and permissions.
            </CardDescription>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Showing {filteredTeam.length} of {MOCK_BRANCH_TEAM.length} team members.
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
                {filteredTeam.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-xs text-muted-foreground"
                    >
                      No team members match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeam.map((member) => {
                    let hint = "Core branch staff member";

                    if (member.role === "Manager") {
                      hint = "Leads day-to-day branch operations.";
                    } else if (member.role === "Front Desk") {
                      hint = "Handles member check-ins and front desk queries.";
                    } else if (member.role === "Trainer") {
                      hint = "Runs sessions and supports member goals.";
                    }

                    if (member.status === "Inactive") {
                      hint = "Currently inactive in this branch (mock-only).";
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
                              variant={member.status === "Active" ? "success" : "destructive"}
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
                                description:
                                  "Staff permissions/details are mock-only at the moment.",
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
