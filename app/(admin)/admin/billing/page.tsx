"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Check, Zap, Building2, Plus, DollarSign, Wallet, History, FileText, ArrowRight, TrendingUp, CreditCard, Sparkles, Filter, MoreVertical, Pencil, Trash2, Power } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { paymentsApi, adminPlansApi, branchesApi, ApiError } from "@/lib/api/client";
import type { MembershipPlan, Payment } from "@/lib/types";

export default function SaaSPlansPage() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

    const [plans, setPlans] = useState<MembershipPlan[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [plansError, setPlansError] = useState<string | null>(null);

    const [planForm, setPlanForm] = useState({
        name: "",
        description: "",
        durationDays: "30",
        price: "0",
        currency: "INR",
        isActive: true,
        featuresText: "",
    });
    const [formErrors, setFormErrors] = useState<{ name?: string; durationDays?: string; price?: string }>({});
    const { toast } = useToast();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [paymentSummary, setPaymentSummary] = useState<{
        totalAmount: number;
        completedCount: number;
        pendingCount: number;
    } | null>(null);
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [paymentsError, setPaymentsError] = useState<string | null>(null);
    const [activeBranchesCount, setActiveBranchesCount] = useState<number>(0);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [periodFilter, setPeriodFilter] = useState<"all" | "this_month">("all");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [totalPages, setTotalPages] = useState(1);

    const resetPlanForm = () => {
        setPlanForm({
            name: "",
            description: "",
            durationDays: "30",
            price: "0",
            currency: "INR",
            isActive: true,
            featuresText: "",
        });
        setFormErrors({});
    };

    const parseFeatures = (raw: string) =>
        raw
            .split(/\r?\n|,/g)
            .map((s) => s.trim())
            .filter(Boolean);

    const refreshPlans = async () => {
        setPlansLoading(true);
        setPlansError(null);
        try {
            const result = await adminPlansApi.list();
            setPlans(result.data || []);
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to load plans";
            setPlansError(message);
        } finally {
            setPlansLoading(false);
        }
    };

    useEffect(() => {
        refreshPlans();
    }, []);

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const result = await branchesApi.list();
                const active = (result.data || []).filter((b) => b.status === "active").length;
                setActiveBranchesCount(active);
            } catch {
                setActiveBranchesCount(0);
            }
        };

        loadBranches();
    }, []);

    useEffect(() => {
        const fetchPayments = async () => {
            setPaymentsLoading(true);
            setPaymentsError(null);
            try {
                const params: Record<string, string> = {
                    page: String(page),
                    pageSize: String(pageSize),
                };

                if (statusFilter !== "all") {
                    params.status = statusFilter;
                }

                if (periodFilter === "this_month") {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    params.startDate = start.toISOString();
                    params.endDate = end.toISOString();
                }

                const result = await paymentsApi.list(params);
                setPayments(result.data);
                setPaymentSummary(result.summary);
                setTotalPages(result.totalPages);
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "Failed to load invoices";
                setPaymentsError(message);
            } finally {
                setPaymentsLoading(false);
            }
        };

        fetchPayments();
    }, [statusFilter, periodFilter, page, pageSize]);

    const handleCreatePlan = async () => {
        const errors: { name?: string; durationDays?: string; price?: string } = {};

        if (!planForm.name.trim()) {
            errors.name = "Plan name is required.";
        }

        const durationDays = Number(planForm.durationDays);
        if (!Number.isFinite(durationDays) || durationDays <= 0) {
            errors.durationDays = "Enter valid duration days.";
        }

        const price = Number(planForm.price);
        if (!Number.isFinite(price) || price < 0) {
            errors.price = "Enter valid price.";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast({
                title: "Missing details",
                description: "Please fix the highlighted fields before saving the plan.",
                variant: "warning",
            });
            return;
        }

        setFormErrors({});

        try {
            await adminPlansApi.create({
                name: planForm.name.trim(),
                description: planForm.description.trim() || "Membership plan",
                durationDays,
                price,
                currency: planForm.currency || "INR",
                isActive: planForm.isActive,
                features: parseFeatures(planForm.featuresText),
            });
            setIsCreateDialogOpen(false);
            resetPlanForm();
            await refreshPlans();
            toast({
                title: "Plan created",
                description: "New membership plan has been saved.",
                variant: "success",
            });
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to create plan";
            toast({ title: message, variant: "destructive" });
        }
    };

    const openEditPlan = (plan: MembershipPlan) => {
        setEditingPlan(plan);
        setPlanForm({
            name: plan.name,
            description: plan.description,
            durationDays: String(plan.durationDays),
            price: String(plan.price),
            currency: plan.currency,
            isActive: plan.isActive,
            featuresText: (plan.features || []).join("\n"),
        });
        setFormErrors({});
        setIsEditDialogOpen(true);
    };

    const handleUpdatePlan = async () => {
        if (!editingPlan) return;

        const durationDays = Number(planForm.durationDays);
        const price = Number(planForm.price);

        try {
            await adminPlansApi.update(editingPlan.id, {
                name: planForm.name.trim(),
                description: planForm.description.trim(),
                durationDays,
                price,
                currency: planForm.currency || "INR",
                isActive: planForm.isActive,
                features: parseFeatures(planForm.featuresText),
            });
            setIsEditDialogOpen(false);
            setEditingPlan(null);
            resetPlanForm();
            await refreshPlans();
            toast({ title: "Plan updated", variant: "success" });
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to update plan";
            toast({ title: message, variant: "destructive" });
        }
    };

    const handleToggleActive = async (plan: MembershipPlan) => {
        try {
            await adminPlansApi.update(plan.id, { isActive: !plan.isActive });
            await refreshPlans();
            toast({ title: "Plan status updated", variant: "success" });
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to update plan";
            toast({ title: message, variant: "destructive" });
        }
    };

    const handleDeletePlan = async (plan: MembershipPlan) => {
        toast({
            title: "Delete Plan?",
            description: `Delete plan "${plan.name}"? This cannot be undone.`,
            variant: "warning",
            duration: Infinity,
            action: ({ dismiss }) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-xs hover:bg-amber-100 text-amber-900" onClick={dismiss}>Cancel</Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={async () => {
                            dismiss();
                            try {
                                await adminPlansApi.delete(plan.id);
                                await refreshPlans();
                                toast({ title: "Plan deleted", variant: "success" });
                            } catch (error) {
                                const message = error instanceof ApiError ? error.message : "Failed to delete plan";
                                toast({ title: message, variant: "destructive" });
                            }
                        }}
                    >
                        Confirm
                    </Button>
                </div>
            )
        });
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-10 rounded-[2.5rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-12 -translate-y-12">
                    <CreditCard className="w-80 h-80" />
                </div>
                <div className="relative z-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Wallet className="h-7 w-7 text-white" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">Billing & Plans</h2>
                        </div>
                        <p className="text-emerald-50 text-xl font-light max-w-2xl leading-relaxed">
                            Manage subscription plans and monitor payments from all gym branches.
                        </p>
                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-300" />
                                <span className="text-sm font-black uppercase tracking-widest text-emerald-200">System Online</span>
                            </div>
                        </div>
                    </div>

                    <Dialog
                        open={isCreateDialogOpen}
                        onOpenChange={(open) => {
                            setIsCreateDialogOpen(open);
                            if (!open) resetPlanForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-black px-8 py-8 rounded-[2rem] shadow-2xl transition-all hover:scale-105 active:scale-95 text-lg">
                                <Plus className="mr-2 h-6 w-6" />
                                Create Plan
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Create Membership Plan</DialogTitle>
                                <DialogDescription className="font-semibold text-gray-400">
                                    Add a new subscription plan for your branches.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold ml-1">Plan Name</Label>
                                    <Input
                                        placeholder="e.g. Enterprise Elite"
                                        className="h-12 rounded-2xl"
                                        value={planForm.name}
                                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                    />
                                    {formErrors.name && (
                                        <p className="text-xs text-red-500 font-bold ml-1">{formErrors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold ml-1">Description</Label>
                                    <Input
                                        placeholder="High-volume branch solution"
                                        className="h-12 rounded-2xl"
                                        value={planForm.description}
                                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold ml-1">Duration (Days)</Label>
                                        <Input
                                            type="number"
                                            className="h-12 rounded-2xl"
                                            value={planForm.durationDays}
                                            onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold ml-1">Price (₹)</Label>
                                        <Input
                                            type="number"
                                            className="h-12 rounded-2xl"
                                            value={planForm.price}
                                            onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold ml-1">Features (One per line)</Label>
                                    <textarea
                                        className="min-h-[120px] w-full rounded-2xl border-gray-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Dynamic Billing\nAdvanced Analytics\nFull API Access"
                                        value={planForm.featuresText}
                                        onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="gap-3">
                                <Button variant="ghost" className="h-12 rounded-2xl font-bold" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black px-10 shadow-lg shadow-emerald-100" onClick={handleCreatePlan}>
                                    Create Plan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-3 px-1">
                <Card className="border-0 shadow-xl bg-white group hover:shadow-2xl transition-all rounded-[1.5rem] overflow-hidden">
                    <CardHeader className="p-8 flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Total Revenue</p>
                            <CardTitle className="text-4xl font-black text-gray-800 tracking-tighter">₹{paymentSummary ? paymentSummary.totalAmount.toLocaleString() : 0}</CardTitle>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <TrendingUp className="h-7 w-7" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <p className="text-xs font-bold text-gray-400">Total amount from completed payments</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-xl bg-white group hover:shadow-2xl transition-all rounded-[1.5rem] overflow-hidden">
                    <CardHeader className="p-8 flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Active Branches</p>
                            <CardTitle className="text-4xl font-black text-gray-800 tracking-tighter">{activeBranchesCount}</CardTitle>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <Building2 className="h-7 w-7" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <p className="text-xs font-bold text-gray-400">Total number of active gym branches</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-xl bg-white group hover:shadow-2xl transition-all rounded-[1.5rem] overflow-hidden border-b-4 border-amber-400">
                    <CardHeader className="p-8 flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Pending Payments</p>
                            <CardTitle className="text-4xl font-black text-gray-800 tracking-tighter">{paymentSummary ? paymentSummary.pendingCount : 0}</CardTitle>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <Zap className="h-7 w-7" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <p className="text-xs font-bold text-gray-400">Payments waiting for approval</p>
                    </CardContent>
                </Card>
            </div>

            {/* Plans Section */}
            <div className="space-y-6">
                <div className="px-2 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Subscription Plans</h3>
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mt-1">Manage the plans available for branches</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {plansLoading ? (
                        [1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-gray-50 border-0 rounded-3xl" />)
                    ) : plans.length === 0 ? (
                        <Card className="md:col-span-3 border-4 border-dashed border-gray-100 rounded-[2.5rem] py-20 flex flex-col items-center gap-6">
                            <div className="p-6 bg-slate-50 rounded-3xl opacity-30">
                                <Sparkles className="h-16 w-16" />
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-gray-400 uppercase tracking-widest">No Plans Found</p>
                                <p className="font-bold text-gray-300 mt-2 italic">Create a plan to start onboarding branches</p>
                            </div>
                            <Button size="lg" className="rounded-2xl" onClick={() => setIsCreateDialogOpen(true)}>
                                Create First Plan
                            </Button>
                        </Card>
                    ) : (
                        plans.map((p, idx) => (
                            <Card key={p.id} className={`group relative border-0 shadow-xl rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all ${p.isActive ? 'bg-white' : 'bg-slate-50 opacity-80'}`}>
                                <div className={`h-2 w-full ${idx % 2 === 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                <CardHeader className="p-8">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <Badge className={`mb-3 px-3 py-1 text-[9px] font-black uppercase tracking-widest border-0 rounded-lg ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                                {p.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">{p.name}</CardTitle>
                                            <CardDescription className="text-xs font-bold text-gray-400 mt-2 leading-relaxed">
                                                {p.description || 'No description provided'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="mt-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-bold text-gray-400">₹</span>
                                            <span className="text-5xl font-black text-gray-900 tracking-tighter">{p.price.toLocaleString()}</span>
                                            <span className="text-xs font-black text-gray-400 uppercase ml-2">/ {p.durationDays} Days</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 pt-0">
                                    <div className="space-y-4 mb-8">
                                        {(p.features || []).slice(0, 5).map(f => (
                                            <div key={f} className="flex items-center gap-3">
                                                <div className="p-1 bg-emerald-50 rounded-full text-emerald-600">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-gray-600 hover:bg-slate-100" onClick={() => openEditPlan(p)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-gray-600 hover:bg-slate-100" onClick={() => handleToggleActive(p)}>
                                            <Power className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100" onClick={() => handleDeletePlan(p)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button className="h-10 flex-1 rounded-xl bg-slate-900 font-bold text-[10px] uppercase tracking-widest text-white hover:bg-black">
                                            View Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Payment History */}
            <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden mx-1">
                <CardHeader className="bg-white border-b border-gray-100 p-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                            <History className="h-7 w-7" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Payment History</CardTitle>
                            <CardDescription className="font-bold text-gray-400">Recent payments and invoices from all branches</CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-gray-100">
                        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[140px] h-9 rounded-xl border-0 bg-white shadow-sm font-black text-[10px] uppercase tracking-widest">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-0 shadow-2xl">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className={`h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest border-0 shadow-sm ${periodFilter === 'this_month' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-600'}`} onClick={() => { setPeriodFilter("this_month"); setPage(1); }}>
                            This Month
                        </Button>
                        <div className="h-6 w-[1px] bg-gray-200 mx-1" />
                        <Button variant="ghost" size="sm" className="h-9 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900" onClick={() => { setStatusFilter("all"); setPeriodFilter("all"); setPage(1); }}>
                            Reset
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 rounded-xl bg-slate-900 text-white hover:bg-black font-black text-[10px] uppercase tracking-widest px-5 ml-2" onClick={() => {
                            if (payments.length === 0) return;
                            const h = ["Invoice", "Branch", "Amount", "Status", "Date"];
                            const r = payments.map(p => [p.invoiceNumber || p.id, p.memberName, p.amount.toString(), p.status, new Date(p.createdAt).toISOString()]);
                            const csv = [h, ...r].map(row => row.join(",")).join("\n");
                            const b = new Blob([csv], { type: "text/csv" });
                            const u = URL.createObjectURL(b);
                            const a = document.createElement("a");
                            a.href = u; a.download = `payments-${Date.now()}.csv`; a.click();
                            toast({ title: "Payments Exported", variant: "success" });
                        }}>
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {paymentsError && <div className="p-8 text-center text-rose-500 font-bold">{paymentsError}</div>}
                    {paymentsLoading ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading payments...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="p-24 text-center opacity-30 flex flex-col items-center gap-4">
                            <FileText className="h-16 w-16" />
                            <p className="text-xl font-black text-gray-500 uppercase tracking-widest">No payments found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {payments.map((p, i) => (
                                <div key={p.id} className="group p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-2xl flex items-center justify-center ${i % 2 === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-lg font-black text-gray-800 tracking-tight">{p.memberName}</p>
                                                <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-widest text-gray-400 border-gray-200">#{p.invoiceNumber || p.id.slice(0, 8)}</Badge>
                                            </div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                Paid on {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gray-900 tracking-tighter">₹{p.amount.toLocaleString()}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Amount</p>
                                        </div>
                                        <Badge className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border-0 ${p.status === "completed" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                                            {p.status === "completed" ? "COMPLETED" : p.status.toUpperCase()}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight className="h-5 w-5 text-gray-400" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!paymentsLoading && payments.length > 0 && (
                        <div className="p-8 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 rounded-xl px-6 font-black text-[10px] uppercase border-gray-200"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 rounded-xl px-6 font-black text-[10px] uppercase border-gray-200"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
