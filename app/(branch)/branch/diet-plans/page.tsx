"use client";

import { useState } from "react";
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

const MOCK_DIET_PLANS = [
  {
    id: "DIET-001",
    name: "Fat Loss Basics",
    goal: "Weight loss",
    duration: "8 weeks",
    calories: "1,800 kcal/day",
    owner: "Branch Nutritionist",
  },
  {
    id: "DIET-002",
    name: "Muscle Gain Pro",
    goal: "Muscle gain",
    duration: "12 weeks",
    calories: "2,400 kcal/day",
    owner: "Head Coach",
  },
  {
    id: "DIET-003",
    name: "General Wellness",
    goal: "Lifestyle",
    duration: "4 weeks",
    calories: "2,000 kcal/day",
    owner: "Branch Nutritionist",
  },
];
export default function BranchDietPlansPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dietForm, setDietForm] = useState({ name: "", goal: "", calories: "" });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const toast = useToast();

  const handleSaveDiet = () => {
    if (!dietForm.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter a diet plan name before saving.",
        variant: "warning",
      });
      return;
    }

    setIsCreateOpen(false);
    setDietForm({ name: "", goal: "", calories: "" });
    const message = "Diet plan created (mock). In a real app this would save to your backend.";
    setSaveMessage(message);
    toast({ title: "Diet plan saved", description: message, variant: "success" });
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
            onClick={() =>
              toast({
                title: "Diet guidelines",
                description:
                  "Guideline documents will be added later. For now, use your internal SOPs (mock).",
                variant: "info",
              })
            }
          >
            View Guidelines
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Create Diet Plan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Create Diet Plan</DialogTitle>
                <DialogDescription>
                  Define a reusable diet template. This is mock-only for now and does not persist.
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-t-4 border-t-emerald-200">
          <CardHeader className="pb-2 flex items-center gap-2">
            <Salad className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-sm">Active diet templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{MOCK_DIET_PLANS.length}</p>
            <p className="text-[11px] text-muted-foreground">Ready to assign to members.</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-200">
          <CardHeader className="pb-2 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm">Members on diet plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">34</p>
            <p className="text-[11px] text-muted-foreground">Mock count for demo purposes.</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-amber-200">
          <CardHeader className="pb-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-sm">Check-in overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">6</p>
            <p className="text-[11px] text-muted-foreground">Members who missed last diet review.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Diet templates</CardTitle>
          <CardDescription>Standardized plans that your staff can personalize per member.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Calories</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DIET_PLANS.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-xs text-muted-foreground"
                  >
                    No diet templates yet. Use "Create Diet Plan" to add your first template (mock-only).
                  </TableCell>
                </TableRow>
              ) : (
                MOCK_DIET_PLANS.map((plan) => {
                  let hint = "General purpose template";

                  if (plan.goal === "Weight loss") {
                    hint = "Focus on calorie deficit and adherence.";
                  } else if (plan.goal === "Muscle gain") {
                    hint = "Higher calories to support hypertrophy.";
                  } else if (plan.goal === "Lifestyle") {
                    hint = "Balanced plan for long-term habits.";
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
                      <TableCell className="text-sm">{plan.duration}</TableCell>
                      <TableCell className="text-sm">{plan.calories}</TableCell>
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
    </div>
  );
}
