"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dumbbell, User, Clock, Activity, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Member, WorkoutPlan, WorkoutExercise } from "@/lib/types";

export default function BranchWorkoutPlansPage() {
  const { user } = useAuth();
  const branchId = user?.branchId;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState<{
    name: string;
    goal: string;
    sessions: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    durationWeeks: string;
    exercises: WorkoutExercise[];
  }>({
    name: "",
    goal: "",
    sessions: "",
    difficulty: "intermediate",
    durationWeeks: "4",
    exercises: []
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleAddExercise = () => {
    setWorkoutForm(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { name: "", sets: 3, reps: "10-12", restSeconds: 60, notes: "", videoUrl: "" }
      ]
    }));
  };

  const handleUpdateExercise = (index: number, field: keyof WorkoutExercise, value: string | number) => {
    const newExercises = [...workoutForm.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setWorkoutForm(prev => ({ ...prev, exercises: newExercises }));
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = [...workoutForm.exercises];
    newExercises.splice(index, 1);
    setWorkoutForm(prev => ({ ...prev, exercises: newExercises }));
  };

  const handleSaveWorkout = async () => {
    if (!workoutForm.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter a workout plan name before saving.",
        variant: "warning",
      });
      return;
    }

    if (workoutForm.exercises.length === 0) {
      toast({
        title: "No exercises",
        description: "Please add at least one exercise to the plan.",
        variant: "warning",
      });
      return;
    }

    try {
      await plansApi.createWorkoutPlan({
        name: workoutForm.name,
        difficulty: workoutForm.difficulty,
        durationWeeks: parseInt(workoutForm.durationWeeks) || 4,
        description: workoutForm.goal || "",
        exercises: workoutForm.exercises,
      });
      setIsCreateOpen(false);
      setWorkoutForm({
        name: "",
        goal: "",
        sessions: "",
        difficulty: "intermediate",
        durationWeeks: "4",
        exercises: []
      });
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workout Plans</h2>
          <p className="text-muted-foreground mt-1">
            Global library of workout templates for branch assignment.
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
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Create Workout Plan</DialogTitle>
                <DialogDescription>
                  Define a reusable workout template.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 pb-6">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="wkp-difficulty">Difficulty</Label>
                      <select
                        id="wkp-difficulty"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={workoutForm.difficulty}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, difficulty: e.target.value as any })}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wkp-goal">Description / Goal</Label>
                      <Input
                        id="wkp-goal"
                        placeholder="e.g. Strength, Hypertrophy"
                        value={workoutForm.goal}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, goal: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wkp-duration">Duration (Weeks)</Label>
                      <Input
                        id="wkp-duration"
                        type="number"
                        placeholder="4"
                        value={workoutForm.durationWeeks}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, durationWeeks: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Exercises</Label>
                      <Button type="button" size="sm" variant="outline" onClick={handleAddExercise} className="gap-1">
                        <Plus className="w-3 h-3" /> Add Exercise
                      </Button>
                    </div>

                    {workoutForm.exercises.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground bg-slate-50">
                        <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No exercises added yet.</p>
                        <Button type="button" variant="link" onClick={handleAddExercise}>Add your first exercise</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {workoutForm.exercises.map((ex, idx) => (
                          <div key={idx} className="p-4 border rounded-lg bg-white shadow-sm space-y-3 relative group">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-red-500"
                              onClick={() => handleRemoveExercise(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Exercise Name</Label>
                                <Input
                                  value={ex.name}
                                  onChange={(e) => handleUpdateExercise(idx, "name", e.target.value)}
                                  placeholder="e.g. Bench Press"
                                  className="h-8"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Sets</Label>
                                  <Input
                                    type="number"
                                    value={ex.sets}
                                    onChange={(e) => handleUpdateExercise(idx, "sets", parseInt(e.target.value) || 0)}
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Reps</Label>
                                  <Input
                                    value={ex.reps}
                                    onChange={(e) => handleUpdateExercise(idx, "reps", e.target.value)}
                                    placeholder="e.g. 10-12"
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Rest (s)</Label>
                                  <Input
                                    type="number"
                                    value={ex.restSeconds}
                                    onChange={(e) => handleUpdateExercise(idx, "restSeconds", parseInt(e.target.value) || 0)}
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Video URL</Label>
                              <Input
                                value={ex.videoUrl || ""}
                                onChange={(e) => handleUpdateExercise(idx, "videoUrl", e.target.value)}
                                placeholder="https://youtube.com/..."
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Notes / Instructions</Label>
                              <Input
                                value={ex.notes || ""}
                                onChange={(e) => handleUpdateExercise(idx, "notes", e.target.value)}
                                placeholder="e.g. Keep back straight, controlled tempo"
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
                  onClick={handleSaveWorkout}
                  disabled={!workoutForm.name.trim() || workoutForm.exercises.length === 0}
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
        <Card className="border-t-4 border-t-primary/30 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active templates</CardTitle>
            <Dumbbell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : plans.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1 underline decoration-primary/20">Branch templates</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-emerald-300 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Members on plans</CardTitle>
            <User className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : membersOnPlans}</p>
            <p className="text-[11px] text-muted-foreground mt-1 underline decoration-emerald-200">Active assignments</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-amber-300 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg exercises</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : avgExercises === null ? "—" : `${avgExercises} exercises`}</p>
            <p className="text-[11px] text-muted-foreground mt-1 underline decoration-amber-200">Program depth</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Templates</TabsTrigger>
          <TabsTrigger value="staff">By Difficulty</TabsTrigger>
        </TabsList>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/40">
            <Activity className="h-3 w-3" />
            <span>Showing {filteredPlans.length} plans</span>
          </div>
        </div>

        <TabsContent value="plans">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="bg-zinc-50/50 border-b">
              <CardTitle>Workout templates</CardTitle>
              <CardDescription>Standard programs that trainers can assign to classes or individuals.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                      <TableHead className="pl-6 min-w-[200px] text-xs font-bold uppercase tracking-wider">Plan</TableHead>
                      <TableHead className="min-w-[120px] text-xs font-bold uppercase tracking-wider">Difficulty</TableHead>
                      <TableHead className="min-w-[120px] text-xs font-bold uppercase tracking-wider">Durations</TableHead>
                      <TableHead className="min-w-[100px] text-xs font-bold uppercase tracking-wider">Exercises</TableHead>
                      <TableHead className="pr-6 text-xs font-bold uppercase tracking-wider">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                          Loading workout plans...
                        </TableCell>
                      </TableRow>
                    ) : filteredPlans.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-16 text-center text-xs text-muted-foreground"
                        >
                          No workout templates found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPlans.map((plan) => {
                        return (
                          <TableRow key={plan.id} className="hover:bg-zinc-50/50 transition-colors">
                            <TableCell className="pl-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">{plan.id}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-zinc-100">
                                {plan.difficulty}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-sm font-medium">{plan.durationWeeks} weeks</TableCell>
                            <TableCell className="py-4">
                              <Badge variant="secondary" className="font-bold text-[10px]">{plan.exercises?.length ?? 0} items</Badge>
                            </TableCell>
                            <TableCell className="pr-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{new Date(plan.createdAt).toLocaleDateString()}</span>
                                <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">{plan.description}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
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
