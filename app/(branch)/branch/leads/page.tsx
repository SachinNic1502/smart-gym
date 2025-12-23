"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, UserPlus, Filter, MapPin, Phone, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, leadsApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Lead, LeadStatus } from "@/lib/types";

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

const STATUS_VARIANT: Record<LeadStatus, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  contacted: "secondary",
  interested: "outline",
  converted: "default",
  lost: "destructive",
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
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Total Leads</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">New</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Contacted</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.interested}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Interested</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Converted</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Lost</div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Management</h1>
          <p className="text-muted-foreground">Manage and track potential member leads</p>
        </div>
        <Button className="w-full sm:w-auto shadow-sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 shadow-sm"
          />
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")} className="w-full">
            <TabsList className="w-full justify-start h-10 p-1 bg-muted/20 min-w-max">
              <TabsTrigger value="all" className="text-xs px-4">All</TabsTrigger>
              <TabsTrigger value="new" className="text-xs px-4">New</TabsTrigger>
              <TabsTrigger value="contacted" className="text-xs px-4">Contacted</TabsTrigger>
              <TabsTrigger value="interested" className="text-xs px-4">Interested</TabsTrigger>
              <TabsTrigger value="converted" className="text-xs px-4">Converted</TabsTrigger>
              <TabsTrigger value="lost" className="text-xs px-4">Lost</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                  <TableHead className="pl-6 min-w-[200px] text-xs font-bold uppercase tracking-wider">Name</TableHead>
                  <TableHead className="min-w-[150px] text-xs font-bold uppercase tracking-wider">Contact</TableHead>
                  <TableHead className="min-w-[150px] text-xs font-bold uppercase tracking-wider">Location</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-bold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-bold uppercase tracking-wider">Source</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-bold uppercase tracking-wider">Actions</TableHead>
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
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-muted/20">
                          <Search className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No leads found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div>
                          <div className="font-semibold text-foreground">{lead.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">{lead.email || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 text-primary/60" />
                          <span className="font-mono">{lead.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary/60" />
                          <span className="truncate max-w-[120px]">{lead.location || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant={STATUS_VARIANT[lead.status]} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                          {STATUS_LABEL[lead.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                          {lead.source || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Edit</span>
                            <Filter className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDeleteLead(lead.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

export default function BranchLeadsPage() {
  return (
    <Suspense fallback={<div>Loading leads...</div>}>
      <BranchLeadsPageContent />
    </Suspense>
  );
}
