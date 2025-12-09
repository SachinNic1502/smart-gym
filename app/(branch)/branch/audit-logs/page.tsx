"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

const MOCK_BRANCH_AUDIT_LOGS = [
  {
    id: "BLOG-001",
    time: "2025-12-09 09:15",
    actor: "Branch Manager",
    action: "Overrode check-in",
    target: "Member: Alex Johnson",
    type: "attendance",
  },
  {
    id: "BLOG-002",
    time: "2025-12-08 18:22",
    actor: "Front Desk",
    action: "Extended membership",
    target: "Member: Priya Singh",
    type: "membership",
  },
  {
    id: "BLOG-003",
    time: "2025-12-08 16:05",
    actor: "Branch Manager",
    action: "Marked device as offline",
    target: "Gate Reader #1",
    type: "device",
  },
];

export default function BranchAuditLogsPage() {
  const toast = useToast();
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Review important actions taken by your branch staff.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={() =>
            toast({
              title: "Filters coming soon",
              description: "Audit log filters will be added in a later version.",
              variant: "info",
            })
          }
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Card className="border-t-4 border-t-primary/20">
        <CardHeader>
          <CardTitle>Recent Branch Activity</CardTitle>
          <CardDescription>
            Mock entries for visualization. Later this can be filtered by staff, member, or date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_BRANCH_AUDIT_LOGS.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.time}</TableCell>
                  <TableCell className="font-medium">{log.actor}</TableCell>
                  <TableCell className="text-sm">{log.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.target}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {log.type}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
