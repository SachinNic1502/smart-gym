"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, TrendingDown, Calendar, RefreshCcw } from "lucide-react";
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
    const toast = useToast();
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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Expenses</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Track your branch spending and overheads.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadExpenses}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
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
                                        onChange={(e) => setForm({...form, description: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Amount (₹)</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="0.00"
                                            value={form.amount}
                                            onChange={(e) => setForm({...form, amount: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <select 
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={form.category}
                                            onChange={(e) => setForm({...form, category: e.target.value as ExpenseCategory})}
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
                                        onChange={(e) => setForm({...form, date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={saving}>
                                    {saving ? "Saving..." : "Save Expense"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Expenses</CardTitle>
                        <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">{loading ? "—" : `₹${totalExpenses.toLocaleString()}`}</div>
                        <p className="text-xs text-muted-foreground mt-1">Recorded this month</p>
                    </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Largest Category</CardTitle>
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                            <TrendingDown className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight capitalize">{loading ? "—" : largestCategory.category}</div>
                        <p className="text-xs text-muted-foreground mt-1">₹{largestCategory.amount.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-3 border-b bg-zinc-50/50">
                    <CardTitle className="text-lg">Expense History</CardTitle>
                    <CardDescription className="text-xs">Recent transactions and bills.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-zinc-50/50">
                                <TableHead className="pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recorded By</TableHead>
                                <TableHead className="text-right pr-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                                        Loading expenses...
                                    </TableCell>
                                </TableRow>
                            ) : expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 rounded-full bg-muted/20">
                                                <DollarSign className="h-6 w-6 text-muted-foreground/50" />
                                            </div>
                                            <p className="text-sm font-medium">No expenses recorded</p>
                                            <p className="text-xs text-muted-foreground">Add your first expense to track spending.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((ex) => (
                                    <TableRow key={ex.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <TableCell className="font-medium text-sm text-foreground pl-6 py-3">{ex.description}</TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant="outline" className="text-[10px] font-medium bg-zinc-50 capitalize">
                                                {ex.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground py-3">{new Date(ex.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground py-3">{ex.createdBy}</TableCell>
                                        <TableCell className="text-right font-mono text-sm text-red-600 font-medium pr-6 py-3">-₹{ex.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
