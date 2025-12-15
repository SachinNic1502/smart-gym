"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Salad, User, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, membersApi, plansApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import type { DietPlan, Member } from "@/lib/types";

export default function BranchDietPlansPage() {
  const { user } = useAuth();
  const branchId = user?.branchId;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dietForm, setDietForm] = useState({ name: "", goal: "", calories: "" });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError(null);
      setPlans([]);
      setMembers([]);
      return;
    }

    if (user.role === "branch_admin" && !branchId) {
      setLoading(false);
      setError("Branch not assigned");
      setPlans([]);
      setMembers([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [planRes, membersRes] = await Promise.all([
        plansApi.getDietPlans(),
        membersApi.list({
          branchId: branchId,
          page: 1,
          pageSize: 500,
        } as Record<string, string | number | undefined>),
      ]);

      setPlans(planRes.data ?? []);
      setMembers((membersRes as unknown as { data: Member[] }).data ?? []);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load diet plans";
      setError(message);
      setPlans([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }, [plans, search]);

  const membersOnPlans = useMemo(() => {
    return members.filter((m) => Boolean(m.dietPlanId)).length;
  }, [members]);

  const avgMeals = useMemo(() => {
    if (!plans.length) return null;
    const total = plans.reduce((sum, p) => sum + (p.meals?.length ?? 0), 0);
    return Math.round(total / plans.length);
  }, [plans]);

  const exportCsv = useCallback(() => {
    if (filteredPlans.length === 0) {
      toast({ title: "Nothing to export", description: "No diet plans found", variant: "info" });
      return;
    }

    const header = ["id", "name", "caloriesPerDay", "mealsCount", "createdAt", "description"];
    const rows = filteredPlans.map((p) => [
      p.id,
      p.name,
      String(p.caloriesPerDay),
      String(p.meals?.length ?? 0),
      p.createdAt,
      p.description,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diet_plans_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [filteredPlans, toast]);

  const handleSaveDiet = async () => {
    if (!dietForm.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter a diet plan name before saving.",
        variant: "warning",
      });
      return;
    }

    try {
      await plansApi.createDietPlan({
        name: dietForm.name,
        caloriesPerDay: Number(dietForm.calories) || 2000,
        description: dietForm.goal || "",
        meals: [], // empty for now; can be extended later
      });
      setIsCreateOpen(false);
      setDietForm({ name: "", goal: "", calories: "" });
      setSaveMessage("Diet plan created successfully.");
      toast({ title: "Diet plan created", description: "The plan is now available to assign to members.", variant: "success" });
      loadData(); // refresh the list
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to create diet plan";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Diet Plans</h2>
          <p className="text-muted-foreground">
            Central place for branch nutrition templates that staff can assign to members.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCsv}
          >
            Export
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Create Diet Plan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Create Diet Plan</DialogTitle>
                <DialogDescription>
                  Define a reusable diet template. This will be saved and available to assign to members.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="diet-name">
                    Plan name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="diet-name"
                    placeholder="e.g. Summer Cut 4 Weeks"
                    value={dietForm.name}
                    onChange={(e) => setDietForm({ ...dietForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet-goal">Goal</Label>
                  <Input
                    id="diet-goal"
                    placeholder="e.g. Fat loss, Muscle gain"
                    value={dietForm.goal}
                    onChange={(e) => setDietForm({ ...dietForm, goal: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet-calories">Approx. calories / day</Label>
                  <Input
                    id="diet-calories"
                    placeholder="e.g. 1,900 kcal/day"
                    value={dietForm.calories}
                    onChange={(e) => setDietForm({ ...dietForm, calories: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveDiet}
                  disabled={!dietForm.name.trim()}
                >
                  Save Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {saveMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {saveMessage}
        </div>
      )}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button size="sm" variant="outline" type="button" onClick={loadData}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-t-4 border-t-emerald-200">
          <CardHeader className="pb-2 flex items-center gap-2">
            <Salad className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-sm">Active diet templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : plans.length}</p>
            <p className="text-[11px] text-muted-foreground">Ready to assign to members.</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-200">
          <CardHeader className="pb-2 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm">Members on diet plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : membersOnPlans}</p>
            <p className="text-[11px] text-muted-foreground">Members with assigned diet plans.</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-amber-200">
          <CardHeader className="pb-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-sm">Avg meals per plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : avgMeals === null ? "—" : `${avgMeals} meals`}</p>
            <p className="text-[11px] text-muted-foreground">Average meals per diet plan.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Diet templates</CardTitle>
              <CardDescription>Standardized plans that your staff can personalize per member.</CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <Input
                placeholder="Search plans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Calories</TableHead>
                <TableHead>Meals</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-xs text-muted-foreground">
                    Loading diet plans...
                  </TableCell>
                </TableRow>
              ) : filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-xs text-muted-foreground"
                  >
                    No diet templates found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{plan.name}</span>
                        <span className="text-[11px] text-muted-foreground">{plan.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{plan.caloriesPerDay.toLocaleString()} kcal</TableCell>
                    <TableCell className="text-sm">{plan.meals?.length ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(plan.createdAt).toLocaleDateString()}
                      <span className="block text-[10px] text-muted-foreground/80 max-w-[200px] truncate">{plan.description}</span>
                    </TableCell>
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
