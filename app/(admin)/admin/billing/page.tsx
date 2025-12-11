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
import { paymentsApi, ApiError } from "@/lib/api/client";
import type { Payment } from "@/lib/types";

type PlanStatus = "Active" | "Draft";

type Plan = {
    id: string;
    name: string;
    description: string;
    monthlyPrice: string;
    yearlyPrice: string;
    status: PlanStatus;
    features: string[];
    popular?: boolean;
    isCustom?: boolean;
};

interface PlanCardProps {
    plan: Plan;
    billingCycle: "monthly" | "yearly";
    onEditClick?: () => void;
    onToggleStatus?: () => void;
}

function PlanCard({ plan, billingCycle, onEditClick, onToggleStatus }: PlanCardProps) {
    const isYearly = billingCycle === "yearly";
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const isPopular = Boolean(plan.popular);

    const baseClasses = isPopular
        ? "border-2 border-primary shadow-lg scale-105 relative"
        : "border-2 border-muted hover:border-primary/50 transition-all";

    const cardClasses = plan.isCustom
        ? "border-2 border-dashed hover:border-primary/50 transition-all"
        : baseClasses;

    return (
        <Card className={cardClasses}>
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    POPULAR
                </div>
            )}
            <CardHeader>
                <CardTitle className={isPopular ? "text-xl text-primary" : "text-xl"}>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <span className="text-4xl font-bold">₹{price}</span>
                        <span className="text-muted-foreground">{isYearly ? "/year" : "/month"}</span>
                    </div>
                    <Badge
                        variant={plan.status === "Active" ? "success" : "outline"}
                        className="text-xs"
                    >
                        {plan.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3 text-sm">
                    {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                            <Check className="mr-2 h-4 w-4 text-green-500" /> {feature}
                        </li>
                    ))}
                </ul>
                {plan.isCustom && (
                    <p className="mt-3 text-xs text-muted-foreground">
                        {plan.status === "Active"
                            ? "Custom plan is active for branches (mock-only billing)."
                            : "Draft custom plan is not visible to branches yet (mock)."}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-6">
                    {plan.isCustom && onToggleStatus && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs px-3"
                            onClick={onToggleStatus}
                        >
                            {plan.status === "Active" ? "Mark Draft" : "Mark Active"}
                        </Button>
                    )}
                    {plan.isCustom && onEditClick && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={onEditClick}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function SaaSPlansPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [customPlans, setCustomPlans] = useState<Plan[]>([]);
    const [planForm, setPlanForm] = useState({
        name: "",
        description: "",
        monthlyPrice: "",
        yearlyPrice: "",
    });
    const [formErrors, setFormErrors] = useState<{ name?: string; monthlyPrice?: string }>({});
    const toast = useToast();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [paymentSummary, setPaymentSummary] = useState<{
        totalAmount: number;
        completedCount: number;
        pendingCount: number;
    } | null>(null);
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [paymentsError, setPaymentsError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [periodFilter, setPeriodFilter] = useState<"all" | "this_month">("all");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [totalPages, setTotalPages] = useState(1);

    const resetPlanForm = () => {
        setPlanForm({ name: "", description: "", monthlyPrice: "", yearlyPrice: "" });
        setFormErrors({});
    };

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

    const handleCreatePlan = () => {
        const errors: { name?: string; monthlyPrice?: string } = {};

        if (!planForm.name.trim()) {
            errors.name = "Plan name is required.";
        }

        if (planForm.monthlyPrice && isNaN(Number(planForm.monthlyPrice))) {
            errors.monthlyPrice = "Enter a valid number.";
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

        const newId = `PLAN-${customPlans.length + 1}`;
        const monthlyPrice = planForm.monthlyPrice.trim() || "0";
        const yearlyPrice = planForm.yearlyPrice.trim() || monthlyPrice;

        const newPlan: Plan = {
            id: newId,
            name: planForm.name.trim(),
            description: planForm.description.trim() || "Custom plan created by Super Admin",
            monthlyPrice,
            yearlyPrice,
            status: "Draft",
            features: ["Custom plan managed by Super Admin"],
            popular: false,
            isCustom: true,
        };

        setCustomPlans([...customPlans, newPlan]);

        setIsCreateDialogOpen(false);
        resetPlanForm();
        toast({
            title: "Custom plan created",
            description: `${newPlan.name} has been added to your SaaS catalog (mock).`,
            variant: "success",
        });
    };

    const handleToggleStatus = (id: string) => {
        setCustomPlans((prev) =>
            prev.map((plan) =>
                plan.id === id
                    ? { ...plan, status: plan.status === "Active" ? "Draft" : "Active" }
                    : plan
            )
        );
        const updated = customPlans.find((p) => p.id === id);
        toast({
            title: "Plan status updated",
            description: `Custom plan has been marked as ${updated?.status === "Active" ? "Draft" : "Active"} (mock).`,
            variant: "info",
        });
    };

    const handleDeleteCustomPlan = (id: string) => {
        if (typeof window !== "undefined") {
            const confirmed = window.confirm("Delete this custom plan? This only affects the mock UI.");
            if (!confirmed) return;
        }
        setCustomPlans((prev) => prev.filter((plan) => plan.id !== id));
        toast({
            title: "Custom plan deleted",
            description: "Plan removed from the list (mock only, no backend call).",
            variant: "destructive",
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Billing & Plans</h2>
                <p className="text-muted-foreground">Manage subscription tiers for your gym branches.</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Prices shown are per branch, exclusive of taxes.</span>
                <div className="inline-flex items-center rounded-full bg-muted p-1">
                    <button
                        type="button"
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            billingCycle === "monthly"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground"
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillingCycle("yearly")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            billingCycle === "yearly"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground"
                        }`}
                    >
                        Yearly (2 months free)
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border border-dashed">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active branches</CardTitle>
                        <CardDescription className="text-2xl font-bold text-foreground">24</CardDescription>
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
                        <h3 className="text-sm font-semibold text-muted-foreground">Custom plans</h3>
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
                                        Define a custom SaaS plan for your gym branches. This is front-end only for now.
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
                                            <Label htmlFor="plan-monthly">Monthly price (₹)</Label>
                                            <Input
                                                id="plan-monthly"
                                                placeholder="e.g. 1999"
                                                value={planForm.monthlyPrice}
                                                onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: e.target.value })}
                                            />
                                            {formErrors.monthlyPrice && (
                                                <p className="text-xs text-red-500">{formErrors.monthlyPrice}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="plan-yearly">Yearly price (₹)</Label>
                                            <Input
                                                id="plan-yearly"
                                                placeholder="Optional"
                                                value={planForm.yearlyPrice}
                                                onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: e.target.value })}
                                            />
                                        </div>
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

                    {customPlans.length === 0 ? (
                        <Card className="border-dashed border-muted-foreground/40">
                            <CardContent className="py-8 flex flex-col items-center justify-center text-center space-y-3 text-xs text-muted-foreground">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-1">
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">No custom plans yet</p>
                                    <p>
                                        Use a custom plan for enterprise or corporate deals without changing your default tiers.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setIsCreateDialogOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create your first custom plan
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-3">
                            {customPlans.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    billingCycle={billingCycle}
                                    onToggleStatus={() => handleToggleStatus(plan.id)}
                                    onEditClick={() => handleDeleteCustomPlan(plan.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
                            onClick={() =>
                                toast({
                                    title: "Export CSV",
                                    description: "Invoice export is mock-only in this demo.",
                                    variant: "info",
                                })
                            }
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
