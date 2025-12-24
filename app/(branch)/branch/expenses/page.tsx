"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, TrendingDown, RefreshCcw, Sparkles, TrendingUp, Wallet, Receipt } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, expensesApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Expense, ExpenseCategory } from "@/lib/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function ExpensesPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const branchId = user?.branchId;

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        description: "",
        amount: "",
        category: "rent" as ExpenseCategory,
        date: new Date().toISOString().split("T")[0],
    });

    const loadExpenses = useCallback(async () => {
        if (!user) return;
        if (user.role === "branch_admin" && !branchId) {
            setError("Branch not assigned");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await expensesApi.list({ branchId: branchId ?? "", page: "1", pageSize: "50" });
            setExpenses(res.data ?? []);
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to load expenses";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [branchId, user]);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    const handleCreate = async () => {
        if (!form.description.trim() || !form.amount || !form.date) {
            toast({ title: "Missing details", description: "Please fill all fields.", variant: "warning" });
            return;
        }

        const amount = parseFloat(form.amount);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Invalid amount", description: "Please enter a valid positive number.", variant: "warning" });
            return;
        }

        setSaving(true);
        try {
            await expensesApi.create({
                branchId,
                description: form.description,
                amount,
                category: form.category,
                date: form.date,
                currency: "INR",
                createdBy: user?.name || "Staff",
            });

            toast({ title: "Expense added", variant: "success" });
            setIsDialogOpen(false);
            setForm({
                description: "",
                amount: "",
                category: "rent",
                date: new Date().toISOString().split("T")[0],
            });
            loadExpenses();
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to create expense";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const totalExpenses = useMemo(() => {
        return expenses.reduce((sum, ex) => sum + ex.amount, 0);
    }, [expenses]);

    const largestCategory = useMemo(() => {
        const cats: Record<string, number> = {};
        expenses.forEach(ex => {
            cats[ex.category] = (cats[ex.category] || 0) + ex.amount;
        });

        let max = 0;
        let maxCat = "None";
        Object.entries(cats).forEach(([cat, val]) => {
            if (val > max) {
                max = val;
                maxCat = cat;
            }
        });

        return { category: maxCat, amount: max };
    }, [expenses]);

    return (
        <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-red-900 via-rose-900 to-red-950 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
                {/* Abstract Background pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
                    <Sparkles className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Expense Management
                        </h2>
                        <p className="text-rose-200 mt-2 text-lg font-light">
                            Track and manage your branch overheads and spending.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={loadExpenses}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-white text-rose-900 hover:bg-rose-50 shadow-xl transition-all hover:scale-105 active:scale-95 font-semibold">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Expense
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add Expense</DialogTitle>
                                    <DialogDescription>Record a new expense for this branch.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            placeholder="e.g. Office Supplies"
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Amount (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={form.amount}
                                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={form.category}
                                                onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                                            >
                                                <option value="rent">Rent</option>
                                                <option value="utilities">Utilities</option>
                                                <option value="equipment">Equipment</option>
                                                <option value="salaries">Salaries</option>
                                                <option value="maintenance">Maintenance</option>
                                                <option value="marketing">Marketing</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={form.date}
                                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreate} disabled={saving} className="bg-rose-600 hover:bg-rose-700 text-white">
                                        {saving ? "Saving..." : "Save Expense"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium shadow-sm mx-1 flex justify-between items-center">
                    <span>{error}</span>
                    <Button size="sm" variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50" onClick={loadExpenses}>
                        Retry
                    </Button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-1">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-rose-500 to-pink-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium opacity-90 text-rose-100">Total Expenses</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <DollarSign className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold tracking-tight">{loading ? "—" : `₹${totalExpenses.toLocaleString()}`}</div>
                        <p className="text-xs mt-2 flex items-center font-medium opacity-90">
                            <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm text-[10px] text-white/90">
                                <TrendingUp className="h-3 w-3" />
                                Recorded this month
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-500 to-amber-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
                        <Receipt className="w-24 h-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium opacity-90 text-orange-100">Largest Category</CardTitle>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <TrendingDown className="h-4 w-4 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold tracking-tight capitalize">{loading ? "—" : largestCategory.category}</div>
                        <p className="text-xs mt-2 flex items-center font-medium opacity-90">
                            <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm text-[10px] text-white/90">
                                ₹{largestCategory.amount.toLocaleString()}
                            </span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Expenses Table */}
            <div className="px-1">
                <Card className="border-0 shadow-lg bg-white overflow-hidden">
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-gray-800">Expense History</CardTitle>
                                <CardDescription>Recent transactions and bills</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent bg-gray-50/50">
                                        <TableHead className="pl-6 text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[200px]">Description</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[120px]">Category</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[120px]">Date</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[150px]">Recorded By</TableHead>
                                        <TableHead className="text-right pr-6 text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[120px]">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-12 text-center text-sm text-gray-400">
                                                Loading expenses...
                                            </TableCell>
                                        </TableRow>
                                    ) : expenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-16 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-4 rounded-full bg-gray-50 text-gray-300">
                                                        <DollarSign className="h-8 w-8" />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-500">No expenses recorded</p>
                                                    <p className="text-xs text-gray-400">Add your first expense to track spending.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        expenses.map((ex) => (
                                            <TableRow key={ex.id} className="hover:bg-gray-50/80 transition-colors border-gray-50">
                                                <TableCell className="font-medium text-sm text-gray-900 pl-6 py-4 whitespace-nowrap">{ex.description}</TableCell>
                                                <TableCell className="py-4">
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-white border-gray-200 text-gray-600 px-2 py-0.5 whitespace-nowrap shadow-sm">
                                                        {ex.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500 py-4 whitespace-nowrap">{new Date(ex.date).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-sm text-gray-500 py-4 whitespace-nowrap">{ex.createdBy}</TableCell>
                                                <TableCell className="text-right font-mono text-sm text-rose-600 font-bold pr-6 py-4 whitespace-nowrap">-₹{ex.amount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
