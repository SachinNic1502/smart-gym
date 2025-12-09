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

const MOCK_TEAM = [
  {
    id: "ADM001",
    name: "Platform Owner",
    email: "owner@smartfit.com",
    role: "Owner",
    status: "Active",
  },
  {
    id: "ADM002",
    name: "Support Lead",
    email: "support@smartfit.com",
    role: "Support",
    status: "Active",
  },
  {
    id: "ADM003",
    name: "Finance Manager",
    email: "finance@smartfit.com",
    role: "Finance",
    status: "Inactive",
  },
];

export default function TeamPage() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredTeam = MOCK_TEAM.filter((member) => {
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
            Manage internal Super Admin users who can access this SaaS control panel.
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            toast({
              title: "Invite admin",
              description: "Admin invitation flow is mock-only in this UI.",
              variant: "info",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Invite Admin
        </Button>
      </div>
      <Card className="border-t-4 border-t-primary/20">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>
              Mock user list for visualization. Role and status will be backed by auth later.
            </CardDescription>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Showing {filteredTeam.length} of {MOCK_TEAM.length} admins.
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
                      No admins match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeam.map((member) => {
                    let statusHint = "Standard admin access";

                    if (member.role === "Owner") {
                      statusHint = "Full platform ownership access";
                    } else if (member.status === "Inactive") {
                      statusHint = "Access disabled (mock-only state)";
                    } else if (member.role === "Support") {
                      statusHint = "Helps branches with tickets and issues";
                    } else if (member.role === "Finance") {
                      statusHint = "Oversees billing, payouts, and finance reports";
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
                            <span className="text-[10px] text-muted-foreground">{statusHint}</span>
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
                                title: "Manage admin",
                                description:
                                  "Admin permissions/details are mock-only at the moment.",
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
