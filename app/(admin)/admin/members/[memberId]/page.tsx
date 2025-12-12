"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ArrowLeft, CreditCard, Activity } from "lucide-react";

import { attendanceApi, branchesApi, membersApi, paymentsApi, ApiError } from "@/lib/api/client";
import type { Branch, Member, Payment } from "@/lib/types";

export default function GlobalMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.memberId as string | undefined;
  const [member, setMember] = useState<Member | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [visitsToday, setVisitsToday] = useState<number>(0);
  const [pendingBalance, setPendingBalance] = useState<number>(0);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!memberId) return;
      setLoading(true);
      setError(null);

      try {
        const m = await membersApi.get(memberId);
        setMember(m);

        try {
          const b = await branchesApi.get(m.branchId);
          setBranch(b);
        } catch {
          setBranch(null);
        }

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const date = `${yyyy}-${mm}-${dd}`;

        const [attendanceResult, pendingPaymentsResult, recentPaymentsResult] = await Promise.all([
          attendanceApi.list({ memberId, branchId: m.branchId, date }),
          paymentsApi.list({ memberId, branchId: m.branchId, status: "pending" }),
          paymentsApi.list({ memberId, branchId: m.branchId, page: "1", pageSize: "5" }),
        ]);

        setVisitsToday(attendanceResult.total || 0);

        const pending = (pendingPaymentsResult.data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        setPendingBalance(pending);
        setRecentPayments(recentPaymentsResult.data || []);
      } catch (e) {
        const message = e instanceof ApiError ? e.message : "Failed to load member";
        setError(message);
        setMember(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [memberId]);

  const branchName = useMemo(() => branch?.name || member?.branchId || "—", [branch?.name, member?.branchId]);
  const joinDate = useMemo(() => {
    if (!member?.createdAt) return "—";
    try {
      return new Date(member.createdAt).toLocaleDateString();
    } catch {
      return member.createdAt;
    }
  }, [member?.createdAt]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/admin/members")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Loading member...</CardTitle>
            <CardDescription>Please wait while we fetch the latest member details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !member) {
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
              {error || "We couldn&apos;t find details for this member. Please return to the directory and try again."}
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
              {member.plan} • {branchName}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Home Branch</p>
            <p className="font-medium">{branchName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="font-medium">{member.plan}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Joined On</p>
            <p className="font-medium">{joinDate}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visits Today</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitsToday}</div>
            <p className="text-xs text-muted-foreground">Attendance records (today)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{pendingBalance.toLocaleString()}</div>
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
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest payment attempts for this member.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No payment activity yet.</p>
            ) : (
              recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">₹{p.amount.toLocaleString()} • {p.status}</p>
                    <p className="text-xs text-muted-foreground">{p.method} • {p.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
