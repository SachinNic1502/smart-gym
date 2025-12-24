"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Filter, User, Calendar, X, FileClock, Search } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
          <Shield className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Audit Logs
            </h2>
            <p className="text-slate-300 mt-2 text-lg font-light">
              Security trail of all branch activities and changes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-200 hover:text-white hover:bg-white/10">
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen} modal={false}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl border-0 font-semibold h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] bg-slate-900 text-white">
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
                    <Label htmlFor="filter-action" className="text-xs font-bold uppercase text-gray-500">Action Type</Label>
                    <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
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
                    <Label htmlFor="filter-user" className="text-xs font-bold uppercase text-gray-500">User Name</Label>
                    <Input
                      id="filter-user"
                      placeholder="Search by user name"
                      value={filters.userName}
                      onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
                      className="bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="filter-date-from" className="text-xs font-bold uppercase text-gray-500">Date From</Label>
                      <Input
                        id="filter-date-from"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-date-to" className="text-xs font-bold uppercase text-gray-500">Date To</Label>
                      <Input
                        id="filter-date-to"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="bg-slate-50 border-slate-200 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-4 border-t mt-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Reset
                  </Button>
                  <Button onClick={() => setIsFilterOpen(false)} className="bg-slate-900 text-white hover:bg-slate-800">
                    Apply Filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="px-1">
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                  <FileClock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">System Activity</CardTitle>
                  <CardDescription>Chronological list of events.</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-6 font-semibold text-gray-600 w-[200px]">Timestamp</TableHead>
                    <TableHead className="font-semibold text-gray-600">User</TableHead>
                    <TableHead className="font-semibold text-gray-600">Action</TableHead>
                    <TableHead className="font-semibold text-gray-600">Target Resource</TableHead>
                    <TableHead className="pr-6 text-right font-semibold text-gray-600">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                        Loading audit logs...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-rose-700">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-6 w-6" />
                          <p>{error}</p>
                          <Button size="sm" variant="outline" onClick={loadLogs}>Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 rounded-full bg-slate-100">
                            <Shield className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="text-sm font-medium">No activity recorded.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="pl-6 py-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                              {log.userName.substring(0, 1)}
                            </span>
                            <span className="text-sm font-bold text-gray-700">{log.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border ${log.action === 'create' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              log.action === 'delete' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                log.action === 'update' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                  'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 capitalize">{log.resource}</span>
                            <span className="text-[10px] font-mono text-gray-400">ID: {log.resourceId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 text-right py-4">
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400 hover:text-gray-900 group-hover:bg-white" disabled>
                            View Changes
                          </Button>
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

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
