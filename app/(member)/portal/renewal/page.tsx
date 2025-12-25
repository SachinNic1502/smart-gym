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
  ArrowRight,
  RefreshCw
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

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
      const profileRes = await meApi.getProfile();
      setProfile(profileRes);

      if (profileRes?.plan) {
        const plansRes = await plansApi.getMembershipPlans();
        const currentPlan = plansRes.data.find(plan => plan.name === profileRes.plan);
        setCurrentPlan(currentPlan || null);
      }

      const plansRes = await plansApi.getMembershipPlans();
      const renewalOptions: RenewalOption[] = plansRes.data.map(plan => ({
        plan,
        discount: plan.name === profileRes?.plan ? 10 : 0,
        bonusDays: plan.durationDays === 365 ? 30 : 0,
        popular: plan.name.toLowerCase().includes("premium")
      }));
      setAvailablePlans(renewalOptions);

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
    if (daysLeft < 0) return { status: "expired", color: "bg-rose-500", text: "Expired" };
    if (daysLeft <= 7) return { status: "critical", color: "bg-rose-500", text: "Expires Soon" };
    if (daysLeft <= 30) return { status: "warning", color: "bg-amber-500", text: "Expiring Soon" };
    return { status: "active", color: "bg-emerald-500", text: "Active" };
  };

  const processRenewal = async () => {
    if (!selectedPlan || !profile) return;

    setProcessing(true);
    try {
      const paymentData = {
        memberId: profile.id,
        branchId: user?.branchId || "",
        planId: selectedPlan.plan.id,
        amount: selectedPlan.plan.price,
        method: "card" as const,
        description: `Membership renewal: ${selectedPlan.plan.name}`
      };

      await paymentsApi.create(paymentData);

      toast({
        title: "Membership Renewed!",
        description: `Your ${selectedPlan.plan.name} membership has been renewed successfully.`,
        variant: "success"
      });

      setRenewalDialog(false);
      setSelectedPlan(null);
      loadData();
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
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] w-full rounded-3xl" />
          <Skeleton className="h-[400px] w-full rounded-3xl" />
          <Skeleton className="h-[400px] w-full rounded-3xl" />
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
          <h2 className="text-3xl font-black text-rose-900">Connection Error</h2>
          <p className="text-rose-500/70 max-w-sm font-medium">
            We couldn't reach the membership portal. Please check your connection.
          </p>
        </div>
        <Button onClick={loadData} variant="outline" className="rounded-2xl px-8 h-12 font-bold flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </Button>
      </div>
    );
  }

  const daysLeft = getDaysUntilExpiry();
  const expiryStatus = getExpiryStatus();

  return (
    <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[40px] bg-slate-900 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]"></div>

        <CardContent className="p-10 md:p-14 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-4">
              <Badge className="bg-blue-500/20 text-blue-400 font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full border-0 uppercase">
                Membership Portal
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Secure Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Fitness Future</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-sm">
                Extend your access to premium facilities and world-class training programs.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 flex flex-col items-center md:items-end gap-1">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Remaining</div>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-6xl font-black", daysLeft <= 7 ? "text-rose-400" : "text-white")}>{Math.max(0, daysLeft)}</span>
                <span className="text-xl font-bold text-slate-500">Days Left</span>
              </div>
              <Badge className={cn("mt-2 border-0 font-black rounded-lg", expiryStatus.color)}>
                {expiryStatus.text.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Plan Selection Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
            <div className="h-2 w-8 bg-blue-600 rounded-full"></div>
            Exclusively For You
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {availablePlans.map((option, index) => (
            <Card
              key={option.plan.id}
              className={cn(
                "group relative border-0 shadow-xl rounded-[40px] overflow-hidden bg-white hover:shadow-2xl transition-all duration-500",
                option.popular ? "ring-2 ring-blue-500 md:scale-105" : ""
              )}
            >
              {option.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-blue-500 text-white font-black text-[10px] tracking-widest px-6 py-2 rounded-bl-[20px] uppercase">
                    Recommended
                  </div>
                </div>
              )}

              <CardContent className="p-10 flex flex-col h-full">
                <div className="mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:rotate-6 transition-all duration-500">
                    {option.plan.durationDays === 365 ? <Star className="h-7 w-7 text-amber-500" /> : <TrendingUp className="h-7 w-7 text-blue-500" />}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{option.plan.name}</h3>
                  <p className="text-slate-400 font-medium text-sm mt-1">{option.plan.description || "Unlimited access to all facilities"}</p>
                </div>

                <div className="mb-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">₹{option.plan.price}</span>
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/ {option.plan.durationDays} Days</span>
                  </div>
                  {(option.discount ?? 0) > 0 && (
                    <Badge className="mt-3 bg-emerald-50 text-emerald-600 border-0 font-black text-[10px] tracking-widest px-3 py-1 rounded-full">
                      RENEWAL SAVINGS: {option.discount ?? 0}% OFF
                    </Badge>
                  )}
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {[
                    "Full facility access",
                    "Advanced analytics",
                    "Trainer consultation",
                    option.bonusDays ? `+${option.bonusDays} Bonus Days` : null
                  ].filter(Boolean).map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Dialog open={renewalDialog && selectedPlan?.plan.id === option.plan.id} onOpenChange={setRenewalDialog}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setSelectedPlan(option)}
                      className={cn(
                        "h-14 w-full rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-lg active:scale-95 group/btn",
                        option.popular ? "bg-slate-900 text-white hover:bg-blue-600" : "bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white"
                      )}
                    >
                      {option.plan.id === currentPlan?.id ? "Renew Strategy" : "Switch Protocol"}
                      <ArrowRight className="h-4 w-4 ml-3 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-[40px] border-0 shadow-2xl">
                    <div className="p-10 space-y-8">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">Confirm Extension</h3>
                        <p className="text-slate-400 font-medium">Verify your selected membership protocol.</p>
                      </div>

                      <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-black text-xl text-slate-900 uppercase">{option.plan.name}</h4>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Renewal Protocol active</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-blue-600 tracking-tighter">₹{option.plan.price}</div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Secure Amount</p>
                          </div>
                        </div>
                        {(option.bonusDays ?? 0) > 0 && (
                          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4">
                            <Gift className="w-3 h-3" /> Includes {option.bonusDays ?? 0} Bonus Training Days
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={processRenewal}
                          disabled={processing}
                          className="h-14 w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-600/20"
                        >
                          {processing ? "SECURING..." : "AUTHORIZE PAYMENT"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setRenewalDialog(false)}
                          className="h-14 rounded-2xl text-slate-400 font-black hover:text-slate-900"
                        >
                          NEVERMIND
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Archives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
          <Card className="border-0 shadow-2xl rounded-[40px] overflow-hidden bg-white">
            <CardHeader className="p-10 pb-0">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                  <div className="h-2 w-8 bg-slate-900 rounded-full"></div>
                  Payment Archives
                </h3>
                <CreditCard className="w-6 h-6 text-slate-300" />
              </div>
            </CardHeader>
            <CardContent className="p-10">
              {payments.length === 0 ? (
                <div className="py-20 text-center rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-100">
                  <div className="h-16 w-16 rounded-3xl bg-white shadow-lg mx-auto mb-6 flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Transaction Registry Empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 hover:bg-slate-100/50 transition-colors group">
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase text-xs tracking-wider">{payment.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {(() => {
                                const d = new Date(payment.createdAt);
                                return !isNaN(d.getTime())
                                  ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                  : "Unknown Date";
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-900">₹{payment.amount}</p>
                        <Badge className={cn(
                          "mt-1 border-0 rounded-lg font-black text-[9px] tracking-widest px-2",
                          payment.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {payment.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
