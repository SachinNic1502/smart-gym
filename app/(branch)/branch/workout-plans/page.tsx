"use client";

import { useState } from "react";
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

const MOCK_WORKOUT_PLANS = [
  {
    id: "WKP-001",
    name: "Beginner Full Body",
    goal: "General fitness",
    sessionsPerWeek: 3,
    duration: "6 weeks",
    owner: "Coach Neha",
  },
  {
    id: "WKP-002",
    name: "Strength Split",
    goal: "Strength",
    sessionsPerWeek: 4,
    duration: "8 weeks",
    owner: "Coach Rahul",
  },
  {
    id: "WKP-003",
    name: "Fat Loss HIIT",
    goal: "Fat loss",
    sessionsPerWeek: 5,
    duration: "4 weeks",
    owner: "Coach Ankit",
  },
];

export default function BranchWorkoutPlansPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({ name: "", goal: "", sessions: "" });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const toast = useToast();

  const handleSaveWorkout = () => {
    if (!workoutForm.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter a workout plan name before saving.",
        variant: "warning",
      });
      return;
    }

    setIsCreateOpen(false);
    setWorkoutForm({ name: "", goal: "", sessions: "" });
    const message = "Workout plan created (mock). In a real app this would save to your backend.";
    setSaveMessage(message);
    toast({ title: "Workout plan saved", description: message, variant: "success" });
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
            onClick={() =>
              toast({
                title: "Export workouts",
                description: "Exporting workout templates will be added later (mock-only).",
                variant: "info",
              })
            }
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
                  Define a reusable workout template. This is mock-only for now and does not persist.
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-t-4 border-t-primary/30">
          <CardHeader className="pb-2 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Active workout templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{MOCK_WORKOUT_PLANS.length}</p>
            <p className="text-[11px] text-muted-foreground">Used across classes and PT sessions.</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-emerald-300">
          <CardHeader className="pb-2 flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-sm">Members on plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">57</p>
            <p className="text-[11px] text-muted-foreground">Mock metric for demo.</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-amber-300">
          <CardHeader className="pb-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-sm">Average session length</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">55 min</p>
            <p className="text-[11px] text-muted-foreground">Based on last 30 sessions.</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Templates</TabsTrigger>
          <TabsTrigger value="staff">By Staff</TabsTrigger>
        </TabsList>

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
                  {MOCK_WORKOUT_PLANS.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-6 text-center text-xs text-muted-foreground"
                      >
                        No workout templates yet. Use "Create Workout Plan" to add your first template (mock-only).
                      </TableCell>
                    </TableRow>
                  ) : (
                    MOCK_WORKOUT_PLANS.map((plan) => {
                      let hint = "Balanced program";

                      if (plan.goal === "Strength") {
                        hint = "Emphasizes progressive overload and heavy lifts.";
                      } else if (plan.goal === "Fat loss") {
                        hint = "Higher frequency and intensity for calorie burn.";
                      } else if (plan.goal === "General fitness") {
                        hint = "All-round program for consistency and habit-building.";
                      }

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
                              {plan.goal}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{plan.sessionsPerWeek}</TableCell>
                          <TableCell className="text-sm">{plan.duration}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {plan.owner}
                            <span className="block text-[10px] text-muted-foreground/80">{hint}</span>
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
              <CardTitle>Plans by staff</CardTitle>
              <CardDescription>Mock breakdown of how many members each trainer is handling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { name: "Coach Neha", members: 18 },
                { name: "Coach Rahul", members: 22 },
                { name: "Coach Ankit", members: 17 },
              ].map((staff) => {
                let hint = "Balanced coaching load";

                if (staff.members >= 20) {
                  hint = "High coaching load across members.";
                } else if (staff.members <= 10) {
                  hint = "Light roster, capacity for more members.";
                }

                return (
                  <div
                    key={staff.name}
                    className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span>{staff.name}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">{staff.members} members</span>
                      <span className="text-[10px] text-muted-foreground/80">{hint}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
