"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditLogsApi, ApiError } from "@/lib/api/client";
import type { AuditLog } from "@/lib/types";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [resourceFilter, setResourceFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (resourceFilter) params.resource = resourceFilter;
      if (actionFilter) params.action = actionFilter;
      if (fromDate) params.startDate = fromDate;
      if (toDate) params.endDate = toDate;

      const result = await auditLogsApi.list(Object.keys(params).length ? params : undefined);
      setLogs(result.data);
      setTotal(result.total);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load audit logs";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const handleClearFilters = () => {
    setResourceFilter("");
    setActionFilter("");
    setFromDate("");
    setToDate("");
    setSearch("");
    void loadLogs();
  };

  const resourceOptions = Array.from(new Set(logs.map((log) => log.resource))).sort();
  const actionOptions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const normalizedSearch = search.trim().toLowerCase();
  const filteredLogs = logs.filter((log) => {
    if (!normalizedSearch) return true;
    const fields = [
      log.userName,
      log.action,
      log.resource,
      log.resourceId,
      log.ipAddress,
      log.details ? JSON.stringify(log.details) : "",
    ];
    return fields.some((field) =>
      field ? field.toString().toLowerCase().includes(normalizedSearch) : false,
    );
  });
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Track important actions performed across branches, members, and devices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border-t-4 border-t-primary/20">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Review a history of configuration changes, member updates, and device activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="w-full md:w-64">
                <Input
                  placeholder="Search by actor, action, resource, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Resource</span>
                <Select
                  key={resourceFilter || "all"}
                  defaultValue={resourceFilter}
                  onValueChange={(value) => setResourceFilter(value)}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {resourceOptions.map((resource) => (
                      <SelectItem key={resource} value={resource}>
                        {resource}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Action</span>
                <Select
                  key={actionFilter || "all"}
                  defaultValue={actionFilter}
                  onValueChange={(value) => setActionFilter(value)}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {actionOptions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">From</span>
                <Input
                  type="date"
                  className="h-8 w-36"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">To</span>
                <Input
                  type="date"
                  className="h-8 w-36"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {total !== null && (
                <span className="text-[11px] text-muted-foreground">
                  Showing {filteredLogs.length} of {total} entries
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={() => void loadLogs()}
                disabled={loading}
              >
                Apply
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-xs text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : loading && !logs.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : !loading && !logs.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-xs text-muted-foreground"
                  >
                    No audit entries yet. Actions performed by admins will start appearing here shortly.
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-xs text-muted-foreground"
                  >
                    No audit entries match your current filters or search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  let typeHint = "General configuration change";

                  if (log.resource === "branch") {
                    typeHint = "Branch or plan-level configuration";
                  } else if (log.resource === "device") {
                    typeHint = "Biometric or access device changes";
                  } else if (log.resource === "member") {
                    typeHint = "Member account or profile updates";
                  }

                  let badgeVariant: "outline" | "destructive" | "success" | "warning" = "outline";

                  if (log.action.startsWith("delete") || log.action.startsWith("remove") || log.action.startsWith("revoke")) {
                    badgeVariant = "destructive";
                  } else if (log.action.startsWith("update") || log.action.startsWith("edit")) {
                    badgeVariant = "warning";
                  } else if (log.action.startsWith("create") || log.action.startsWith("add")) {
                    badgeVariant = "success";
                  }

                  const timeLabel = new Date(log.timestamp).toLocaleString();
                  const targetLabel = log.resourceId || "-";

                  return (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{timeLabel}</TableCell>
                      <TableCell className="font-medium">{log.userName}</TableCell>
                      <TableCell className="text-sm">{log.action}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{targetLabel}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant} className="text-xs capitalize">
                          {log.resource}
                        </Badge>
                        <span className="block text-[10px] text-muted-foreground/80">{typeHint}</span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
