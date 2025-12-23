"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Wallet, LineChart, MapPin, Sparkles, Activity, TrendingUp, AlertCircle, Calendar } from "lucide-react";
import { ApiError, dashboardApi, leadsApi, membersApi, paymentsApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Lead, Member, Payment } from "@/lib/types";
import { Label } from "@radix-ui/react-label";

type RangePreset = "30" | "90" | "custom";

interface LeadStats {
  total: number;
  converted: number;
}

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
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
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

      // Fix: Cast leadsRes.stats safely based on expected API response
      const stats = leadsRes.stats as unknown as LeadStats | null;
      setLeadStats(stats);

      // Fix: Cast dashboardRes safely
      const dashboardResTyped = dashboardRes as { charts?: { attendanceTrend: Array<{ time: string; users: number }> } };
      setAttendanceTrend(dashboardResTyped?.charts?.attendanceTrend ?? []);
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
    <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
        {/* Abstract Background pattern */}
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
          <Sparkles className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Advanced Insights
            </h2>
            <p className="text-slate-300 mt-2 text-lg font-light">
              Deep dive into memberships, payments, and operational performance.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3 shadow-sm mx-1">
          <span className="font-medium">{error}</span>
          <Button size="sm" variant="outline" className="bg-white border-rose-200 text-rose-700 hover:bg-rose-50" onClick={fetchInsights}>
            Retry
          </Button>
        </div>
      ) : null}

      {/* Date Range Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm mx-1">
        <div className="flex items-center gap-2 px-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">
            Analysis Period: <span className="text-gray-900 font-semibold">{rangePreset === "custom" ? "Custom Range" : `${rangePreset} Days`}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto p-1">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={rangePreset === "30" ? "default" : "ghost"}
              className={`h-8 rounded-md text-xs font-medium ${rangePreset === "30" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              onClick={() => setRangePreset("30")}
            >
              Last 30 Days
            </Button>
            <Button
              size="sm"
              variant={rangePreset === "90" ? "default" : "ghost"}
              className={`h-8 rounded-md text-xs font-medium ${rangePreset === "90" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              onClick={() => setRangePreset("90")}
            >
              Last 90 Days
            </Button>
            <Button
              size="sm"
              variant={rangePreset === "custom" ? "default" : "ghost"}
              className={`h-8 rounded-md text-xs font-medium ${rangePreset === "custom" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              onClick={() => setRangePreset("custom")}
            >
              Custom
            </Button>
          </div>
        </div>
      </div>

      {rangePreset === "custom" && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end justify-end border p-4 rounded-xl bg-white shadow-sm mx-1">
          <div className="space-y-1.5 flex-1 w-full lg:max-w-[200px]">
            <Label className="text-xs font-bold uppercase text-gray-500">From Date</Label>
            <Input type="date" className="h-9 bg-gray-50 border-gray-200" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5 flex-1 w-full lg:max-w-[200px]">
            <Label className="text-xs font-bold uppercase text-gray-500">To Date</Label>
            <Input type="date" className="h-9 bg-gray-50 border-gray-200" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
          <Button type="button" size="sm" className="h-9 font-bold px-6 shadow-md bg-slate-800 hover:bg-slate-700 text-white" onClick={fetchInsights}>
            Apply Range
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-1">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
            <Users className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium opacity-90 text-blue-100">Active Members</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight">{loading ? "—" : membersTotal}</div>
            <p className="text-xs mt-2 flex items-center font-medium opacity-90">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Activity className="h-3 w-3" />
                Current Active Status
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
            <Wallet className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium opacity-90 text-emerald-100">Collections</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wallet className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight">{loading ? "—" : formatInr(paymentsSummary?.totalAmount ?? 0)}</div>
            <p className="text-xs mt-2 flex items-center font-medium opacity-90">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <TrendingUp className="h-3 w-3" />
                {paymentsSummary?.completedCount ?? 0} Transactions
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-600 to-purple-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
            <MapPin className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium opacity-90 text-violet-100">New Leads</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight">{loading ? "—" : leadsTotal}</div>
            <p className="text-xs mt-2 flex items-center font-medium opacity-90">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                {loading || conversionRate === null ? "—" : `Conversion ${conversionRate}%`}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
            <AlertCircle className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium opacity-90 text-rose-100">Churn Risk</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight">{loading ? "—" : churnRisk}</div>
            <p className="text-xs mt-2 flex items-center font-medium opacity-90">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Calendar className="h-3 w-3" />
                Inactive for 30d
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 px-1">
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-800">Top Memberships</CardTitle>
                <CardDescription>Most popular plans among active members</CardDescription>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : topMembershipPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
                <Users className="h-10 w-10 text-gray-200" />
                <p className="text-sm">No data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topMembershipPlans.map((p, i) => (
                  <div key={p.plan} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{p.plan}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                      {p.count} members
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-800">Payment Modes</CardTitle>
                <CardDescription>Revenue distribution by payment method</CardDescription>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : topPaymentModes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
                <Wallet className="h-10 w-10 text-gray-200" />
                <p className="text-sm">No data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topPaymentModes.map((m, i) => (
                  <div key={m.method} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <span className="text-sm font-semibold text-gray-700 capitalize">{m.method}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{formatInr(m.amount)}</p>
                      <p className="text-[10px] text-gray-500">{m.count} txns</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-800">Lead Sources</CardTitle>
                <CardDescription>Where new members are finding you</CardDescription>
              </div>
              <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : topLeadSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
                <MapPin className="h-10 w-10 text-gray-200" />
                <p className="text-sm">No data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topLeadSources.map((s, i) => (
                  <div key={s.source} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <span className="text-sm font-semibold text-gray-700 capitalize">{s.source}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                      {s.count} leads
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-800">Member Traffic</CardTitle>
                <CardDescription>Average daily active members</CardDescription>
              </div>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <LineChart className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : avgTraffic === null ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
                <LineChart className="h-10 w-10 text-gray-200" />
                <p className="text-sm">No traffic data</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-rose-900">Average Occupancy</p>
                  <p className="text-[10px] text-rose-600 font-medium tracking-wide uppercase">Based on recent trends</p>
                </div>
                <div className="text-3xl font-bold text-rose-600">{avgTraffic}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
