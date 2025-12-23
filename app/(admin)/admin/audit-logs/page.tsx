"use client";

import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCcw, ShieldAlert, Search, Filter, Calendar, User, Activity, Globe, Info, Clock, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditLogsApi, ApiError } from "@/lib/api/client";
import type { AuditLog } from "@/lib/types";
import { Label } from "@radix-ui/react-label";

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
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white p-8 rounded-[2rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-12 -translate-y-12">
          <ShieldAlert className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Terminal className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-4xl font-black tracking-tight">Audit Logs</h2>
            </div>
            <p className="text-slate-300 mt-1 text-lg font-light max-w-xl">
              Monitor administrative actions and system updates across the platform.
            </p>
          </div>
          <Button
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-xl transition-all hover:scale-105 font-bold px-6 h-12 rounded-2xl"
            onClick={loadLogs}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white rounded-3xl overflow-hidden mx-1">
        <CardHeader className="bg-slate-50 border-b border-gray-100 pb-4 pt-6 px-8 flex flex-row items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Filter Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Search</Label>
              <div className="relative group">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                <Input
                  placeholder="Keywords..."
                  className="pl-10 h-11 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-slate-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Resource</Label>
              <Input
                placeholder="e.g. Member"
                className="h-11 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-slate-400"
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Action</Label>
              <Input
                placeholder="e.g. Create"
                className="h-11 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-slate-400"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  className="h-11 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-slate-400 pl-10"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  className="h-11 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-slate-400 pl-10"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end pb-0.5">
              <Button variant="ghost" className="w-full h-11 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-600" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden mx-1">
        <CardHeader className="bg-white border-b border-gray-100 p-8 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl text-white">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">History</CardTitle>
              <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Total logs: {total || 0}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-50" onClick={loadLogs}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-24 text-center flex flex-col items-center gap-4">
              <div className="h-10 w-10 border-4 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading logs...</p>
            </div>
          ) : error ? (
            <div className="p-20 text-center">
              <div className="inline-flex p-4 bg-rose-50 text-rose-600 rounded-2xl mb-4">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <p className="font-black text-rose-500 uppercase tracking-widest">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="font-black text-slate-500 px-8 py-4 uppercase text-[10px] tracking-widest">Timestamp</TableHead>
                    <TableHead className="font-black text-slate-500 py-4 uppercase text-[10px] tracking-widest">User</TableHead>
                    <TableHead className="font-black text-slate-500 py-4 uppercase text-[10px] tracking-widest">Action</TableHead>
                    <TableHead className="font-black text-slate-500 py-4 uppercase text-[10px] tracking-widest">Resource</TableHead>
                    <TableHead className="font-black text-slate-500 py-4 uppercase text-[10px] tracking-widest">Details</TableHead>
                    <TableHead className="text-right font-black text-slate-500 px-8 py-4 uppercase text-[10px] tracking-widest">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <Terminal className="h-16 w-16" />
                          <p className="font-black text-slate-500 uppercase tracking-widest text-lg">No logs found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log, idx) => (
                      <TableRow key={log.id} className="group hover:bg-slate-50 transition-all border-b border-gray-50">
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <Clock className="h-3.5 w-3.5 text-slate-300" />
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900 tracking-tight">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(log.timestamp).toLocaleDateString('en-GB')}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-xs uppercase tracking-tight">{log.userName}</div>
                              <div className="text-[10px] font-mono text-slate-400">{log.userId.slice(0, 12)}...</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-slate-200 bg-white text-slate-600 py-0.5 px-3">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="font-black text-[9px] uppercase tracking-widest bg-slate-900 text-white py-0.5 px-3 border-0">
                            {log.resource}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 group/details">
                            <Info className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                            <div className="text-[11px] font-bold text-slate-500 max-w-xs truncate italic">
                              {JSON.stringify(log.details)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                            <Globe className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-mono font-bold text-slate-600">{log.ipAddress || 'Internal'}</span>
                          </div>
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
    <Suspense fallback={<div className="p-12 text-center font-black uppercase tracking-widest text-slate-300 animate-pulse">Loading logs...</div>}>
      <AdminAuditLogsPageContent />
    </Suspense>
  );
}