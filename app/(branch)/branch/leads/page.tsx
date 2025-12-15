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
  const toast = useToast();

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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-sm text-muted-foreground">New</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
            <div className="text-sm text-muted-foreground">Contacted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.interested}</div>
            <div className="text-sm text-muted-foreground">Interested</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
            <div className="text-sm text-muted-foreground">Converted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
            <div className="text-sm text-muted-foreground">Lost</div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads Management</h1>
          <p className="text-muted-foreground">Manage and track potential member leads</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="contacted">Contacted</TabsTrigger>
            <TabsTrigger value="interested">Interested</TabsTrigger>
            <TabsTrigger value="converted">Converted</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">{lead.email || "N/A"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {lead.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {lead.location || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[lead.status]}>
                        {STATUS_LABEL[lead.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.source || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
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
