"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Filter, User, Calendar, X } from "lucide-react";
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
import { auditLogsApi, ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { AuditLog } from "@/lib/types";

export default function BranchAuditLogsPage() {
  const { user } = useAuth();
  const branchId = user?.branchId;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    action: "",
    userName: "",
    dateFrom: "",
    dateTo: "",
  });

  const loadLogs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setLogs([]);
      return;
    }

    if (user.role === "branch_admin" && !branchId) {
      setLoading(false);
      setError("Branch not assigned");
      setLogs([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        branchId: branchId ?? "",
        page: "1",
        pageSize: "50",
      };

      // Apply filters if set
      if (filters.action) params.action = filters.action;
      if (filters.userName) params.userName = filters.userName;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const res = await auditLogsApi.list(params);
      setLogs(res.data ?? []);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load audit logs";
      setError(message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, user, filters]);

  const clearFilters = () => {
    setFilters({ action: "", userName: "", dateFrom: "", dateTo: "" });
  };

  const hasActiveFilters = filters.action || filters.userName || filters.dateFrom || filters.dateTo;

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Track all activities and changes in your branch.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                    {Object.keys(filters).filter(k => filters[k as keyof typeof filters]).length}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Filter Audit Logs</DialogTitle>
                <DialogDescription>
                  Narrow down audit logs by action, user, or date range.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="filter-action">Action</Label>
                  <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any action</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                      <SelectItem value="check_in">Check In</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-user">User Name</Label>
                  <Input
                    id="filter-user"
                    placeholder="Search by user name"
                    value={filters.userName}
                    onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="filter-date-from">Date From</Label>
                    <Input
                      id="filter-date-from"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-date-to">Date To</Label>
                    <Input
                      id="filter-date-to"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button onClick={() => setIsFilterOpen(false)}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-t-4 border-t-primary/20">
        <CardHeader>
          <CardTitle>Recent Branch Activity</CardTitle>
          <CardDescription>
            Review recent actions. Filter by staff, member, or date coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                  <TableHead className="pl-6 min-w-[180px] text-xs font-bold uppercase tracking-wider">Time</TableHead>
                  <TableHead className="min-w-[150px] text-xs font-bold uppercase tracking-wider">Staff</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-bold uppercase tracking-wider">Action</TableHead>
                  <TableHead className="min-w-[200px] text-xs font-bold uppercase tracking-wider">Target</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-bold uppercase tracking-wider">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-xs text-rose-700">
                      {error}
                      <div className="mt-3">
                        <Button size="sm" variant="outline" type="button" onClick={loadLogs}>
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center text-xs text-muted-foreground">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="pl-6 py-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-sm text-foreground">{log.userName}</TableCell>
                      <TableCell className="py-4 text-sm font-medium">{log.action}</TableCell>
                      <TableCell className="py-4 text-xs text-muted-foreground italic">
                        {log.resource}: <span className="font-mono">{log.resourceId}</span>
                      </TableCell>
                      <TableCell className="pr-6 text-right py-4">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                          {log.resource}
                        </Badge>
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
  );
}
