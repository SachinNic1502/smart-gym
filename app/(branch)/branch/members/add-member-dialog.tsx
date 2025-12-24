"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, membersApi, paymentsApi, plansApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { MembershipPlan, PaymentMethod } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AddMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function AddMemberDialog({ open, onOpenChange, onSuccess }: AddMemberDialogProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const branchId = user?.branchId;

    const [loadingPlans, setLoadingPlans] = useState(false);
    const [plans, setPlans] = useState<MembershipPlan[]>([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        address: "",
        group: "",
        referralSource: "",
        notes: "",
        planId: "",
    });

    const [collectPaymentNow, setCollectPaymentNow] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [paymentDescription, setPaymentDescription] = useState<string>("");

    const selectedPlan = useMemo(() => {
        if (!form.planId) return null;
        return plans.find((p) => p.id === form.planId) ?? null;
    }, [form.planId, plans]);

    useEffect(() => {
        if (!selectedPlan) return;
        setPaymentAmount((prev) => (prev ? prev : String(selectedPlan.price)));
        setPaymentDescription((prev) => (prev ? prev : `${selectedPlan.name} - ${selectedPlan.durationDays} days`));
    }, [selectedPlan]);

    useEffect(() => {
        if (open) {
            const fetchPlans = async () => {
                setLoadingPlans(true);
                try {
                    const res = await plansApi.getMembershipPlans();
                    setPlans(res.data);
                } catch {
                    setPlans([]);
                } finally {
                    setLoadingPlans(false);
                }
            };
            fetchPlans();
        }
    }, [open]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setForm({
                name: "",
                phone: "",
                email: "",
                dateOfBirth: "",
                address: "",
                group: "",
                referralSource: "",
                notes: "",
                planId: "",
            });
            setCollectPaymentNow(true);
            setPaymentMethod("cash");
            setPaymentAmount("");
            setPaymentDescription("");
            setError(null);
        }
    }, [open]);

    const handleSubmit = async () => {
        setSaving(true);
        setError(null);
        try {
            const createdMember = await membersApi.create({
                name: form.name,
                phone: form.phone,
                email: form.email,
                dateOfBirth: form.dateOfBirth || undefined,
                address: form.address || undefined,
                referralSource: form.referralSource || undefined,
                notes: form.notes || undefined,
                branchId: branchId,
                planId: form.planId || undefined,
            });

            if (collectPaymentNow) {
                if (!selectedPlan) {
                    throw new ApiError("Please select a membership plan to record payment", 400);
                }

                const amount = Number(paymentAmount);
                if (!Number.isFinite(amount) || amount <= 0) {
                    throw new ApiError("Please enter a valid payment amount", 400);
                }

                if (!branchId) {
                    throw new ApiError("Branch not assigned", 400);
                }

                await paymentsApi.create({
                    memberId: createdMember.id,
                    branchId,
                    planId: selectedPlan.id,
                    amount,
                    method: paymentMethod,
                    description: paymentDescription || undefined,
                    skipMemberUpdate: true,
                });
            }

            toast({
                title: "Member created",
                description: collectPaymentNow
                    ? "Member created and payment recorded"
                    : selectedPlan
                        ? `Assigned plan: ${selectedPlan.name}`
                        : "Member created successfully",
                variant: "success",
            });

            onOpenChange(false);
            onSuccess?.();
        } catch (e) {
            const message = e instanceof ApiError ? e.message : "Failed to create member";
            setError(message);
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[800px] h-[90vh] sm:h-auto overflow-y-auto sm:overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-2 bg-slate-50/50 border-b">
                    <DialogTitle>Add New Member</DialogTitle>
                    <DialogDescription>
                        Create a new member profile and optionally record their first payment.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm border-b pb-2">Personal Information</h4>
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Full name"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone *</Label>
                                <Input
                                    id="phone"
                                    placeholder="Mobile number"
                                    value={form.phone}
                                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Optional email"
                                    value={form.email}
                                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={form.dateOfBirth}
                                    onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Membership & Payment */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm border-b pb-2">Membership & Payment</h4>
                            <div className="space-y-2">
                                <Label htmlFor="plan">Membership plan</Label>
                                <select
                                    id="plan"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                    value={form.planId}
                                    onChange={(e) => setForm((prev) => ({ ...prev, planId: e.target.value }))}
                                >
                                    <option value="">Standard (default)</option>
                                    {loadingPlans ? (
                                        <option value="" disabled>Loading plans...</option>
                                    ) : (
                                        plans.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} • {p.durationDays} days • ₹{p.price}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 border p-3 rounded-md bg-slate-50">
                                <input
                                    type="checkbox"
                                    id="collectPayment"
                                    checked={collectPaymentNow}
                                    onChange={(e) => setCollectPaymentNow(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor="collectPayment" className="flex-1 cursor-pointer">Record payment now</Label>
                            </div>

                            {collectPaymentNow && (
                                <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="pay-method" className="text-xs">Method</Label>
                                            <select
                                                id="pay-method"
                                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="upi">UPI</option>
                                                <option value="card">Card</option>
                                                <option value="bank_transfer">Bank transfer</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="pay-amount" className="text-xs">Amount</Label>
                                            <Input
                                                id="pay-amount"
                                                type="number"
                                                className="h-8 text-xs"
                                                placeholder={selectedPlan ? String(selectedPlan.price) : "0"}
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="pay-desc" className="text-xs">Description</Label>
                                        <Input
                                            id="pay-desc"
                                            className="h-8 text-xs"
                                            placeholder="e.g. Gold Plan Subscription"
                                            value={paymentDescription}
                                            onChange={(e) => setPaymentDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Other Info */}
                        <div className="space-y-4 md:col-span-2">
                            <h4 className="font-semibold text-sm border-b pb-2">Additional Information</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        placeholder="Street, city"
                                        value={form.address}
                                        onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="referral">Referral Source</Label>
                                    <Input
                                        id="referral"
                                        placeholder="e.g. Instagram, Friend"
                                        value={form.referralSource}
                                        onChange={(e) => setForm((prev) => ({ ...prev, referralSource: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Input
                                        id="notes"
                                        placeholder="Any special notes"
                                        value={form.notes}
                                        onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-slate-50/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving || !form.name.trim() || !form.phone.trim()}>
                        {saving ? "Creating..." : "Create Member"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
