"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, UserPlus, Filter, MapPin, Phone, Trash2, Users, Target, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, leadsApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Lead, LeadStatus } from "@/lib/types";
import { AddLeadDialog } from "./add-lead-dialog";

type LeadStats = {
  total: number;
  new: number;
  contacted: number;
  interested: number;
  converted: number;
  lost: number;
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  converted: "Converted",
  lost: "Lost",
};

const STATUS_ICONS: Record<LeadStatus, any> = {
  new: Sparkles,
  contacted: Phone,
  interested: Target,
  converted: CheckCircle2,
  lost: XCircle,
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  interested: "bg-purple-50 text-purple-700 border-purple-200",
  converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-rose-50 text-rose-700 border-rose-200",
};

function BranchLeadsPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    new: 0,
    contacted: 0,
    interested: 0,
    converted: 0,
    lost: 0,
  });
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const { user } = useAuth();
  const branchId = user?.branchId;
  const { toast } = useToast();

  const loadLeads = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await leadsApi.list({ branchId, page: "1", pageSize: "100" });
      setLeads(response.data);

      // Calculate stats
      const leadStats = response.data.reduce(
        (acc: LeadStats, lead: Lead) => {
          acc.total++;
          acc[lead.status]++;
          return acc;
        },
        { total: 0, new: 0, contacted: 0, interested: 0, converted: 0, lost: 0 }
      );
      setStats(leadStats);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load leads";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [branchId, toast]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        lead.phone.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const handleDeleteLead = async (leadId: string) => {
    try {
      await leadsApi.delete(leadId);
      toast({ title: "Success", description: "Lead deleted successfully", variant: "success" });
      loadLeads();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to delete lead";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
        {/* Abstract Background pattern */}
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
          <Target className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Leads Management
            </h2>
            <p className="text-slate-300 mt-2 text-lg font-light">
              Track, nurture, and convert potential members.
            </p>
          </div>
          <Button onClick={() => setIsAddLeadOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl border-0">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Lead
          </Button>
        </div>
      </div>

      <div className="px-1 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Leads */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 scale-150">
              <Users className="w-16 h-16 text-slate-500" />
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                Total Leads
              </div>
            </CardContent>
          </Card>

          {/* New */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100/70 overflow-hidden relative group border-l-4 border-blue-500">
            <div className="absolute top-0 right-0 p-3 opacity-10 scale-150">
              <Sparkles className="w-16 h-16 text-blue-500" />
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="text-3xl font-bold text-blue-700">{stats.new}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mt-1">
                New
              </div>
            </CardContent>
          </Card>

          {/* Contacted */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-yellow-50 to-yellow-100/70 overflow-hidden relative group border-l-4 border-yellow-500">
            <div className="absolute top-0 right-0 p-3 opacity-10 scale-150">
              <Phone className="w-16 h-16 text-yellow-500" />
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="text-3xl font-bold text-yellow-700">{stats.contacted}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 mt-1">
                Contacted
              </div>
            </CardContent>
          </Card>

          {/* Interested */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-purple-100/70 overflow-hidden relative group border-l-4 border-purple-500">
            <div className="absolute top-0 right-0 p-3 opacity-10 scale-150">
              <Target className="w-16 h-16 text-purple-500" />
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="text-3xl font-bold text-purple-700">{stats.interested}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mt-1">
                Interested
              </div>
            </CardContent>
          </Card>

          {/* Converted */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-emerald-100/70 overflow-hidden relative group border-l-4 border-emerald-500">
            <div className="absolute top-0 right-0 p-3 opacity-10 scale-150">
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="text-3xl font-bold text-emerald-700">{stats.converted}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mt-1">
                Converted
              </div>
            </CardContent>
          </Card>

          {/* Lost */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-rose-50 to-rose-100/70 overflow-hidden relative group border-l-4 border-rose-500">
            <div className="absolute top-0 right-0 p-3 opacity-10 scale-150">
              <XCircle className="w-16 h-16 text-rose-500" />
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="text-3xl font-bold text-rose-700">{stats.lost}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mt-1">
                Lost
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Content */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>

            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")} className="w-full md:w-auto">
              <TabsList className="bg-slate-100 p-1 h-10 rounded-lg">
                <TabsTrigger value="all" className="text-xs px-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all">All</TabsTrigger>
                <TabsTrigger value="new" className="text-xs px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md transition-all">New</TabsTrigger>
                <TabsTrigger value="contacted" className="text-xs px-3 data-[state=active]:bg-white data-[state=active]:text-yellow-700 data-[state=active]:shadow-sm rounded-md transition-all">Contacted</TabsTrigger>
                <TabsTrigger value="interested" className="text-xs px-3 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-md transition-all">Interested</TabsTrigger>
                <TabsTrigger value="converted" className="text-xs px-3 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-md transition-all">Converted</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="border-0 shadow-lg bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-50 pb-4 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Leads Database</CardTitle>
                  <CardDescription>
                    Showing {filteredLeads.length} potential members
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Filter className="mr-2 h-3 w-3" /> Advanced Filter
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="pl-6 font-semibold text-gray-600">Prospect Details</TableHead>
                      <TableHead className="font-semibold text-gray-600">Contact Info</TableHead>
                      <TableHead className="font-semibold text-gray-600">Location</TableHead>
                      <TableHead className="font-semibold text-gray-600">Status</TableHead>
                      <TableHead className="font-semibold text-gray-600">Source</TableHead>
                      <TableHead className="pr-6 text-right font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          Loading leads...
                        </TableCell>
                      </TableRow>
                    ) : filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 rounded-full bg-slate-100">
                              <Search className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900">No leads found</h3>
                            <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => {
                        const StatusIcon = STATUS_ICONS[lead.status] || Clock;
                        return (
                          <TableRow key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="pl-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                  {lead.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900">{lead.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" /> Added recently
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="font-mono">{lead.phone}</span>
                                </div>
                                {lead.email && (
                                  <div className="text-xs text-gray-500 truncate max-w-[160px] pl-5.5">
                                    {lead.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                <span className="truncate max-w-[120px]">{lead.location || "N/A"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 shadow-sm border ${STATUS_STYLES[lead.status]} hover:bg-opacity-80`}>
                                <StatusIcon className="w-3 h-3 mr-1 inline-block" />
                                {STATUS_LABEL[lead.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                                {lead.source || "Walk-in"}
                              </span>
                            </TableCell>
                            <TableCell className="pr-6 text-right py-4">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0Hover:bg-blue-50 hover:text-blue-600">
                                  <span className="sr-only">Edit</span>
                                  <Filter className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                                  onClick={() => handleDeleteLead(lead.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
      </div>

      <AddLeadDialog
        open={isAddLeadOpen}
        onOpenChange={setIsAddLeadOpen}
        onSuccess={loadLeads}
      />
    </div>
  );
}

export default function BranchLeadsPage() {
  return (
    <Suspense fallback={<div>Loading leads...</div>}>
      <BranchLeadsPageContent />
    </Suspense>
  );
}
