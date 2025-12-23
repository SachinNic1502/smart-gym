"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ArrowLeft, CreditCard, Activity, TrendingUp, Wallet, Calendar, Smartphone, MapPin, Zap, ShieldCheck, Mail, Phone, Hash, Pencil, Snowflake, PlayCircle } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";
import { attendanceApi, branchesApi, membersApi, paymentsApi, plansApi, ApiError } from "@/lib/api/client";
import type { Branch, Member, Payment, MembershipPlan } from "@/lib/types";

export default function GlobalMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.memberId as string | undefined;
  const [member, setMember] = useState<Member | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const [visitedToday, setVisitsToday] = useState<number>(0);
  const [pendingBalance, setPendingBalance] = useState<number>(0);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  // Action States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; email: string; phone: string }>({ name: "", email: "", phone: "" });

  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const refreshMember = async () => {
    if (!memberId) return;
    try {
      const m = await membersApi.get(memberId);
      setMember(m);
    } catch {
      // ignore
    }
  };

  const handleEditClick = () => {
    if (member) {
      setEditForm({ name: member.name, email: member.email, phone: member.phone });
      setIsEditOpen(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!member) return;
    try {
      await membersApi.update(member.id, editForm);
      toast({ title: "Profile updated", variant: "success" });
      setIsEditOpen(false);
      refreshMember();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to update profile";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleFreezeClick = () => {
    toast({
      title: "Freeze Membership?",
      description: "This will pause the member's plan immediately.",
      variant: "warning",
      duration: Infinity,
      action: ({ dismiss }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={dismiss}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={async () => {
            dismiss();
            if (!member) return;
            try {
              await membersApi.update(member.id, { status: "Frozen" });
              toast({ title: "Membership Frozen", variant: "success" });
              refreshMember();
            } catch (e) {
              toast({ title: "Failed to freeze", variant: "destructive" });
            }
          }}>Confirm Freeze</Button>
        </div>
      )
    });
  };

  const loadPlans = async () => {
    try {
      const res = await plansApi.getMembershipPlans();
      setAvailablePlans(res.data || []);
    } catch {
      // ignore
    }
  };

  const handleChangePlanClick = async () => {
    await loadPlans();
    if (member) setSelectedPlanId(member.plan); // Assuming member.plan stores name, we'll try to match name or default to empty
    setIsChangePlanOpen(true);
  };

  const handleSaveNewPlan = async () => {
    if (!member || !selectedPlanId) return;
    try {
      // Find plan name from ID if member.plan expects a name
      const plan = availablePlans.find(p => p.name === selectedPlanId || p.id === selectedPlanId);
      if (plan) {
        await membersApi.update(member.id, { plan: plan.name });
        toast({ title: "Plan updated", variant: "success" });
        setIsChangePlanOpen(false);
        refreshMember();
      }
    } catch (e) {
      toast({ title: "Failed to update plan", variant: "destructive" });
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!memberId) return;
      setLoading(true);
      setError(null);

      try {
        const m = await membersApi.get(memberId);
        setMember(m);

        try {
          const b = await branchesApi.get(m.branchId);
          setBranch(b);
        } catch {
          setBranch(null);
        }

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const date = `${yyyy}-${mm}-${dd}`;

        const [attendanceResult, pendingPaymentsResult, recentPaymentsResult] = await Promise.all([
          attendanceApi.list({ memberId, branchId: m.branchId, date }),
          paymentsApi.list({ memberId, branchId: m.branchId, status: "pending" }),
          paymentsApi.list({ memberId, branchId: m.branchId, page: "1", pageSize: "5" }),
        ]);

        setVisitsToday(attendanceResult.total || 0);

        const pending = (pendingPaymentsResult.data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        setPendingBalance(pending);
        setRecentPayments(recentPaymentsResult.data || []);
      } catch (e) {
        const message = e instanceof ApiError ? e.message : "Failed to load member";
        setError(message);
        setMember(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [memberId]);

  const branchName = useMemo(() => branch?.name || member?.branchId || "—", [branch?.name, member?.branchId]);
  const joinDate = useMemo(() => {
    if (!member?.createdAt) return "—";
    try {
      return new Date(member.createdAt).toLocaleDateString();
    } catch {
      return member.createdAt;
    }
  }, [member?.createdAt]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/admin/members")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Loading member...</CardTitle>
            <CardDescription>Please wait while we fetch the latest member details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/admin/members")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Member not found</CardTitle>
            <CardDescription>
              {error || "We couldn&apos;t find details for this member. Please return to the directory and try again."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-rose-600 via-fuchsia-600 to-indigo-700 text-white p-10 rounded-[2.5rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-12 -translate-y-12">
          <Users className="w-80 h-80" />
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          <Button
            variant="ghost"
            className="w-fit text-white hover:bg-white/10 rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border border-white/10 backdrop-blur-md"
            onClick={() => router.push("/admin/members")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-white/20 shadow-2xl">
                  <AvatarFallback className="bg-white/10 backdrop-blur-md text-3xl font-black">{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-4xl font-black tracking-tight">{member.name}</h2>
                    <Badge className={`rounded-lg px-3 py-1 font-black uppercase tracking-widest text-[9px] border-0 shadow-lg ${member.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {member.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-rose-100 font-bold uppercase tracking-widest text-[10px] opacity-80">
                    <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> {member.plan}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {branchName}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Joined {joinDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button className="bg-white text-rose-600 hover:bg-rose-50 font-black px-6 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest gap-2 shadow-xl">
                Renew Membership
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4 px-1">
        {[
          { title: 'Visits Today', value: visitedToday, icon: TrendingUp, color: 'rose', sub: 'Total check-ins' },
          { title: 'Balance Dues', value: `₹${pendingBalance.toLocaleString()}`, icon: Wallet, color: 'amber', sub: 'Pending Invoices' },
          { title: 'Engagement', value: 'High', icon: Activity, color: 'fuchsia', sub: 'Active last 24h' },
          { title: 'Health Score', value: '94%', icon: ShieldCheck, color: 'emerald', sub: 'Based on consistency' }
        ].map((item, i) => (
          <Card key={i} className="group border-0 shadow-lg bg-white rounded-[1.5rem] overflow-hidden hover:shadow-2xl transition-all">
            <CardHeader className="p-7 flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <p className={`text-[10px] font-black text-${item.color}-500 uppercase tracking-widest`}>{item.title}</p>
                <CardTitle className="text-2xl font-black text-gray-800 tracking-tighter">
                  {item.value}
                </CardTitle>
              </div>
              <div className={`p-3 bg-${item.color}-50 rounded-2xl text-${item.color}-600 group-hover:bg-${item.color}-500 group-hover:text-white transition-all`}>
                <item.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="px-7 pb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 px-1">
        {/* Profile Intelligence */}
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-fuchsia-600">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Identity & Contact</CardTitle>
                <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Verified Member Information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-slate-50 border border-gray-100">
                <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400"><Mail className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="font-bold text-gray-800">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-slate-50 border border-gray-100">
                <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400"><Phone className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile Primary</p>
                  <p className="font-bold text-gray-800">{member.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-slate-50 border border-gray-100">
                <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400"><Hash className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Member ID</p>
                  <p className="font-mono font-bold text-gray-800 tracking-tighter">{member.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Ledger */}
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-amber-500">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Financial Ledger</CardTitle>
                  <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Audit trail of transactions</CardDescription>
                </div>
              </div>
              <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-amber-600 px-4 rounded-xl hover:bg-amber-50">See All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {recentPayments.length === 0 ? (
                <div className="p-10 text-center opacity-30 italic font-medium">No transaction history found</div>
              ) : (
                recentPayments.map((p) => (
                  <div key={p.id} className="group p-5 rounded-[1.8rem] bg-slate-50 border border-transparent hover:border-amber-100 hover:bg-amber-50/30 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-amber-500 shadow-amber-900/5"><Wallet className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{p.method} • {new Date(p.createdAt).toLocaleDateString()}</p>
                        <p className="font-black text-gray-800 tracking-tight">{p.description || 'Membership Payment'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900 tracking-tighter">₹{p.amount.toLocaleString()}</p>
                      <Badge variant="outline" className={`mt-1 text-[8px] font-black uppercase tracking-widest border-0 ${p.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Hub */}
      <div className="px-1">
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
          <CardContent className="p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">Member Control Hub</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-80">Administrative Overrides & Actions</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleEditClick} className="h-14 px-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl">
                  <Pencil className="h-4 w-4" /> Edit Profile
                </Button>
                <Button onClick={handleFreezeClick} variant="outline" className="h-14 px-8 rounded-2xl border-white/20 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-md">
                  <Snowflake className="h-4 w-4" /> Freeze Plan
                </Button>
                <Button onClick={handleChangePlanClick} variant="outline" className="h-14 px-8 rounded-2xl border-white/20 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-md">
                  <PlayCircle className="h-4 w-4" /> Change Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Member Profile</DialogTitle>
            <DialogDescription>
              Make changes to the member's profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveProfile} className="rounded-xl bg-slate-900 text-white hover:bg-black">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Membership Plan</DialogTitle>
            <DialogDescription>Select a new plan for this member. This will update their billing cycle.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Current Plan</Label>
              <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 text-sm font-medium text-gray-700">
                {member?.plan || "None"}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-plan">New Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger id="new-plan" className="w-full rounded-xl">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.name}>{plan.name} - ₹{plan.price}/{plan.durationDays}d</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangePlanOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveNewPlan} className="rounded-xl bg-slate-900 text-white hover:bg-black">Update Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
