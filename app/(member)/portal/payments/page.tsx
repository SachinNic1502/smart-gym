"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Clock, RefreshCcw, CreditCard } from "lucide-react";
import { ApiError, meApi, paymentsApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast-provider";
import type { Member, Payment } from "@/lib/types";

export default function MemberPaymentsPage() {
    const { user } = useAuth();
    const branchId = user?.branchId;
    const toast = useToast();

    const [profile, setProfile] = useState<Member | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch profile
            try {
                const profileRes = await meApi.getProfile();
                setProfile(profileRes);
                
                // Fetch payments for this member
                if (profileRes?.id) {
                    const paymentsRes = await paymentsApi.list({ branchId, memberId: profileRes.id });
                    setPayments(paymentsRes.data ?? []);
                }
            } catch (e) {
                const message = e instanceof ApiError ? e.message : "Failed to load data";
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const planName = profile?.plan || "No Plan";
    const expiryDate = profile?.expiryDate 
        ? new Date(profile.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "—";
    const isActive = profile?.status === "Active";

    // Calculate monthly cost from recent payment
    const lastPayment = payments[0];
    const monthlyAmount = lastPayment?.amount || 0;

    if (loading) {
        return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading billing history...</div>;
    }

    if (error) {
        return (
            <div className="py-20 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={loadData}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Billing History</h1>
                    <p className="text-muted-foreground text-sm">View your active plan and past transactions.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Active Plan Card */}
            <Card className="bg-gradient-to-r from-primary to-blue-600 text-white border-none shadow-lg">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 font-medium mb-1">Current Plan</p>
                            <h2 className="text-3xl font-bold">{planName}</h2>
                            <p className="text-blue-100 text-sm mt-2 flex items-center gap-1">
                                <Clock className="h-4 w-4" /> Expires on {expiryDate}
                            </p>
                        </div>
                        <div className="text-right">
                            {monthlyAmount > 0 && (
                                <p className="text-3xl font-bold">₹{monthlyAmount.toLocaleString()}</p>
                            )}
                            <Badge className={`mt-4 ${isActive ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'}`}>
                                {isActive ? "Active" : profile?.status || "Unknown"}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {payments.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-sm font-medium">No transactions found</p>
                            <p className="text-xs">Your payment history will appear here.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Invoice</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-medium">
                                            {new Date(tx.createdAt).toLocaleDateString("en-US", { 
                                                month: "short", 
                                                day: "numeric", 
                                                year: "numeric" 
                                            })}
                                        </TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell>₹{tx.amount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={tx.status === "completed" ? "success" : tx.status === "pending" ? "warning" : "destructive"}
                                                className="capitalize"
                                            >
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0"
                                                onClick={() => {
                                                    const csv = [
                                                        ["Invoice #", "Date", "Description", "Amount", "Status"],
                                                        [
                                                            tx.invoiceNumber || tx.id,
                                                            new Date(tx.createdAt).toLocaleDateString(),
                                                            tx.description,
                                                            String(tx.amount),
                                                            tx.status,
                                                        ],
                                                    ]
                                                        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
                                                        .join("\n");
                                                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement("a");
                                                    a.href = url;
                                                    a.download = `invoice_${tx.invoiceNumber || tx.id}.csv`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    a.remove();
                                                    URL.revokeObjectURL(url);
                                                    toast({ title: "Invoice downloaded", description: "CSV exported for this invoice.", variant: "success" });
                                                }}
                                            >
                                                <Download className="h-4 w-4 text-gray-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
