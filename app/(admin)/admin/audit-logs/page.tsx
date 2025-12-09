"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

const MOCK_AUDIT_LOGS = [
  {
    id: "LOG-001",
    time: "2025-12-09 10:45",
    actor: "Super Admin",
    action: "Updated branch plan",
    target: "FitStop Downtown",
    type: "branch",
  },
  {
    id: "LOG-002",
    time: "2025-12-09 10:30",
    actor: "Super Admin",
    action: "Created device",
    target: "Main Entrance A",
    type: "device",
  },
  {
    id: "LOG-003",
    time: "2025-12-08 18:10",
    actor: "Super Admin",
    action: "Edited member",
    target: "Alex Johnson",
    type: "member",
  },
];

export default function AuditLogsPage() {
  const toast = useToast();
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Track important actions performed across branches, members, and devices.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={() =>
            toast({
              title: "Filters coming soon",
              description: "Super Admin audit log filters will be added later.",
              variant: "info",
            })
          }
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Card className="border-t-4 border-t-primary/20">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Example audit entries for visualization. Backend logging can plug into this later.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {MOCK_AUDIT_LOGS.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-xs text-muted-foreground"
                  >
                    No audit entries yet. Actions performed by Super Admins will start appearing here once
                    backend logging is connected.
                  </TableCell>
                </TableRow>
              ) : (
                MOCK_AUDIT_LOGS.map((log) => {
                  let typeHint = "General configuration change";

                  if (log.type === "branch") {
                    typeHint = "Branch or plan-level configuration";
                  } else if (log.type === "device") {
                    typeHint = "Biometric or access device changes";
                  } else if (log.type === "member") {
                    typeHint = "Member account or profile updates";
                  }

                  return (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.time}</TableCell>
                      <TableCell className="font-medium">{log.actor}</TableCell>
                      <TableCell className="text-sm">{log.action}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.target}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {log.type}
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
