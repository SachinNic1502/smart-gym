"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dumbbell, User, Clock, Activity } from "lucide-react";
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
import type { Member, WorkoutPlan } from "@/lib/types";

export default function BranchWorkoutPlansPage() {
  const { user } = useAuth();
  const branchId = user?.branchId;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({ name: "", goal: "", sessions: "" });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
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
        plansApi.getWorkoutPlans(),
        membersApi.list({
          branchId: branchId,
          page: 1,
          pageSize: 500,
        } as Record<string, string | number | undefined>),
      ]);

      setPlans(planRes.data ?? []);
      setMembers((membersRes as unknown as { data: Member[] }).data ?? []);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load workout plans";
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
      p.difficulty.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }, [plans, search]);

  const membersOnPlans = useMemo(() => {
    return members.filter((m) => Boolean(m.workoutPlanId)).length;
  }, [members]);

  const avgExercises = useMemo(() => {
    if (!plans.length) return null;
    const total = plans.reduce((sum, p) => sum + (p.exercises?.length ?? 0), 0);
    return Math.round(total / plans.length);
  }, [plans]);

  const byDifficulty = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of plans) {
      map.set(p.difficulty, (map.get(p.difficulty) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [plans]);

  const exportCsv = useCallback(() => {
    if (filteredPlans.length === 0) {
      toast({ title: "Nothing to export", description: "No workout plans found", variant: "info" });
      return;
    }

    const header = ["id", "name", "difficulty", "durationWeeks", "exerciseCount", "createdAt", "description"];
    const rows = filteredPlans.map((p) => [
      p.id,
      p.name,
      p.difficulty,
      String(p.durationWeeks),
      String(p.exercises?.length ?? 0),
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
    a.download = `workout_plans_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [filteredPlans, toast]);

  const handleSaveWorkout = async () => {
    if (!workoutForm.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter a workout plan name before saving.",
        variant: "warning",
      });
      return;
    }

    try {
      await plansApi.createWorkoutPlan({
        name: workoutForm.name,
        difficulty: "intermediate", // default; could be a form field later
        durationWeeks: 4, // default; could be a form field later
        description: workoutForm.goal || "",
        exercises: [], // empty for now; can be extended later
      });
      setIsCreateOpen(false);
      setWorkoutForm({ name: "", goal: "", sessions: "" });
      setSaveMessage("Workout plan created successfully.");
      toast({ title: "Workout plan created", description: "The plan is now available to assign to members.", variant: "success" });
      loadData(); // refresh the list
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to create workout plan";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workout Plans</h2>
          <p className="text-muted-foreground">
            Library of workout templates your staff can assign and track for members.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={exportCsv}
          >
            Export
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Create Workout Plan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Create Workout Plan</DialogTitle>
                <DialogDescription>
                  Define a reusable workout template. This will be saved and available to assign to members.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="wkp-name">
                    Plan name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="wkp-name"
                    placeholder="e.g. 3-day Full Body"
                    value={workoutForm.name}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wkp-goal">Goal</Label>
                  <Input
                    id="wkp-goal"
                    placeholder="e.g. Strength, Hypertrophy"
                    value={workoutForm.goal}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, goal: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wkp-sessions">Sessions per week</Label>
                  <Input
                    id="wkp-sessions"
                    placeholder="e.g. 4"
                    value={workoutForm.sessions}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, sessions: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveWorkout}
                  disabled={!workoutForm.name.trim()}
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
        <Card className="border-t-4 border-t-primary/30">
          <CardHeader className="pb-2 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Active workout templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : plans.length}</p>
            <p className="text-[11px] text-muted-foreground">Used across classes and PT sessions.</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-emerald-300">
          <CardHeader className="pb-2 flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-sm">Members on plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : membersOnPlans}</p>
            <p className="text-[11px] text-muted-foreground">Members with assigned workout plans.</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-amber-300">
          <CardHeader className="pb-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-sm">Average session length</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : avgExercises === null ? "—" : `${avgExercises} exercises`}</p>
            <p className="text-[11px] text-muted-foreground">Average exercises per plan.</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Templates</TabsTrigger>
          <TabsTrigger value="staff">By Difficulty</TabsTrigger>
        </TabsList>

        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Showing {filteredPlans.length} plans</p>
        </div>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Workout templates</CardTitle>
              <CardDescription>Standard programs that trainers can assign to classes or individuals.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Sessions / week</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                        Loading workout plans...
                      </TableCell>
                    </TableRow>
                  ) : filteredPlans.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-6 text-center text-xs text-muted-foreground"
                      >
                        No workout templates found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => {
                      return (
                        <TableRow key={plan.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{plan.name}</span>
                              <span className="text-[11px] text-muted-foreground">{plan.id}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {plan.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{plan.durationWeeks} weeks</TableCell>
                          <TableCell className="text-sm">{plan.exercises?.length ?? 0}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(plan.createdAt).toLocaleDateString()}
                            <span className="block text-[10px] text-muted-foreground/80">{plan.description}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Plans by difficulty</CardTitle>
              <CardDescription>Distribution of workout templates by difficulty.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Loading breakdown...</div>
              ) : byDifficulty.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No workout plans available.</div>
              ) : (
                byDifficulty.map(([difficulty, count]) => (
                  <div
                    key={difficulty}
                    className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="capitalize">{difficulty}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">{count} plans</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
