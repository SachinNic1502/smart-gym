"use client";

import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditLogsApi, ApiError } from "@/lib/api/client";
import type { AuditLog } from "@/lib/types";

function AdminAuditLogsPageContent() {
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
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (search) params.search = search;
      params.page = "1";
      params.pageSize = "100";

      const response = await auditLogsApi.list(params);
      setLogs(response.data);
      setTotal(response.total);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load audit logs";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const clearFilters = () => {
    setResourceFilter("");
    setActionFilter("");
    setFromDate("");
    setToDate("");
    setSearch("");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">View system activity and audit trail</p>
        </div>
        <Button variant="outline" onClick={loadLogs}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Input
              placeholder="Resource"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
            />
            <Input
              placeholder="Action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs ({total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading audit logs...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.userName}</div>
                            <div className="text-sm text-muted-foreground">{log.userId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.resource}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{log.ipAddress}</div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <Suspense fallback={<div>Loading audit logs...</div>}>
      <AdminAuditLogsPageContent />
    </Suspense>
  );
}