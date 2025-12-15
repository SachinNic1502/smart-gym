"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, membersApi, paymentsApi, plansApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { MembershipPlan, PaymentMethod } from "@/lib/types";

export default function BranchAddMemberPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

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

  const didInitFromQuery = useRef(false);

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
    if (didInitFromQuery.current) return;

    const qpPlanId = searchParams.get("planId");
    const qpPayNow = searchParams.get("payNow");
    const qpAmount = searchParams.get("amount");
    const qpMethod = searchParams.get("method");
    const qpDescription = searchParams.get("description");

    if (qpPlanId) {
      setForm((prev) => ({ ...prev, planId: qpPlanId }));
    }

    if (qpPayNow === "1" || qpPayNow === "true") {
      setCollectPaymentNow(true);
    }

    if (qpAmount) {
      setPaymentAmount(qpAmount);
    }

    if (qpMethod && ["cash", "upi", "card", "bank_transfer"].includes(qpMethod)) {
      setPaymentMethod(qpMethod as PaymentMethod);
    }

    if (qpDescription) {
      setPaymentDescription(qpDescription);
    }

    didInitFromQuery.current = true;
  }, [searchParams]);

  useEffect(() => {
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
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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

      router.push("/branch/members");
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to create member";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add Member</h2>
          <p className="text-muted-foreground">
            Capture personal, contact, and basic profile information for a new branch member.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => router.push("/branch/members")}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <Card className="border-t-4 border-t-primary/20">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Full name"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
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
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="Mobile number"
                required
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
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street, city"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20 md:col-span-2">
          <CardHeader>
            <CardTitle>Membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <option value="" disabled>
                    Loading plans...
                  </option>
                ) : (
                  plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} • {p.durationDays} days • ₹{p.price}
                    </option>
                  ))
                )}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {selectedPlan
                  ? `Selected: ${selectedPlan.name} (${selectedPlan.durationDays} days)`
                  : "If not selected, member will be created with Standard (30 days)."}
              </p>
            </div>

            {selectedPlan ? (
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium">{selectedPlan.name}</p>
                  <p className="text-sm font-semibold">₹{selectedPlan.price}</p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Duration: {selectedPlan.durationDays} days
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-200 md:col-span-2">
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3 rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Record payment now</p>
                <p className="text-[11px] text-muted-foreground">
                  {selectedPlan
                    ? `For ${selectedPlan.name} • ₹${selectedPlan.price}`
                    : "Select a membership plan above to auto-fill pricing."}
                </p>
              </div>
              <input
                type="checkbox"
                checked={collectPaymentNow}
                onChange={(e) => setCollectPaymentNow(e.target.checked)}
              />
            </div>

            {collectPaymentNow ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pay-method">Method</Label>
                  <select
                    id="pay-method"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank transfer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Amount</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    min={1}
                    placeholder={selectedPlan ? String(selectedPlan.price) : "Amount"}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="pay-desc">Description</Label>
                  <Input
                    id="pay-desc"
                    placeholder="e.g. Gold plan - 30 days"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {selectedPlan
                      ? `Default description is based on ${selectedPlan.name}.`
                      : "Select a plan above to avoid missing plan details."}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20 md:col-span-2">
          <CardHeader>
            <CardTitle>Other Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Input
                id="group"
                placeholder="e.g. Morning Batch"
                value={form.group}
                onChange={(e) => setForm((prev) => ({ ...prev, group: e.target.value }))}
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
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Any special notes"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {error ? (
          <div className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/branch/members")}>
            Clear
          </Button>
          <Button type="submit" disabled={saving || !form.name.trim() || !form.phone.trim()}>
            {saving ? "Saving..." : "Save Member"}
          </Button>
        </div>
      </form>
    </div>
  );
}
