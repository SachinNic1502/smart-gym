"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Salad, User, Clock, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type { DietPlan, Member, DietMeal } from "@/lib/types";

export default function BranchDietPlansPage() {
  const { user } = useAuth();
  const branchId = user?.branchId;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dietForm, setDietForm] = useState<{
    name: string;
    goal: string;
    calories: string;
    meals: DietMeal[];
  }>({
    name: "",
    goal: "",
    calories: "",
    meals: []
  });
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

  const handleAddMeal = () => {
    setDietForm(prev => ({
      ...prev,
      meals: [
        ...prev.meals,
        { name: "Meal " + (prev.meals.length + 1), time: "08:00", items: [], calories: 500 }
      ]
    }));
  };

  const handleUpdateMeal = (index: number, field: keyof DietMeal, value: string | number | string[]) => {
    const newMeals = [...dietForm.meals];
    newMeals[index] = { ...newMeals[index], [field]: value };
    setDietForm(prev => ({ ...prev, meals: newMeals }));
  };

  const handleRemoveMeal = (index: number) => {
    const newMeals = [...dietForm.meals];
    newMeals.splice(index, 1);
    setDietForm(prev => ({ ...prev, meals: newMeals }));
  };

  const handleSaveDiet = async () => {
    if (!dietForm.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter a diet plan name before saving.",
        variant: "warning",
      });
      return;
    }

    if (dietForm.meals.length === 0) {
      toast({
        title: "No meals",
        description: "Please add at least one meal to the diet plan.",
        variant: "warning",
      });
      return;
    }

    try {
      await plansApi.createDietPlan({
        name: dietForm.name,
        caloriesPerDay: Number(dietForm.calories) || 2000,
        description: dietForm.goal || "",
        meals: dietForm.meals,
      });
      setIsCreateOpen(false);
      setDietForm({ name: "", goal: "", calories: "", meals: [] });
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Diet Plans</h2>
          <p className="text-muted-foreground mt-1">
            Central nutrition templates for member assignments.
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
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Create Diet Plan</DialogTitle>
                <DialogDescription>
                  Define a reusable diet template.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="diet-name">
                        Plan name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="diet-name"
                        placeholder="e.g. Summer Cut"
                        value={dietForm.name}
                        onChange={(e) => setDietForm({ ...dietForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diet-goal">Goal / Description</Label>
                      <Input
                        id="diet-goal"
                        placeholder="e.g. Fat loss"
                        value={dietForm.goal}
                        onChange={(e) => setDietForm({ ...dietForm, goal: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diet-calories">Total Daily Calories (Target)</Label>
                    <Input
                      id="diet-calories"
                      placeholder="e.g. 2000"
                      value={dietForm.calories}
                      onChange={(e) => setDietForm({ ...dietForm, calories: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Meals</Label>
                      <Button type="button" size="sm" variant="outline" onClick={handleAddMeal} className="gap-1">
                        <Plus className="w-3 h-3" /> Add Meal
                      </Button>
                    </div>

                    {dietForm.meals.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground bg-slate-50">
                        <Salad className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No meals added yet.</p>
                        <Button type="button" variant="link" onClick={handleAddMeal}>Add your first meal</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dietForm.meals.map((meal, idx) => (
                          <div key={idx} className="p-4 border rounded-lg bg-white shadow-sm space-y-3 relative group">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-red-500"
                              onClick={() => handleRemoveMeal(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Meal Name</Label>
                                <Input
                                  value={meal.name}
                                  onChange={(e) => handleUpdateMeal(idx, "name", e.target.value)}
                                  placeholder="e.g. Breakfast"
                                  className="h-8"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Time</Label>
                                  <Input
                                    type="time"
                                    value={meal.time}
                                    onChange={(e) => handleUpdateMeal(idx, "time", e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Calories</Label>
                                  <Input
                                    type="number"
                                    value={meal.calories}
                                    onChange={(e) => handleUpdateMeal(idx, "calories", parseInt(e.target.value) || 0)}
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Items (comma separated)</Label>
                              <Input
                                value={meal.items.join(", ")}
                                onChange={(e) => handleUpdateMeal(idx, "items", e.target.value.split(",").map(i => i.trim()))}
                                placeholder="e.g. Oatmeal, Banana, Coffee"
                                className="h-8 opacity-80"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="p-6 pt-2 border-t mt-auto">
                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveDiet}
                  disabled={!dietForm.name.trim() || dietForm.meals.length === 0}
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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-t-4 border-t-emerald-400 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active templates</CardTitle>
            <Salad className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : plans.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1 underline decoration-emerald-200">Ready to assign</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-400 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Members on plans</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : membersOnPlans}</p>
            <p className="text-[11px] text-muted-foreground mt-1 underline decoration-blue-200">Active assignments</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-amber-400 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Complexity</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : avgMeals === null ? "—" : `${avgMeals} meals`}</p>
            <p className="text-[11px] text-muted-foreground mt-1 underline decoration-amber-200">Avg per plan</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-zinc-50/50 border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Diet Templates</CardTitle>
              <CardDescription>Standardized plans that staff can personalize.</CardDescription>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Input
                placeholder="Search plans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 shadow-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50">
                  <TableHead className="pl-6 min-w-[200px] text-xs font-bold uppercase tracking-wider">Plan</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-bold uppercase tracking-wider">Calories</TableHead>
                  <TableHead className="min-w-[100px] text-xs font-bold uppercase tracking-wider">Meals</TableHead>
                  <TableHead className="pr-6 text-xs font-bold uppercase tracking-wider">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-xs text-muted-foreground">
                      Loading diet plans...
                    </TableCell>
                  </TableRow>
                ) : filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-16 text-center text-xs text-muted-foreground"
                    >
                      No diet templates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => (
                    <TableRow key={plan.id} className="hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{plan.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 font-medium text-emerald-600">{plan.caloriesPerDay.toLocaleString()} kcal</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="font-bold text-[10px]">{plan.meals?.length ?? 0} meals</Badge>
                      </TableCell>
                      <TableCell className="pr-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">{new Date(plan.createdAt).toLocaleDateString()}</span>
                          <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">{plan.description}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
