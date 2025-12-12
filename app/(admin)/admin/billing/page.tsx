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
import { Check, Zap, Building2, Plus } from "lucide-react";
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
    const toast = useToast();

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
                description: "Plan saved to database.",
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
        if (typeof window !== "undefined") {
            const confirmed = window.confirm(`Delete plan "${plan.name}"?`);
            if (!confirmed) return;
        }
        try {
            await adminPlansApi.delete(plan.id);
            await refreshPlans();
            toast({ title: "Plan deleted", variant: "destructive" });
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to delete plan";
            toast({ title: message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Billing & Plans</h2>
                <p className="text-muted-foreground">Manage subscription tiers for your gym branches.</p>
            </div>

            <div className="text-xs text-muted-foreground">
                Prices shown are per branch, exclusive of taxes.
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border border-dashed">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active branches</CardTitle>
                        <CardDescription className="text-2xl font-bold text-foreground">{activeBranchesCount}</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="border border-dashed">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly recurring</CardTitle>
                        <CardDescription className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">
                                ₹{paymentSummary ? paymentSummary.totalAmount.toLocaleString() : 0}
                            </span>
                            <span className="text-xs text-muted-foreground">completed payments total</span>
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="border border-dashed bg-primary/5">
                    <CardHeader className="py-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending invoices</CardTitle>
                            <CardDescription className="text-2xl font-bold text-foreground">
                                {paymentSummary ? paymentSummary.pendingCount : 0}
                            </CardDescription>
                        </div>
                        <Zap className="h-5 w-5 text-primary" />
                    </CardHeader>
                </Card>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Membership plans</h3>
                        <Dialog
                            open={isCreateDialogOpen}
                            onOpenChange={(open) => {
                                setIsCreateDialogOpen(open);
                                if (!open) {
                                    resetPlanForm();
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Plan
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[480px]">
                                <DialogHeader>
                                    <DialogTitle>Create Plan</DialogTitle>
                                    <DialogDescription>
                                        Create a membership plan. This will be saved in the database.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="plan-name">
                                            Plan name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="plan-name"
                                            placeholder="e.g. Corporate"
                                            value={planForm.name}
                                            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                        />
                                        {formErrors.name && (
                                            <p className="text-xs text-red-500">{formErrors.name}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="plan-description">Short description</Label>
                                        <Input
                                            id="plan-description"
                                            placeholder="How this plan is used"
                                            value={planForm.description}
                                            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="plan-duration">Duration (days) *</Label>
                                            <Input
                                                id="plan-duration"
                                                type="number"
                                                min={1}
                                                value={planForm.durationDays}
                                                onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
                                            />
                                            {formErrors.durationDays && (
                                                <p className="text-xs text-red-500">{formErrors.durationDays}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="plan-price">Price (₹) *</Label>
                                            <Input
                                                id="plan-price"
                                                type="number"
                                                min={0}
                                                value={planForm.price}
                                                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                                            />
                                            {formErrors.price && (
                                                <p className="text-xs text-red-500">{formErrors.price}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="plan-currency">Currency</Label>
                                            <Input
                                                id="plan-currency"
                                                placeholder="INR"
                                                value={planForm.currency}
                                                onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="plan-active">Status</Label>
                                            <select
                                                id="plan-active"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={planForm.isActive ? "active" : "inactive"}
                                                onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.value === "active" })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="plan-features">Features (one per line)</Label>
                                        <textarea
                                            id="plan-features"
                                            className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="Gym access\nGroup classes\nLocker"
                                            value={planForm.featuresText}
                                            onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsCreateDialogOpen(false);
                                            resetPlanForm();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreatePlan}
                                        disabled={!planForm.name.trim()}
                                    >
                                        Save Plan
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {plansError && <p className="text-xs text-red-500 mb-2">{plansError}</p>}

                    {plansLoading ? (
                        <p className="text-xs text-muted-foreground">Loading plans...</p>
                    ) : plans.length === 0 ? (
                        <Card className="border-dashed border-muted-foreground/40">
                            <CardContent className="py-8 flex flex-col items-center justify-center text-center space-y-3 text-xs text-muted-foreground">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-1">
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">No plans yet</p>
                                    <p>Create your first membership plan to start billing.</p>
                                </div>
                                <Button type="button" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create plan
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                            {plans.map((plan) => (
                                <Card key={plan.id} className="border-2 border-muted hover:border-primary/50 transition-all">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <CardTitle className="text-lg">{plan.name}</CardTitle>
                                                <CardDescription>{plan.description}</CardDescription>
                                            </div>
                                            <Badge variant={plan.isActive ? "success" : "outline"} className="text-xs">
                                                {plan.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div>
                                                <span className="text-3xl font-bold">₹{plan.price.toLocaleString()}</span>
                                                <span className="text-muted-foreground">/{plan.durationDays} days</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm">
                                            {(plan.features || []).slice(0, 6).map((feature) => (
                                                <li key={feature} className="flex items-center">
                                                    <Check className="mr-2 h-4 w-4 text-green-500" /> {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button type="button" size="sm" variant="outline" onClick={() => openEditPlan(plan)}>
                                                Edit
                                            </Button>
                                            <Button type="button" size="sm" variant="outline" onClick={() => handleToggleActive(plan)}>
                                                {plan.isActive ? "Disable" : "Enable"}
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleDeletePlan(plan)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setEditingPlan(null);
                        resetPlanForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Edit Plan</DialogTitle>
                        <DialogDescription>Update this plan. Changes are saved in the database.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="edit-plan-name">Plan name</Label>
                            <Input
                                id="edit-plan-name"
                                value={planForm.name}
                                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-plan-description">Short description</Label>
                            <Input
                                id="edit-plan-description"
                                value={planForm.description}
                                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-plan-duration">Duration (days)</Label>
                                <Input
                                    id="edit-plan-duration"
                                    type="number"
                                    min={1}
                                    value={planForm.durationDays}
                                    onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-plan-price">Price (₹)</Label>
                                <Input
                                    id="edit-plan-price"
                                    type="number"
                                    min={0}
                                    value={planForm.price}
                                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-plan-currency">Currency</Label>
                                <Input
                                    id="edit-plan-currency"
                                    value={planForm.currency}
                                    onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-plan-active">Status</Label>
                                <select
                                    id="edit-plan-active"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={planForm.isActive ? "active" : "inactive"}
                                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.value === "active" })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-plan-features">Features</Label>
                            <textarea
                                id="edit-plan-features"
                                className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={planForm.featuresText}
                                onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditDialogOpen(false);
                                setEditingPlan(null);
                                resetPlanForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdatePlan} disabled={!editingPlan}>
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Invoices</CardTitle>
                        <CardDescription>Latest billing history from your branches.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            key={statusFilter}
                            defaultValue={statusFilter}
                            onValueChange={(value) => {
                                setStatusFilter(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[150px] h-8 text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="completed">Paid</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                                setPeriodFilter("this_month");
                                setPage(1);
                            }}
                        >
                            This month
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                                setStatusFilter("all");
                                setPeriodFilter("all");
                                setPage(1);
                            }}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            disabled
                        >
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {paymentsError && (
                        <p className="mb-2 text-xs text-red-500">{paymentsError}</p>
                    )}
                    {paymentsLoading ? (
                        <p className="text-xs text-muted-foreground">Loading invoices...</p>
                    ) : payments.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No invoices found.</p>
                    ) : (
                        <div className="space-y-4">
                            {payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{payment.memberName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Invoice #{payment.invoiceNumber || payment.id} •
                                                {" "}
                                                {new Date(payment.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold">₹{payment.amount.toLocaleString()}</span>
                                        <Badge
                                            variant={payment.status === "completed" ? "success" : "destructive"}
                                        >
                                            {payment.status === "completed"
                                                ? "Paid"
                                                : payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!paymentsLoading && payments.length > 0 && (
                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
