"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, CreditCard, Filter, AlertCircle, CheckCircle2, DollarSign, Wallet, ArrowUpRight, CalendarClock, MoreHorizontal } from "lucide-react";
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Payments & Renewals</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage transactions, invoices, and membership renewals.
                    </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Button
                        variant="outline"
                        className="shadow-sm"
                        type="button"
                        onClick={exportCsv}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button
                        className="shadow-md shadow-primary/20 bg-primary hover:bg-primary/90"
                        type="button"
                        onClick={() => router.push("/branch/members")}
                    >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Record Payment
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card className="border-border/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Revenue</CardTitle>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">{loading ? "—" : `₹${revenueTotal.toLocaleString()}`}</div>
                        <p className="text-xs text-muted-foreground mt-1">Completed payments</p>
                    </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Pending Collections</CardTitle>
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">{loading ? "—" : `₹${pendingTotal.toLocaleString()}`}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
                    </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Upcoming Renewals</CardTitle>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <CalendarClock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">{loading ? "—" : renewals.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Expiring next 7 days</p>
                    </CardContent>
                </Card>
            </div>

            {error ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Error loading data:</span>
                        <span>{error}</span>
                    </div>
                    <Button size="sm" variant="outline" className="bg-white border-rose-200 text-rose-700 hover:bg-rose-50 h-8" onClick={loadData}>
                        Retry
                    </Button>
                </div>
            ) : null}

            <Tabs defaultValue="transactions" className="w-full">
                <div className="overflow-x-auto no-scrollbar mb-6">
                    <TabsList className="flex w-full min-w-max sm:grid sm:max-w-[400px] grid-cols-2 h-10 p-1 bg-zinc-100/80 rounded-lg">
                        <TabsTrigger value="transactions" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">All Transactions</TabsTrigger>
                        <TabsTrigger value="renewals" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">Pending Renewals</TabsTrigger>
                    </TabsList>
                </div>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="space-y-4 focus-visible:ring-0 mt-0">
                    <Card className="shadow-sm border-border/60">
                        <CardHeader className="pb-3 border-b bg-zinc-50/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                                    <CardDescription className="text-xs">
                                        Showing {filteredPayments.length} records
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search member or invoice..."
                                            className="pl-9 h-9 bg-white"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <select
                                            className="h-9 w-[130px] rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8 cursor-pointer hover:bg-zinc-50"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="completed">Completed</option>
                                            <option value="pending">Pending</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                        <Filter className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent bg-zinc-50/50">
                                            <TableHead className="w-[140px] pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice ID</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                            <TableHead className="text-right pr-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
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
                                                        <div className="p-3 rounded-full bg-muted/20">
                                                            <Search className="h-6 w-6 text-muted-foreground/50" />
                                                        </div>
                                                        <p className="text-sm font-medium">No payments found</p>
                                                        <p className="text-xs max-w-xs mx-auto">Try adjusting your filters or search terms.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredPayments.map((p) => (
                                                <TableRow key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                                                    <TableCell className="font-mono text-xs text-muted-foreground pl-6 py-4 whitespace-nowrap">
                                                        {p.invoiceNumber ?? p.id.slice(0, 8)}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-sm text-foreground py-4 whitespace-nowrap">
                                                        {p.memberName}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground py-4 whitespace-nowrap">
                                                        {new Date(p.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium py-4 whitespace-nowrap">
                                                        {`₹${p.amount.toLocaleString()}`}
                                                    </TableCell>
                                                    <TableCell className="text-xs capitalize py-4">
                                                        {p.method}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge
                                                            variant={p.status === "completed" ? "success" : p.status === "pending" ? "warning" : "destructive"}
                                                            className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 whitespace-nowrap"
                                                        >
                                                            {p.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6 py-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
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
                                                            <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
                <TabsContent value="renewals" className="space-y-4 focus-visible:ring-0 mt-0">
                    <Card className="shadow-sm border-border/60">
                        <CardHeader className="pb-3 border-b bg-zinc-50/50">
                            <CardTitle className="text-lg">Expiring Memberships</CardTitle>
                            <CardDescription className="text-xs">
                                Members whose plans are expiring soon or have expired.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent bg-zinc-50/50">
                                            <TableHead className="pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiry Date</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                            <TableHead className="text-right pr-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</TableHead>
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
                                                        <div className="p-3 rounded-full bg-muted/20">
                                                            <CheckCircle2 className="h-6 w-6 text-emerald-600/50" />
                                                        </div>
                                                        <p className="text-sm font-medium">All clear!</p>
                                                        <p className="text-xs text-muted-foreground">No memberships expiring soon.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            renewals.slice(0, 50).map((m) => {
                                                const expiry = new Date(m.expiryDate);
                                                const isExpired = m.status === "Expired" || expiry < new Date();
                                                const expiryLabel = Number.isNaN(expiry.getTime()) ? m.expiryDate : expiry.toLocaleDateString();

                                                return (
                                                    <TableRow key={m.id} className="hover:bg-zinc-50/50 transition-colors">
                                                        <TableCell className="font-medium text-sm text-foreground pl-6 py-4 whitespace-nowrap">{m.name}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground py-4 whitespace-nowrap">{m.plan}</TableCell>
                                                        <TableCell className={`text-sm py-4 font-mono whitespace-nowrap ${isExpired ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{expiryLabel}</TableCell>
                                                        <TableCell className="py-4">
                                                            <Badge variant={isExpired ? "destructive" : "warning"} className="text-[10px] px-1.5 py-0.5 h-5 uppercase tracking-wide whitespace-nowrap">
                                                                {isExpired ? "Expired" : "Expiring Soon"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6 py-4">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    className="h-7 text-xs bg-primary hover:bg-primary/90 shadow-sm whitespace-nowrap"
                                                                    onClick={() => router.push(`/branch/members/${m.id}/membership`)}
                                                                >
                                                                    Renew
                                                                </Button>
                                                            </div>
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
    );
}
