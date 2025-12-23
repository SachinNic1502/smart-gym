"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  Gift,
  ArrowRight
} from "lucide-react";
import { ApiError, meApi, plansApi, paymentsApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast-provider";
import type { Member, MembershipPlan, Payment } from "@/lib/types";

interface RenewalOption {
  plan: MembershipPlan;
  discount?: number;
  bonusDays?: number;
  popular?: boolean;
}

export default function MemberRenewalPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Member | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<RenewalOption[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<RenewalOption | null>(null);
  const [renewalDialog, setRenewalDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch profile
      const profileRes = await meApi.getProfile();
      setProfile(profileRes);

      // Fetch current plan if member has one
      if (profileRes?.plan) {
        const plansRes = await plansApi.getMembershipPlans();
        const currentPlan = plansRes.data.find(plan => plan.name === profileRes.plan);
        setCurrentPlan(currentPlan || null);
      }

      // Fetch available plans for renewal
      const plansRes = await plansApi.getMembershipPlans();
      const renewalOptions: RenewalOption[] = plansRes.data.map(plan => ({
        plan,
        discount: plan.name === profileRes?.plan ? 10 : 0, // 10% loyalty discount
        bonusDays: plan.durationDays === 365 ? 30 : 0, // 30 bonus days for annual plans
        popular: plan.name.toLowerCase().includes("premium")
      }));
      setAvailablePlans(renewalOptions);

      // Fetch payment history
      if (profileRes?.id) {
        try {
          const paymentsRes = await paymentsApi.list({
            memberId: profileRes.id,
            page: "1",
            pageSize: "5"
          });
          setPayments(paymentsRes.data ?? []);
        } catch (err) {
          console.warn("Failed to load payments history", err);
          // Don't fail the whole page load if payments unauthorized
        }
      }
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load renewal data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDaysUntilExpiry = () => {
    if (!profile?.expiryDate) return 0;
    const expiry = new Date(profile.expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = () => {
    const daysLeft = getDaysUntilExpiry();
    if (daysLeft < 0) return { status: "expired", color: "destructive", text: "Expired" };
    if (daysLeft <= 7) return { status: "critical", color: "destructive", text: "Expires Soon" };
    if (daysLeft <= 30) return { status: "warning", color: "secondary", text: "Expiring Soon" };
    return { status: "active", color: "default", text: "Active" };
  };

  const processRenewal = async () => {
    if (!selectedPlan || !profile) return;

    setProcessing(true);
    try {
      // Process payment (mock implementation)
      const paymentData = {
        memberId: profile.id,
        branchId: user?.branchId || "",
        planId: selectedPlan.plan.id,
        amount: selectedPlan.plan.price,
        method: "card" as const,
        description: `Membership renewal: ${selectedPlan.plan.name}`
      };

      await paymentsApi.create(paymentData);

      // Update member expiry date (mock)
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + selectedPlan.plan.durationDays);
      if (selectedPlan.bonusDays) {
        newExpiryDate.setDate(newExpiryDate.getDate() + selectedPlan.bonusDays);
      }

      toast({
        title: "Membership Renewed!",
        description: `Your ${selectedPlan.plan.name} membership has been renewed successfully.`,
        variant: "success"
      });

      setRenewalDialog(false);
      setSelectedPlan(null);
      loadData(); // Reload data
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Renewal failed";
      toast({
        title: "Renewal Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const calculateSavings = (option: RenewalOption) => {
    let savings = 0;
    if (option.discount) {
      savings = (option.plan.price * option.discount) / 100;
    }
    return savings;
  };

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading renewal options...</div>;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const daysLeft = getDaysUntilExpiry();
  const expiryStatus = getExpiryStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Membership Renewal</h1>
        <p className="text-muted-foreground">Manage your gym membership</p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Membership Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-lg font-semibold">{currentPlan?.name || "No Active Plan"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiry Date</p>
              <p className="text-lg font-semibold">
                {profile?.expiryDate ? new Date(profile.expiryDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={expiryStatus.color as any}>{expiryStatus.text}</Badge>
            </div>
          </div>

          {expiryStatus.status === "expired" && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Your membership has expired. Please renew to continue accessing gym facilities.
              </AlertDescription>
            </Alert>
          )}

          {expiryStatus.status === "critical" && (
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                Your membership expires in {daysLeft} days. Renew now to avoid interruption.
              </AlertDescription>
            </Alert>
          )}

          {expiryStatus.status === "warning" && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                Your membership expires in {daysLeft} days. Consider renewing soon.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Renewal Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Renewal Options
          </CardTitle>
          <CardDescription>
            Choose the best plan for your fitness journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((option, index) => (
              <div
                key={option.plan.id}
                className={`relative border rounded-lg p-6 ${option.popular ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                  }`}
              >
                {option.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">{option.plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">₹{option.plan.price}</span>
                    <span className="text-muted-foreground">/{option.plan.durationDays === 30 ? 'month' : 'year'}</span>
                  </div>
                  {(option.discount || 0) > 0 && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        Save {option.discount || 0}% with loyalty discount
                      </Badge>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {option.plan.features?.[0] || "Full gym access"}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {option.plan.features?.[1] || "All equipment included"}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {option.plan.features?.[2] || "Free group classes"}
                  </li>
                  {(option.bonusDays || 0) > 0 && (
                    <li className="flex items-center gap-2 text-sm text-orange-600">
                      <Gift className="h-4 w-4" />
                      {option.bonusDays || 0} bonus days included
                    </li>
                  )}
                </ul>

                <div className="space-y-2">
                  {calculateSavings(option) > 0 && (
                    <div className="text-center text-sm text-green-600">
                      You save ₹{calculateSavings(option)}
                    </div>
                  )}
                  <Dialog open={renewalDialog && selectedPlan?.plan.id === option.plan.id} onOpenChange={setRenewalDialog}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        variant={option.popular ? "default" : "outline"}
                        onClick={() => setSelectedPlan(option)}
                      >
                        {option.plan.id === currentPlan?.id ? "Renew Same Plan" : "Switch & Renew"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Membership Renewal</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold">{option.plan.name}</h4>
                          <p className="text-sm text-muted-foreground">{option.plan.description}</p>
                          <div className="mt-2 text-lg font-bold">
                            ₹{option.plan.price} for {option.plan.durationDays === 30 ? '1 month' : '12 months'}
                          </div>
                          {(option.bonusDays || 0) > 0 && (
                            <p className="text-sm text-orange-600">
                              +{option.bonusDays || 0} bonus days
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={processRenewal}
                            disabled={processing}
                            className="flex-1"
                          >
                            {processing ? "Processing..." : "Confirm Renewal"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setRenewalDialog(false)}
                            disabled={processing}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No payment history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{payment.amount}</p>
                    <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Why Renew With Us?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Loyalty Rewards</h4>
              <p className="text-sm text-muted-foreground">
                Get exclusive discounts and benefits as a loyal member
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Bonus Days</h4>
              <p className="text-sm text-muted-foreground">
                Earn extra days on annual memberships and special promotions
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">Priority Access</h4>
              <p className="text-sm text-muted-foreground">
                Enjoy early booking for classes and special member events
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
