"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, CreditCard, Filter, AlertCircle, CheckCircle2, DollarSign, Wallet, ArrowUpRight, CalendarClock, MoreHorizontal, IndianRupee } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, membersApi, paymentsApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Member, Payment } from "@/lib/types";

export default function PaymentsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const { user } = useAuth();
    const branchId = user?.branchId;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [statusFilter, setStatusFilter] = useState("all");

    const loadData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            setError(null);
            setPayments([]);
            setMembers([]);
            return;
        }

        if (user.role === "branch_admin" && !branchId) {
            setLoading(false);
            setError("Branch not assigned");
            setPayments([]);
            setMembers([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [paymentsRes, membersRes] = await Promise.all([
                paymentsApi.list({
                    branchId: branchId ?? "",
                    page: "1",
                    pageSize: "200",
                }),
                membersApi.list({
                    branchId: branchId ?? "",
                    page: 1,
                    pageSize: 200,
                } as Record<string, string | number | undefined>),
            ]);

            setPayments(paymentsRes.data ?? []);
            setMembers((membersRes as unknown as { data: Member[] }).data ?? []);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to load payments";
            setError(message);
            setPayments([]);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    }, [branchId, user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredPayments = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        let filtered = payments;

        if (statusFilter !== "all") {
            filtered = filtered.filter((p) => p.status === statusFilter);
        }

        if (!q) return filtered;

        return filtered.filter((p) => {
            const invoice = (p.invoiceNumber ?? p.id).toLowerCase();
            return (
                invoice.includes(q) ||
                p.memberName.toLowerCase().includes(q) ||
                p.method.toLowerCase().includes(q)
            );
        });
    }, [payments, searchTerm, statusFilter]);

    const revenueTotal = useMemo(() => {
        return payments
            .filter((p) => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);
    }, [payments]);

    const pendingTotal = useMemo(() => {
        return payments
            .filter((p) => p.status === "pending")
            .reduce((sum, p) => sum + p.amount, 0);
    }, [payments]);

    const renewals = useMemo(() => {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return members
            .filter((m) => {
                if (m.status === "Cancelled") return false;
                const expiry = new Date(m.expiryDate);
                if (Number.isNaN(expiry.getTime())) return false;
                return expiry <= sevenDaysFromNow;
            })
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    }, [members]);

    const exportCsv = useCallback(() => {
        if (filteredPayments.length === 0) {
            toast({ title: "Nothing to export", description: "No payments found for current filters", variant: "info" });
            return;
        }

        const header = [
            "invoiceNumber",
            "paymentId",
            "memberName",
            "memberId",
            "date",
            "amount",
            "currency",
            "method",
            "status",
            "description",
        ];

        const rows = filteredPayments.map((p) => [
            p.invoiceNumber ?? "",
            p.id,
            p.memberName,
            p.memberId,
            p.createdAt,
            String(p.amount),
            p.currency,
            p.method,
            p.status,
            p.description,
        ]);

        const csv = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }, [filteredPayments, toast]);

    return (
        <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
                {/* Abstract Background pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
                    <Wallet className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Payments & Renewals
                        </h2>
                        <p className="text-slate-300 mt-2 text-lg font-light">
                            Manage transactions, invoices, and membership renewals.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm shadow-xl"
                            type="button"
                            onClick={exportCsv}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl border-0 font-semibold"
                            type="button"
                            onClick={() => router.push("/branch/members")}
                        >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Record Payment
                        </Button>
                    </div>
                </div>
            </div>

            <div className="px-1 space-y-6">
                {/* Stats Overview */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-3 px-1">
                    {/* Total Revenue */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                            <IndianRupee className="w-24 h-24" />
                        </div>

                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-emerald-100">
                                Total Revenue
                            </CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <IndianRupee className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>

                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight">
                                {loading ? "—" : `₹${revenueTotal.toLocaleString()}`}
                            </div>
                            <p className="text-xs mt-2 flex items-center gap-2 font-medium opacity-90">
                                <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
                                Completed payments
                            </p>
                        </CardContent>
                    </Card>

                    {/* Pending Collections */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                            <AlertCircle className="w-24 h-24" />
                        </div>

                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-amber-100">
                                Pending Collections
                            </CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <AlertCircle className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>

                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight">
                                {loading ? "—" : `₹${pendingTotal.toLocaleString()}`}
                            </div>
                            <p className="text-xs mt-2 flex items-center gap-2 font-medium opacity-90">
                                <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
                                Unpaid invoices
                            </p>
                        </CardContent>
                    </Card>

                    {/* Upcoming Renewals */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                            <CalendarClock className="w-24 h-24" />
                        </div>

                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-blue-100">
                                Upcoming Renewals
                            </CardTitle>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <CalendarClock className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>

                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight">
                                {loading ? "—" : renewals.length}
                            </div>
                            <p className="text-xs mt-2 flex items-center gap-2 font-medium opacity-90">
                                <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
                                Expiring &lt; 7 days
                            </p>
                        </CardContent>
                    </Card>
                </div>


                {error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Error loading data:</span>
                            <span>{error}</span>
                        </div>
                        <Button size="sm" variant="outline" className="bg-white border-rose-200 text-rose-700 hover:bg-rose-50 h-8" onClick={loadData}>
                            Retry
                        </Button>
                    </div>
                ) : null}

                <Tabs defaultValue="transactions" className="w-full space-y-6">
                    <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm inline-flex">
                        <TabsList className="justify-start h-10 bg-transparent p-0 space-x-2">
                            <TabsTrigger
                                value="transactions"
                                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-all"
                            >
                                All Transactions
                            </TabsTrigger>
                            <TabsTrigger
                                value="renewals"
                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-all"
                            >
                                Pending Renewals
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Transactions Tab */}
                    <TabsContent value="transactions" className="space-y-4 focus-visible:ring-0 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="relative w-full lg:max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search member or invoice..."
                                    className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative">
                                    <select
                                        className="h-10 w-full sm:w-[150px] rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus:bg-white appearance-none pr-8 cursor-pointer hover:bg-zinc-50 font-medium"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="completed">Completed</option>
                                        <option value="pending">Pending</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                    <Filter className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <Card className="border-0 shadow-lg bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                                    <CardDescription className="text-xs">
                                        Showing {filteredPayments.length} records
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="w-[140px] pl-6 font-semibold text-gray-600">Invoice ID</TableHead>
                                                <TableHead className="font-semibold text-gray-600">Member</TableHead>
                                                <TableHead className="font-semibold text-gray-600">Date</TableHead>
                                                <TableHead className="font-semibold text-gray-600">Amount</TableHead>
                                                <TableHead className="font-semibold text-gray-600">Method</TableHead>
                                                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                                <TableHead className="text-right pr-6 font-semibold text-gray-600">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                                                        Loading payments...
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredPayments.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="p-3 rounded-full bg-slate-100">
                                                                <Search className="h-6 w-6 text-slate-400" />
                                                            </div>
                                                            <p className="text-sm font-medium">No payments found</p>
                                                            <p className="text-xs text-gray-500">Try adjusting your filters or search terms.</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredPayments.map((p) => (
                                                    <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="font-mono text-xs text-gray-500 pl-6 py-4 whitespace-nowrap">
                                                            {p.invoiceNumber ?? p.id.slice(0, 8)}
                                                        </TableCell>
                                                        <TableCell className="font-bold text-sm text-gray-900 py-4 whitespace-nowrap">
                                                            {p.memberName}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-600 py-4 whitespace-nowrap">
                                                            {new Date(p.createdAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-sm font-bold text-gray-800 py-4 whitespace-nowrap">
                                                            {`₹${p.amount.toLocaleString()}`}
                                                        </TableCell>
                                                        <TableCell className="text-xs uppercase font-medium tracking-wide text-gray-500 py-4">
                                                            {p.method}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <Badge
                                                                variant="outline"
                                                                className={`uppercase text-[10px] font-bold tracking-wider px-2 py-1 whitespace-nowrap border ${p.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                    p.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                        "bg-rose-50 text-rose-700 border-rose-200"
                                                                    }`}
                                                            >
                                                                {p.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6 py-4">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-slate-100"
                                                                type="button"
                                                                onClick={() => {
                                                                    const csv = [
                                                                        ["Invoice #", "Member", "Date", "Amount", "Status", "Description"],
                                                                        [
                                                                            p.invoiceNumber || p.id,
                                                                            p.memberName || "—",
                                                                            new Date(p.createdAt).toLocaleDateString(),
                                                                            String(p.amount),
                                                                            p.status,
                                                                            p.description || "",
                                                                        ],
                                                                    ]
                                                                        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
                                                                        .join("\n");
                                                                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                                                                    const url = URL.createObjectURL(blob);
                                                                    const a = document.createElement("a");
                                                                    a.href = url;
                                                                    a.download = `invoice_${p.invoiceNumber || p.id}.csv`;
                                                                    document.body.appendChild(a);
                                                                    a.click();
                                                                    a.remove();
                                                                    URL.revokeObjectURL(url);
                                                                    toast({ title: "Invoice downloaded", description: "CSV exported for this invoice.", variant: "success" });
                                                                }}
                                                            >
                                                                <Download className="h-4 w-4 text-gray-400 hover:text-gray-900" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Renewals Tab */}
                    <TabsContent value="renewals" className="space-y-4 focus-visible:ring-0 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="border-0 shadow-lg bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-4">
                                <CardTitle className="text-lg">Expiring Memberships</CardTitle>
                                <CardDescription className="text-xs">
                                    Members whose plans are expiring soon or have expired.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="pl-6 font-semibold text-gray-600">Member</TableHead>
                                                <TableHead className="font-semibold text-gray-600">Current Plan</TableHead>
                                                <TableHead className="font-semibold text-gray-600">Expiry Date</TableHead>
                                                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                                <TableHead className="text-right pr-6 font-semibold text-gray-600">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                                                        Loading renewals...
                                                    </TableCell>
                                                </TableRow>
                                            ) : renewals.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="p-3 rounded-full bg-emerald-50">
                                                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                                            </div>
                                                            <p className="text-sm font-medium">All clear!</p>
                                                            <p className="text-xs text-gray-500">No memberships expiring soon.</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                renewals.slice(0, 50).map((m) => {
                                                    const expiry = new Date(m.expiryDate);
                                                    const isExpired = m.status === "Expired" || expiry < new Date();
                                                    const expiryLabel = Number.isNaN(expiry.getTime()) ? m.expiryDate : expiry.toLocaleDateString();

                                                    return (
                                                        <TableRow key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <TableCell className="font-bold text-sm text-gray-900 pl-6 py-4 whitespace-nowrap">{m.name}</TableCell>
                                                            <TableCell className="text-sm text-gray-600 py-4 whitespace-nowrap">{m.plan}</TableCell>
                                                            <TableCell className={`text-sm py-4 font-mono whitespace-nowrap ${isExpired ? "text-rose-600 font-bold" : "text-gray-600"}`}>{expiryLabel}</TableCell>
                                                            <TableCell className="py-4">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] px-2 py-1 h-5 uppercase tracking-wide whitespace-nowrap border ${isExpired ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                                                                >
                                                                    {isExpired ? "Expired" : "Expiring Soon"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6 py-4">
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm whitespace-nowrap"
                                                                    onClick={() => router.push(`/branch/members/${m.id}/membership`)}
                                                                >
                                                                    Renew
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
