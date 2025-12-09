"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, UserPlus, Filter, MapPin, Phone } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

const MOCK_LEADS = [
  {
    id: "LEAD-001",
    name: "Rohan Sharma",
    contact: "+91 98765 00001",
    source: "Walk-in",
    stage: "New",
    assignedTo: "Front Desk",
    lastActivity: "Today, 10:15 AM",
  },
  {
    id: "LEAD-002",
    name: "Priya Verma",
    contact: "+91 98765 00002",
    source: "Instagram",
    stage: "Trial",
    assignedTo: "Trainer - Ankit",
    lastActivity: "Yesterday",
  },
  {
    id: "LEAD-003",
    name: "Amit Patel",
    contact: "+91 98765 00003",
    source: "Referral",
    stage: "Joined",
    assignedTo: "Sales - Neha",
    lastActivity: "2 days ago",
  },
];

export default function BranchLeadsPage() {
  const toast = useToast();

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
                description: "Advanced lead filters will be available in a later version (mock).",
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
            onClick={() =>
              toast({
                title: "Add Lead",
                description: "Lead creation flow is mock-only in this UI right now.",
                variant: "info",
              })
            }
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-6">
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
                <p>3 leads</p>
                <p className="text-muted-foreground">Avg. response time: 2h</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-amber-200 bg-amber-50/40">
              <CardHeader>
                <CardTitle className="text-sm">Trial</CardTitle>
                <CardDescription>On a trial or demo workout.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>4 leads</p>
                <p className="text-muted-foreground">Conversion: 45%</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-emerald-200 bg-emerald-50/40">
              <CardHeader>
                <CardTitle className="text-sm">Joined</CardTitle>
                <CardDescription>Converted to paying members.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>12 leads</p>
                <p className="text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-rose-200 bg-rose-50/40">
              <CardHeader>
                <CardTitle className="text-sm">Lost</CardTitle>
                <CardDescription>Did not join after trial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p>5 leads</p>
                <p className="text-muted-foreground">Follow-up next month</p>
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
                  This is a mock summary view. Later this can show conversion rates, response time and staff performance
                  by stage.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top sources</CardTitle>
                <CardDescription>Where your best leads are coming from.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span>Walk-in</span>
                  </div>
                  <span className="text-xs text-muted-foreground">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-pink-500" />
                    <span>Instagram</span>
                  </div>
                  <span className="text-xs text-muted-foreground">30%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    <span>Referral</span>
                  </div>
                  <span className="text-xs text-muted-foreground">25%</span>
                </div>
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
                    <Input placeholder="Search by name or contact..." className="pl-9" />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() =>
                      toast({
                        title: "Lead filters",
                        description: "Table filters are mock in this demo.",
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
                  {MOCK_LEADS.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {lead.name}
                            <span className="text-[10px] text-muted-foreground">{lead.id}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {lead.contact}
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
                            lead.stage === "Joined"
                              ? "success"
                              : lead.stage === "Lost"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {lead.stage}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{lead.assignedTo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {lead.lastActivity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
