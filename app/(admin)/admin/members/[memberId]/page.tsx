"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ArrowLeft, CalendarDays, CreditCard, Activity } from "lucide-react";

const MOCK_MEMBERS = [
  { id: "MEM001", name: "Alex Johnson", branch: "FitStop Downtown", plan: "Gold Premium", status: "Active", joinDate: "2024-01-15", visitsThisMonth: 12, outstandingBalance: "₹0" },
  { id: "MEM002", name: "Maria Garcia", branch: "Iron Gym East", plan: "Silver", status: "Active", joinDate: "2024-02-10", visitsThisMonth: 9, outstandingBalance: "₹499" },
  { id: "MEM003", name: "Steve Smith", branch: "FitStop Downtown", plan: "Basic", status: "Expired", joinDate: "2023-11-05", visitsThisMonth: 0, outstandingBalance: "₹1,999" },
  { id: "MEM004", name: "Linda Ray", branch: "Flex Studio", plan: "Gold Premium", status: "Active", joinDate: "2024-03-22", visitsThisMonth: 7, outstandingBalance: "₹0" },
  { id: "MEM005", name: "Robert Downey", branch: "Iron Gym East", plan: "Silver", status: "Active", joinDate: "2024-01-01", visitsThisMonth: 15, outstandingBalance: "₹0" },
];

export default function GlobalMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.memberId as string | undefined;

  const member = useMemo(
    () => MOCK_MEMBERS.find((m) => m.id === memberId),
    [memberId]
  );

  if (!member) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/admin/members")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Member not found</CardTitle>
            <CardDescription>
              We couldn&apos;t find details for this member. Please return to the directory and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => router.push("/admin/members")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Members
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3">
              {member.name}
              <Badge variant={member.status === "Active" ? "success" : "destructive"} className="text-xs px-2">
                {member.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {member.plan} • {member.branch}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Home Branch</p>
            <p className="font-medium">{member.branch}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="font-medium">{member.plan}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Joined On</p>
            <p className="font-medium">{member.joinDate}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visits This Month</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.visitsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Gym entries recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.outstandingBalance}</div>
            <p className="text-xs text-muted-foreground">Pending invoices or dues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Recent classes booked and attendance summary will appear here once backend is connected.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (sample)</CardTitle>
          <CardDescription>Example events for visualization only.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Check-in", detail: "Morning workout", when: "Today, 7:32 AM" },
              { label: "Payment", detail: "Monthly renewal", when: "Last week" },
              { label: "Class", detail: "HIIT Session", when: "2 weeks ago" },
            ].map((item) => (
              <div key={item.when} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.when}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
