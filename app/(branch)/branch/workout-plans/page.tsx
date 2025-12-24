"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dumbbell, User, Clock, Activity, Plus, Trash2, CalendarDays, BarChart, Layers } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-2xl overflow-hidden mx-1">
        {/* Abstract Background pattern */}
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-10 -translate-y-10">
          <Dumbbell className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Workout Plans
            </h2>
            <p className="text-slate-300 mt-2 text-lg font-light">
              Global library of workout templates for branch assignment.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={exportCsv}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm shadow-xl"
            >
              Export CSV
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl border-0">
                  <Plus className="mr-2 h-4 w-4" /> Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b bg-slate-50/50">
                  <DialogTitle>Create Workout Plan</DialogTitle>
                  <DialogDescription>
                    Define a reusable workout template.
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-6 bg-white">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="wkp-name" className="text-xs font-bold uppercase text-gray-500">
                          Plan name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="wkp-name"
                          placeholder="e.g. 3-day Full Body"
                          value={workoutForm.name}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                          className="bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wkp-difficulty" className="text-xs font-bold uppercase text-gray-500">Difficulty</Label>
                        <select
                          id="wkp-difficulty"
                          className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 focus:bg-white"
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
                        <Label htmlFor="wkp-goal" className="text-xs font-bold uppercase text-gray-500">Description / Goal</Label>
                        <Input
                          id="wkp-goal"
                          placeholder="e.g. Strength, Hypertrophy"
                          value={workoutForm.goal}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, goal: e.target.value })}
                          className="bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wkp-duration" className="text-xs font-bold uppercase text-gray-500">Duration (Weeks)</Label>
                        <Input
                          id="wkp-duration"
                          type="number"
                          placeholder="4"
                          value={workoutForm.durationWeeks}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, durationWeeks: e.target.value })}
                          className="bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <Label className="text-base font-bold text-gray-800">Exercises</Label>
                        <Button type="button" size="sm" variant="ghost" onClick={handleAddExercise} className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Plus className="w-4 h-4" /> Add Exercise
                        </Button>
                      </div>

                      {workoutForm.exercises.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground bg-slate-50">
                          <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No exercises added yet.</p>
                          <Button type="button" variant="link" onClick={handleAddExercise} className="text-blue-600">Add your first exercise</Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {workoutForm.exercises.map((ex, idx) => (
                            <div key={idx} className="p-5 border rounded-xl bg-slate-50/50 shadow-sm space-y-4 relative group hover:shadow-md transition-all hover:bg-white hover:border-blue-100">
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                                  onClick={() => handleRemoveExercise(idx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-gray-500 uppercase">Exercise Name</Label>
                                  <Input
                                    value={ex.name}
                                    onChange={(e) => handleUpdateExercise(idx, "name", e.target.value)}
                                    placeholder="e.g. Bench Press"
                                    className="h-9 bg-white"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Sets</Label>
                                    <Input
                                      type="number"
                                      value={ex.sets}
                                      onChange={(e) => handleUpdateExercise(idx, "sets", parseInt(e.target.value) || 0)}
                                      className="h-9 bg-white"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Reps</Label>
                                    <Input
                                      value={ex.reps}
                                      onChange={(e) => handleUpdateExercise(idx, "reps", e.target.value)}
                                      placeholder="10-12"
                                      className="h-9 bg-white"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Rest (s)</Label>
                                    <Input
                                      type="number"
                                      value={ex.restSeconds}
                                      onChange={(e) => handleUpdateExercise(idx, "restSeconds", parseInt(e.target.value) || 0)}
                                      className="h-9 bg-white"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-gray-500 uppercase">Video URL</Label>
                                  <Input
                                    value={ex.videoUrl || ""}
                                    onChange={(e) => handleUpdateExercise(idx, "videoUrl", e.target.value)}
                                    placeholder="https://youtube.com/..."
                                    className="h-9 bg-white"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-gray-500 uppercase">Notes</Label>
                                  <Input
                                    value={ex.notes || ""}
                                    onChange={(e) => handleUpdateExercise(idx, "notes", e.target.value)}
                                    placeholder="e.g. Keep back straight"
                                    className="h-9 bg-white"
                                  />
                                </div>
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
                    onClick={handleSaveWorkout}
                    disabled={!workoutForm.name.trim() || workoutForm.exercises.length === 0}
                    className="bg-slate-900 text-white"
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
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
              <Layers className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-blue-100">
                Active Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight">
                {loading ? "—" : plans.length}
              </div>
              <p className="text-xs mt-2 flex items-center gap-2 font-medium opacity-90">
                <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
                Branch templates
              </p>
            </CardContent>
          </Card>

          {/* Members on Plans */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
              <User className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-emerald-100">
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

          {/* Avg Exercises */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 -translate-y-2 translate-x-2">
              <Activity className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-amber-100">
                Avg Exercises
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight">
                {loading ? "—" : avgExercises ?? "—"}
              </div>
              <p className="text-xs mt-2 flex items-center gap-2 font-medium opacity-90">
                <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
                Items per plan
              </p>
            </CardContent>
          </Card>
        </div>


        <Tabs defaultValue="plans" className="space-y-6">
          <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm inline-flex">
            <TabsList className="justify-start h-10 bg-transparent p-0 space-x-2">
              <TabsTrigger
                value="plans"
                className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-all"
              >
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-all"
              >
                By Difficulty
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="relative w-full lg:max-w-sm">
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all pl-4"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Activity className="h-4 w-4" />
              <span>Showing {filteredPlans.length} plans</span>
            </div>
          </div>

          <TabsContent value="plans" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-4">
                <CardTitle className="text-lg">Workout templates</CardTitle>
                <CardDescription>Standard programs that trainers can assign to classes or individuals.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="pl-6 font-semibold text-gray-600">Plan Name</TableHead>
                        <TableHead className="font-semibold text-gray-600">Difficulty</TableHead>
                        <TableHead className="font-semibold text-gray-600">Duration</TableHead>
                        <TableHead className="font-semibold text-gray-600">Exercises</TableHead>
                        <TableHead className="pr-6 text-right font-semibold text-gray-600">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                            Loading workout plans...
                          </TableCell>
                        </TableRow>
                      ) : filteredPlans.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-16 text-center text-sm text-muted-foreground"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="p-3 rounded-full bg-slate-100">
                                <Layers className="h-6 w-6 text-slate-400" />
                              </div>
                              <p>No workout templates found.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPlans.map((plan) => {
                          return (
                            <TableRow key={plan.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                              <TableCell className="pl-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{plan.name}</span>
                                  <span className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{plan.description}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 border shadow-sm ${plan.difficulty === 'beginner' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  plan.difficulty === 'intermediate' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    'bg-rose-50 text-rose-700 border-rose-100'
                                  }`}>
                                  {plan.difficulty}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center text-sm text-gray-600">
                                  <CalendarDays className="w-4 h-4 mr-2 text-gray-400" />
                                  {plan.durationWeeks} weeks
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge variant="secondary" className="font-bold text-[10px] bg-slate-100 text-slate-600">{plan.exercises?.length ?? 0} ITEMS</Badge>
                              </TableCell>
                              <TableCell className="pr-6 py-4 text-right">
                                <span className="text-xs text-gray-500 font-medium">{new Date(plan.createdAt).toLocaleDateString()}</span>
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

          <TabsContent value="staff" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-4">
                <CardTitle className="text-lg">Plans by difficulty</CardTitle>
                <CardDescription>Distribution of workout templates by difficulty.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {loading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Loading breakdown...</div>
                  ) : byDifficulty.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No workout plans available.</div>
                  ) : (
                    byDifficulty.map(([difficulty, count]) => (
                      <div
                        key={difficulty}
                        className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-slate-50 transition-colors bg-white shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-600' :
                            difficulty === 'intermediate' ? 'bg-blue-100 text-blue-600' :
                              'bg-rose-100 text-rose-600'
                            }`}>
                            <BarChart className="h-4 w-4" />
                          </div>
                          <span className="capitalize font-bold text-gray-700">{difficulty}</span>
                        </div>
                        <Badge variant="secondary" className="font-bold text-sm h-7 min-w-[32px] justify-center">
                          {count}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
