"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Wallet, LineChart, MapPin } from "lucide-react";
import { ApiError, dashboardApi, leadsApi, membersApi, paymentsApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Lead, Member, Payment } from "@/lib/types";
import { Label } from "@radix-ui/react-label";

type RangePreset = "30" | "90" | "custom";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function toIsoDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function safeParseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function BranchInsightsPage() {
  const { user } = useAuth();
  const branchId = user?.branchId;

  const [rangePreset, setRangePreset] = useState<RangePreset>("30");
  const [customFrom, setCustomFrom] = useState<string>(toIsoDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [customTo, setCustomTo] = useState<string>(toIsoDateInput(new Date()));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [membersTotal, setMembersTotal] = useState<number>(0);
  const [membersSample, setMembersSample] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsSummary, setPaymentsSummary] = useState<{ totalAmount: number; completedCount: number; pendingCount: number } | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState<number>(0);
  const [leadStats, setLeadStats] = useState<any>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<Array<{ time: string; users: number }>>([]);

  const range = useMemo(() => {
    const now = new Date();
    if (rangePreset === "30") {
      return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: now };
    }
    if (rangePreset === "90") {
      return { from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), to: now };
    }
    const from = safeParseDateInput(customFrom) ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = safeParseDateInput(customTo) ?? now;
    return { from, to };
  }, [customFrom, customTo, rangePreset]);

  const fetchInsights = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError(null);
      return;
    }

    if (user.role === "branch_admin" && !branchId) {
      setLoading(false);
      setError("Branch not assigned");
      return;
    }

    setLoading(true);
    setError(null);

    const startDate = range.from.toISOString();
    const endDate = range.to.toISOString();

    try {
      const [membersRes, paymentsRes, leadsRes, dashboardRes] = await Promise.all([
        membersApi.list({
          branchId,
          status: "Active",
          page: 1,
          pageSize: 100,
        } as Record<string, string | number | undefined>),
        paymentsApi.list({
          branchId: branchId ?? "",
          status: "completed",
          startDate,
          endDate,
          page: "1",
          pageSize: "100",
        }),
        leadsApi.list({
          branchId: branchId ?? "",
          page: "1",
          pageSize: "100",
        }),
        dashboardApi.getStats(),
      ]);

      setMembersTotal(membersRes.total);
      setMembersSample(membersRes.data);

      setPayments(paymentsRes.data);
      setPaymentsSummary(paymentsRes.summary);

      setLeads(leadsRes.data);
      setLeadsTotal(leadsRes.total);
      setLeadStats(leadsRes.stats);

      const typedDashboard = dashboardRes as any;
      setAttendanceTrend(typedDashboard?.charts?.attendanceTrend ?? []);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load insights";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [branchId, range.from, range.to, user]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const churnRisk = useMemo(() => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();
    return membersSample.filter((m) => {
      if (!m.lastVisit) return false;
      const last = new Date(m.lastVisit).getTime();
      return !Number.isNaN(last) && last <= cutoff;
    }).length;
  }, [membersSample]);

  const conversionRate = useMemo(() => {
    const total = typeof leadStats?.total === "number" ? leadStats.total : leadsTotal;
    const converted = typeof leadStats?.converted === "number" ? leadStats.converted : 0;
    if (!total) return null;
    return Math.round((converted / total) * 100);
  }, [leadStats, leadsTotal]);

  const topMembershipPlans = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of membersSample) {
      map.set(m.plan, (map.get(m.plan) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([plan, count]) => ({ plan, count }));
  }, [membersSample]);

  const topPaymentModes = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const p of payments) {
      const key = p.method;
      const current = map.get(key) ?? { amount: 0, count: 0 };
      map.set(key, { amount: current.amount + p.amount, count: current.count + 1 });
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 3)
      .map(([method, v]) => ({ method, ...v }));
  }, [payments]);

  const topLeadSources = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of leads) {
      map.set(l.source, (map.get(l.source) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([source, count]) => ({ source, count }));
  }, [leads]);

  const avgTraffic = useMemo(() => {
    if (!attendanceTrend.length) return null;
    const sum = attendanceTrend.reduce((acc, p) => acc + (p.users ?? 0), 0);
    return Math.round(sum / attendanceTrend.length);
  }, [attendanceTrend]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Insights</h2>
          <p className="text-muted-foreground">
            Understand trends in memberships, payments, lead sources, and member traffic for this branch.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button size="sm" variant="outline" type="button" onClick={fetchInsights}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-primary/30 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : membersTotal}</p>
            <p className="text-[11px] text-muted-foreground mt-1 underline decoration-primary/20">Active status</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-emerald-300 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {loading ? "—" : formatInr(paymentsSummary?.totalAmount ?? 0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {loading ? "" : `${paymentsSummary?.completedCount ?? 0} completed payments`}
            </p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-300 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">New leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : leadsTotal}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {loading || conversionRate === null ? "" : `Conversion ${conversionRate}%`}
            </p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-rose-300 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Churn risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : churnRisk}</p>
            <p className="text-[11px] text-muted-foreground mt-1 italic">Based on 30d inactivity</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/40">
        <span className="font-medium">Insights for the last {rangePreset === "custom" ? "custom period" : `${rangePreset} days`}.</span>
        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-1 w-fit">
          <Button
            type="button"
            size="sm"
            variant={rangePreset === "30" ? "secondary" : "ghost"}
            className="h-8 rounded-sm px-3 text-[11px] font-bold uppercase tracking-wider transition-all"
            onClick={() => setRangePreset("30")}
          >
            30d
          </Button>
          <Button
            type="button"
            size="sm"
            variant={rangePreset === "90" ? "secondary" : "ghost"}
            className="h-8 rounded-sm px-3 text-[11px] font-bold uppercase tracking-wider transition-all"
            onClick={() => setRangePreset("90")}
          >
            90d
          </Button>
          <Button
            type="button"
            size="sm"
            variant={rangePreset === "custom" ? "secondary" : "ghost"}
            className="h-8 rounded-sm px-3 text-[11px] font-bold uppercase tracking-wider transition-all"
            onClick={() => setRangePreset("custom")}
          >
            Custom
          </Button>
        </div>
      </div>

      {rangePreset === "custom" ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end justify-end border p-4 rounded-lg bg-zinc-50/50">
          <div className="space-y-1.5 flex-1 max-w-[200px]">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">From Date</Label>
            <Input type="date" className="h-9 bg-background" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5 flex-1 max-w-[200px]">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">To Date</Label>
            <Input type="date" className="h-9 bg-background" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
          <Button type="button" size="sm" className="h-9 font-bold px-6 shadow-sm" onClick={fetchInsights}>
            Apply Range
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-t-4 border-t-primary/20">
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Memberships</CardTitle>
              <CardDescription>Top 3 trending membership plans.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading membership insights...</div>
            ) : topMembershipPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
                <Users className="h-10 w-10 text-primary/40" />
                <p className="text-sm">No membership plan data found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topMembershipPlans.map((p) => (
                  <div key={p.plan} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm font-medium">{p.plan}</span>
                    <span className="text-xs text-muted-foreground">{p.count} members</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20">
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Payment modes</CardTitle>
              <CardDescription>Top 3 payment modes by amount.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading payment insights...</div>
            ) : topPaymentModes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
                <Wallet className="h-10 w-10 text-primary/40" />
                <p className="text-sm">No payment data found in the selected range.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPaymentModes.map((m) => (
                  <div key={m.method} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm font-medium">{m.method}</span>
                    <span className="text-xs text-muted-foreground">{formatInr(m.amount)} • {m.count} txns</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20">
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Lead sources</CardTitle>
              <CardDescription>Top 3 sources bringing members to this branch.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading lead insights...</div>
            ) : topLeadSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
                <MapPin className="h-10 w-10 text-primary/40" />
                <p className="text-sm">No lead source data found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topLeadSources.map((s) => (
                  <div key={s.source} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm font-medium">{s.source}</span>
                    <span className="text-xs text-muted-foreground">{s.count} leads</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20">
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Member traffic</CardTitle>
              <CardDescription>Average active member count across the timeline.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading traffic insights...</div>
            ) : avgTraffic === null ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
                <LineChart className="h-10 w-10 text-primary/40" />
                <p className="text-sm">No traffic trend data available.</p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md border px-3 py-3">
                <div>
                  <p className="text-sm font-medium">Average occupancy (trend)</p>
                  <p className="text-[11px] text-muted-foreground">Based on dashboard attendance trend</p>
                </div>
                <p className="text-2xl font-bold">{avgTraffic}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
