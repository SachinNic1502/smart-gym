"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, UserPlus, Filter, MapPin, Phone } from "lucide-react";
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

export default function BranchLeadsPage() {
  const toast = useToast();

  const { user } = useAuth();
  const branchId = user?.branchId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);

  const [activeTab, setActiveTab] = useState<"pipeline" | "list">("pipeline");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "",
    notes: "",
  });

  const fetchLeads = useCallback(
    async (opts?: { search?: string; status?: string }) => {
      if (!user) {
        setLoading(false);
        setError(null);
        setLeads([]);
        setStats(null);
        return;
      }

      if (user.role === "branch_admin" && !branchId) {
        setLoading(false);
        setError("Branch not assigned");
        setLeads([]);
        setStats(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await leadsApi.list({
          branchId: branchId ?? "",
          page: "1",
          pageSize: "50",
          ...(opts?.status ? { status: opts.status } : {}),
          ...(opts?.search ? { search: opts.search } : {}),
        });

        setLeads(res.data);
        setStats((res.stats as LeadStats) ?? null);
      } catch (e) {
        const message = e instanceof ApiError ? e.message : "Failed to load leads";
        setError(message);
        setLeads([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    },
    [branchId, user]
  );

  useEffect(() => {
    fetchLeads({ search, status: statusFilter || undefined });
  }, [fetchLeads, search, statusFilter]);

  const sources = useMemo(() => {
    const bySource = new Map<string, number>();
    for (const l of leads) {
      const key = l.source || "Unknown";
      bySource.set(key, (bySource.get(key) ?? 0) + 1);
    }
    const total = leads.length || 1;
    return Array.from(bySource.entries())
      .map(([source, count]) => ({ source, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [leads]);

  const pipelineCounts: LeadStats = stats ?? {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    interested: leads.filter((l) => l.status === "interested").length,
    converted: leads.filter((l) => l.status === "converted").length,
    lost: leads.filter((l) => l.status === "lost").length,
  };

  const handleCreateLead = async () => {
    if (!branchId) {
      toast({ title: "Error", description: "Branch not assigned", variant: "destructive" });
      return;
    }

    if (!createForm.name.trim() || !createForm.phone.trim() || !createForm.source.trim()) {
      toast({ title: "Missing fields", description: "Name, phone, and source are required", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      await leadsApi.create({
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        email: createForm.email.trim() || undefined,
        source: createForm.source.trim(),
        notes: createForm.notes.trim() || undefined,
        branchId,
      });

      toast({ title: "Lead created", description: "Lead has been added successfully", variant: "success" });
      setShowCreate(false);
      setCreateForm({ name: "", phone: "", email: "", source: "", notes: "" });
      await fetchLeads({ search, status: statusFilter || undefined });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to create lead";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">
            Track prospects from first touch to joined member for this branch.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() =>
              toast({
                title: "Lead filters",
                description: "Use status and search filters in the table.",
                variant: "info",
              })
            }
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() => setShowCreate((v) => !v)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Lead</CardTitle>
            <CardDescription>Create a new lead for this branch.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Name *</p>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Phone *</p>
              <Input
                value={createForm.phone}
                onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Email</p>
              <Input
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Optional email"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Source *</p>
              <Input
                value={createForm.source}
                onChange={(e) => setCreateForm((p) => ({ ...p, source: e.target.value }))}
                placeholder="Walk-in / Instagram / Referral"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <Input
                value={createForm.notes}
                onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateLead} disabled={creating}>
                {creating ? "Creating..." : "Create Lead"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button size="sm" variant="outline" type="button" onClick={() => fetchLeads({ search, status: statusFilter || undefined })}>
            Retry
          </Button>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pipeline" | "list")} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="list">All Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-t-4 border-t-blue-200 bg-blue-50/40">
              <CardHeader>
                <CardTitle className="text-sm">New</CardTitle>
                <CardDescription>Fresh enquiries waiting for follow-up.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>{loading ? "..." : `${pipelineCounts.new} leads`}</p>
                <p className="text-muted-foreground">Realtime</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-amber-200 bg-amber-50/40">
              <CardHeader>
                <CardTitle className="text-sm">Interested</CardTitle>
                <CardDescription>Interested and evaluating membership.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>{loading ? "..." : `${pipelineCounts.interested} leads`}</p>
                <p className="text-muted-foreground">Conversion pipeline</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-emerald-200 bg-emerald-50/40">
              <CardHeader>
                <CardTitle className="text-sm">Converted</CardTitle>
                <CardDescription>Converted to members.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>{loading ? "..." : `${pipelineCounts.converted} leads`}</p>
                <p className="text-muted-foreground">Total conversions</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-rose-200 bg-rose-50/40">
              <CardHeader>
                <CardTitle className="text-sm">Lost</CardTitle>
                <CardDescription>Did not join after trial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>{loading ? "..." : `${pipelineCounts.lost} leads`}</p>
                <p className="text-muted-foreground">Needs follow-up</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Lead pipeline snapshot</CardTitle>
                <CardDescription>Quick summary by stage and source.</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>
                  {loading
                    ? "Loading lead insights..."
                    : `Total leads: ${pipelineCounts.total}. Converted: ${pipelineCounts.converted}.`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top sources</CardTitle>
                <CardDescription>Where your best leads are coming from.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {loading ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">Loading sources...</div>
                ) : sources.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">No source data available.</div>
                ) : (
                  sources.map((s, idx) => (
                    <div key={`${s.source}-${idx}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span>{s.source}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{s.pct}%</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>All Leads</CardTitle>
                  <CardDescription>Search, filter and manage all prospects for this branch.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or contact..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() =>
                      toast({
                        title: "Lead filters",
                        description: "Use search and status filters.",
                        variant: "info",
                      })
                    }
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Assigned to</TableHead>
                    <TableHead>Last activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                        Loading leads...
                      </TableCell>
                    </TableRow>
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                        No leads found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {lead.name}
                              <span className="text-[10px] text-muted-foreground">{lead.id}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> {lead.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {lead.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              lead.status === "converted"
                                ? "success"
                                : lead.status === "lost"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {STATUS_LABEL[lead.status] ?? lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{lead.assignedTo || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {lead.updatedAt || lead.createdAt}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
