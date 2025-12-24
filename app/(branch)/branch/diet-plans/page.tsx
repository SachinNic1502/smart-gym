"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Salad, User, Clock, Plus, Trash2, Utensils, Zap, ChefHat } from "lucide-react";
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
  const { toast } = useToast();

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
    <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
        {/* Abstract Background pattern */}
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
          <Salad className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Diet Plans
            </h2>
            <p className="text-emerald-100 mt-2 text-lg font-light">
              Central nutrition templates for member assignments.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportCsv}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm shadow-xl"
            >
              Export CSV
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-white text-emerald-900 hover:bg-emerald-50 shadow-xl border-0 font-semibold">
                  <Plus className="mr-2 h-4 w-4" /> Create Diet Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b bg-emerald-50/30">
                  <DialogTitle className="text-emerald-900">Create Diet Plan</DialogTitle>
                  <DialogDescription>
                    Define a reusable diet template.
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-6 bg-white">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="diet-name" className="text-xs font-bold uppercase text-gray-500">
                          Plan name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="diet-name"
                          placeholder="e.g. Summer Cut"
                          value={dietForm.name}
                          onChange={(e) => setDietForm({ ...dietForm, name: e.target.value })}
                          className="bg-gray-50 focus:bg-white border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="diet-goal" className="text-xs font-bold uppercase text-gray-500">Goal / Description</Label>
                        <Input
                          id="diet-goal"
                          placeholder="e.g. Fat loss"
                          value={dietForm.goal}
                          onChange={(e) => setDietForm({ ...dietForm, goal: e.target.value })}
                          className="bg-gray-50 focus:bg-white border-gray-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diet-calories" className="text-xs font-bold uppercase text-gray-500">Total Daily Calories (Target)</Label>
                      <Input
                        id="diet-calories"
                        placeholder="e.g. 2000"
                        value={dietForm.calories}
                        onChange={(e) => setDietForm({ ...dietForm, calories: e.target.value })}
                        className="bg-gray-50 focus:bg-white border-gray-200"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <Label className="text-base font-bold text-gray-800">Meals</Label>
                        <Button type="button" size="sm" variant="ghost" onClick={handleAddMeal} className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                          <Plus className="w-4 h-4" /> Add Meal
                        </Button>
                      </div>

                      {dietForm.meals.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground bg-slate-50">
                          <Salad className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No meals added yet.</p>
                          <Button type="button" variant="link" onClick={handleAddMeal} className="text-emerald-600">Add your first meal</Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dietForm.meals.map((meal, idx) => (
                            <div key={idx} className="p-5 border rounded-xl bg-emerald-50/30 shadow-sm space-y-4 relative group hover:shadow-md transition-all hover:bg-white hover:border-emerald-200">
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                                  onClick={() => handleRemoveMeal(idx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-gray-500 uppercase">Meal Name</Label>
                                  <Input
                                    value={meal.name}
                                    onChange={(e) => handleUpdateMeal(idx, "name", e.target.value)}
                                    placeholder="e.g. Breakfast"
                                    className="h-9 bg-white"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Time</Label>
                                    <Input
                                      type="time"
                                      value={meal.time}
                                      onChange={(e) => handleUpdateMeal(idx, "time", e.target.value)}
                                      className="h-9 bg-white"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Calories</Label>
                                    <Input
                                      type="number"
                                      value={meal.calories}
                                      onChange={(e) => handleUpdateMeal(idx, "calories", parseInt(e.target.value) || 0)}
                                      className="h-9 bg-white"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Items (comma separated)</Label>
                                <Input
                                  value={meal.items.join(", ")}
                                  onChange={(e) => handleUpdateMeal(idx, "items", e.target.value.split(",").map(i => i.trim()))}
                                  placeholder="e.g. Oatmeal, Banana, Coffee"
                                  className="h-9 bg-white"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t bg-slate-50/50">
                  <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveDiet}
                    disabled={!dietForm.name.trim() || dietForm.meals.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Save Plan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="px-1 space-y-6">
        {saveMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            {saveMessage}
          </div>
        )}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-3 shadow-sm">
            <span>{error}</span>
            <Button size="sm" variant="outline" type="button" onClick={loadData} className="bg-white hover:bg-rose-50 text-rose-700 border-rose-200">
              Retry
            </Button>
          </div>
        ) : null}

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 px-1">
          {/* Active Templates */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
              <ChefHat className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-emerald-100">
                Active Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight">
                {loading ? "—" : plans.length}
              </div>
              <p className="text-xs mt-2 flex items-center gap-2 font-medium opacity-90">
                <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
                Ready to assign
              </p>
            </CardContent>
          </Card>

          {/* Members on Plans */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
              <User className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-blue-100">
                Members on Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight">
                {loading ? "—" : membersOnPlans}
              </div>
              <p className="text-xs mt-2 flex items-center gap-2 font-medium opacity-90">
                <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
                Active assignments
              </p>
            </CardContent>
          </Card>

          {/* Complexity */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
              <Utensils className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-amber-100">
                Complexity
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight">
                {loading ? "—" : avgMeals ?? "—"}
              </div>
              <p className="text-xs mt-2 flex items-center gap-2 font-medium opacity-90">
                <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
                Avg meals per plan
              </p>
            </CardContent>
          </Card>
        </div>


        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-emerald-50/20 border-b border-gray-100 pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg text-emerald-950">Diet Templates</CardTitle>
                <CardDescription>Standardized plans that staff can personalize.</CardDescription>
              </div>
              <div className="relative w-full lg:max-w-sm">
                <Input
                  placeholder="Search plans..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 border-slate-200 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-6 font-semibold text-gray-600">Plan</TableHead>
                    <TableHead className="font-semibold text-gray-600">Calories</TableHead>
                    <TableHead className="font-semibold text-gray-600">Meals</TableHead>
                    <TableHead className="pr-6 text-right font-semibold text-gray-600">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                        Loading diet plans...
                      </TableCell>
                    </TableRow>
                  ) : filteredPlans.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-16 text-center text-sm text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 rounded-full bg-slate-100">
                            <Salad className="h-6 w-6 text-slate-400" />
                          </div>
                          <p>No diet templates found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => (
                      <TableRow key={plan.id} className="hover:bg-emerald-50/30 transition-colors cursor-pointer group">
                        <TableCell className="pl-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{plan.name}</span>
                            <span className="text-xs text-gray-500 mt-0.5 font-mono">{plan.id.substring(0, 8)}...</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-bold text-gray-700">{plan.caloriesPerDay.toLocaleString()} kcal</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="secondary" className="font-bold text-[10px] bg-slate-100 text-slate-600 border border-slate-200">{plan.meals?.length ?? 0} meals</Badge>
                        </TableCell>
                        <TableCell className="pr-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-600 font-medium">{new Date(plan.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px] text-gray-400 italic truncate max-w-[150px]">{plan.description}</span>
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
    </div>
  );
}
