"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";
import { membersApi, paymentsApi, plansApi, ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { Member, MembershipPlan, PaymentMethod } from "@/lib/types";

export default function MemberMembershipPage() {
  const router = useRouter();
  const params = useParams<{ memberId: string }>();
  const memberId = params?.memberId;
  const toast = useToast();

  const { user } = useAuth();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  const [member, setMember] = useState<Member | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [memberError, setMemberError] = useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [saving, setSaving] = useState(false);

  const getPlanCycle = (durationDays: number): "Monthly" | "Quarterly" | "Yearly" => {
    if (durationDays <= 31) return "Monthly";
    if (durationDays <= 120) return "Quarterly";
    return "Yearly";
  };

  const getCycleShort = (cycle: "Monthly" | "Quarterly" | "Yearly") => {
    if (cycle === "Monthly") return "mo";
    if (cycle === "Quarterly") return "quarter";
    return "year";
  };

  useEffect(() => {
    const fetchPlans = async () => {
      setPlansLoading(true);
      setPlansError(null);
      try {
        const result = await plansApi.getMembershipPlans();
        setPlans(result.data || []);
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Failed to load membership plans";
        setPlansError(message);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchMember = async () => {
      if (!memberId) {
        setMember(null);
        setMemberLoading(false);
        setMemberError("Member id is missing");
        return;
      }

      setMemberLoading(true);
      setMemberError(null);
      try {
        const m = await membersApi.get(memberId);
        setMember(m);
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Failed to load member";
        setMemberError(message);
        setMember(null);
      } finally {
        setMemberLoading(false);
      }
    };

    fetchMember();
  }, [memberId]);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);

  useEffect(() => {
    if (!selectedPlan) return;
    setAmount((prev) => (prev ? prev : String(selectedPlan.price)));
  }, [selectedPlan]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!memberId || !member) {
      toast({ title: "Error", description: "Member not loaded", variant: "destructive" });
      return;
    }

    if (!selectedPlanId) {
      toast({ title: "Select a plan", description: "Please select a membership plan", variant: "destructive" });
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const branchIdToUse = member.branchId || user?.branchId;
    if (!branchIdToUse) {
      toast({ title: "Error", description: "Branch not assigned", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await paymentsApi.create({
        memberId,
        branchId: branchIdToUse,
        planId: selectedPlanId,
        amount: parsedAmount,
        method,
        description: selectedPlan ? `${selectedPlan.name} - ${selectedPlan.durationDays} days` : undefined,
      });

      toast({
        title: "Membership updated",
        description: "Payment recorded and membership renewed",
        variant: "success",
      });

      router.push("/branch/members");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to record payment";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [amount, member, memberId, method, router, selectedPlan, selectedPlanId, toast, user?.branchId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assign Membership</h2>
          <p className="text-muted-foreground mt-1">
            Renew or start a new membership for this member.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => router.back()} className="w-full sm:w-auto">
          Back
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-t-4 border-t-primary/20">
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
            <CardDescription>Basic details of the member you are assigning a plan to.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Member ID:</span> {memberId ?? "—"}
            </p>
            <p>
              <span className="font-semibold">Name:</span> {memberLoading ? "Loading..." : member?.name ?? "—"}
            </p>
            <p>
              <span className="font-semibold">Contact:</span> {memberLoading ? "" : member?.phone ?? "—"}
            </p>
            {memberError ? <p className="text-xs text-red-500">{memberError}</p> : null}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-t-4 border-t-primary/20">
            <CardHeader>
              <CardTitle>Select Membership</CardTitle>
              <CardDescription>Pick a plan from your configured catalog.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Membership plan</Label>
                {plansError && <p className="text-xs text-red-500">{plansError}</p>}
                <select
                  id="plan"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  <option value="">Select plan</option>
                  {plansLoading ? (
                    <option disabled>Loading plans...</option>
                  ) : (
                    plans.map((plan) => {
                      const cycle = getPlanCycle(plan.durationDays);
                      const cycleShort = getCycleShort(cycle);
                      return (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} (₹{plan.price.toLocaleString()} / {cycleShort})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={1}
                    placeholder={selectedPlan ? String(selectedPlan.price) : "2499"}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode">Payment mode</Label>
                  <select
                    id="mode"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank transfer</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto order-2 sm:order-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || memberLoading || plansLoading} className="w-full sm:w-auto order-1 sm:order-2 shadow-md shadow-primary/20">
              {saving ? "Saving..." : "Start Membership"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
