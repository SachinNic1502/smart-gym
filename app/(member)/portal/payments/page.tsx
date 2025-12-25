"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { paymentsApi, ApiError } from "@/lib/api/client";
import type { Payment } from "@/lib/types";
import { CreditCard, Calendar, TrendingUp, Search, Download, Filter, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function MemberPaymentsPage() {
    const { user } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPayments = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);
        try {
            const result = await paymentsApi.list({
                memberId: user.id,
                page: "1",
                pageSize: "50"
            });
            setPayments(result.data || []);
        } catch (err) {
            console.error("Failed to fetch payments:", err);
            setError("Unable to sync transaction history.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <Skeleton className="h-48 w-full rounded-[40px]" />
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[70vh] flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="bg-rose-50 p-8 rounded-full">
                    <AlertTriangle className="h-16 w-16 text-rose-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-rose-900">Sync Error</h2>
                    <p className="text-rose-500/70 max-w-sm font-medium">{error}</p>
                </div>
                <Button onClick={fetchPayments} variant="outline" className="rounded-2xl px-8 h-12 font-bold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Try Again
                </Button>
            </div>
        );
    }

    const totalSpent = payments.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.amount : 0), 0);

    return (
        <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header Card */}
            <div className="relative overflow-hidden rounded-[40px] bg-slate-900 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]"></div>

                <CardContent className="p-10 md:p-14 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="space-y-4">
                            <Badge className="bg-blue-500/20 text-blue-400 font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full border-0 uppercase">
                                Financial Ledger
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                Transaction <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">History</span>
                            </h1>
                            <p className="text-slate-400 font-medium max-w-sm">
                                Track your membership investments and subscription lineage in one secure portal.
                            </p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 flex flex-col items-center md:items-end gap-1">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Contribution</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-slate-500">₹</span>
                                <span className="text-6xl font-black text-white">{totalSpent.toLocaleString()}</span>
                            </div>
                            <Badge className="mt-2 bg-emerald-500 text-white border-0 font-black rounded-lg uppercase text-[10px] tracking-widest">
                                Lifetime Secure
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </div>

            {/* List Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-2">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Search transactions..."
                        className="h-14 pl-12 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" className="h-14 rounded-2xl px-6 font-black text-[10px] tracking-widest uppercase border-slate-100 bg-white shadow-sm hover:bg-slate-50 gap-2">
                        <Filter className="w-4 h-4" /> Filter
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl px-6 font-black text-[10px] tracking-widest uppercase border-slate-100 bg-white shadow-sm hover:bg-slate-50 gap-2">
                        <Download className="w-4 h-4" /> Export PDF
                    </Button>
                </div>
            </div>

            {/* Transaction Matrix */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <div className="h-2 w-8 bg-blue-600 rounded-full"></div>
                    <h3 className="text-2xl font-black text-slate-900">Digital Archives</h3>
                </div>

                {payments.length === 0 ? (
                    <div className="py-32 text-center rounded-[40px] border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <div className="bg-white p-6 rounded-3xl shadow-lg w-fit mx-auto mb-6">
                            <CreditCard className="w-10 h-10 text-slate-200" />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-2">No transactions detected.</h4>
                        <p className="text-slate-400 font-medium italic">Your financial history will appear here once protocol is initiated.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {payments.map((payment) => (
                            <Card key={payment.id} className="border-0 shadow-lg rounded-[28px] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
                                <CardContent className="p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-8">
                                        <div className="h-16 w-16 rounded-[22px] bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                                            <TrendingUp className="h-8 w-8 text-slate-300 group-hover:text-blue-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                                {payment.description}
                                            </h4>
                                            <div className="flex items-center gap-4 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 opacity-50" />
                                                    {new Date(payment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5 opacity-50" />
                                                    {payment.method.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Amount Secure</span>
                                            <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{payment.amount.toLocaleString()}</span>
                                        </div>
                                        <Badge className={cn(
                                            "h-9 px-6 rounded-xl font-black text-[9px] tracking-widest uppercase border-0 flex items-center",
                                            payment.status === "completed"
                                                ? "bg-emerald-50 text-emerald-600"
                                                : "bg-amber-50 text-amber-600"
                                        )}>
                                            {payment.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Promotion / Help Card */}
            <Card className="border-0 shadow-2xl rounded-[40px] overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                <CardContent className="p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="space-y-4 max-w-md">
                        <h3 className="text-3xl font-black tracking-tight leading-tight">Need Billing Assistance?</h3>
                        <p className="text-white/80 font-medium">
                            If you have questions regarding your transaction history or need a formal tax invoice, our support team is ready to assist.
                        </p>
                    </div>
                    <Button bg-white className="h-16 px-10 rounded-[20px] bg-white text-indigo-600 hover:bg-slate-100 font-black text-sm tracking-widest uppercase shadow-xl transition-all hover:scale-105 active:scale-95">
                        Contact Support
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
