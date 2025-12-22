"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Apple, GlassWater, Flame, Utensils, Clock, Trash2, Droplets } from "lucide-react";
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
import { meApi } from "@/lib/api/client";
import type { DietPlan, DietLog } from "@/lib/types";

export default function DietPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState<DietLog[]>([]);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [waterConsumed, setWaterConsumed] = useState(0);

  const [isLogMealOpen, setIsLogMealOpen] = useState(false);
  const [mealForm, setMealForm] = useState({ label: "", calories: 300 });

  async function loadData() {
    try {
      const [programs, summary] = await Promise.all([
        meApi.getMyPrograms(),
        meApi.getDietLogs() // Defaults to today
      ]);

      if (programs.dietPlan) {
        setPlan(programs.dietPlan);
      }

      setLogs(summary.logs);
      setCaloriesConsumed(summary.caloriesConsumed);
      setWaterConsumed(summary.waterConsumed); // Liters

    } catch (err) {
      console.error("Failed to load diet data:", err);
      // toast({ title: "Error", description: "Failed to load diet data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleLogFood = async () => {
    if (!mealForm.label || mealForm.calories <= 0) return;

    try {
      const summary = await meApi.logDietEntry({
        type: "food",
        label: mealForm.label,
        calories: Number(mealForm.calories)
      });

      setLogs(summary.logs);
      setCaloriesConsumed(summary.caloriesConsumed);
      setWaterConsumed(summary.waterConsumed);

      setIsLogMealOpen(false);
      setMealForm({ label: "", calories: 300 });
      toast({ title: "Meal logged!", variant: "success" });
    } catch (e) {
      toast({ title: "Failed to log meal", variant: "destructive" });
    }
  };

  const handleLogWater = async (amountMl: number = 250) => {
    try {
      const summary = await meApi.logDietEntry({
        type: "water",
        waterMl: amountMl,
        label: `${amountMl}ml Water`
      });

      setLogs(summary.logs);
      setCaloriesConsumed(summary.caloriesConsumed);
      setWaterConsumed(summary.waterConsumed);

      toast({ title: "Hydration logged!", variant: "success" });
    } catch (e) {
      toast({ title: "Failed to log water", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading diet plan...</div>;
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-slate-100 p-4 rounded-full">
          <Utensils className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold">No Diet Plan Assigned</h2>
        <p className="text-muted-foreground max-w-sm">
          It looks like your trainer hasn't assigned a diet plan yet.
          Please contact your branch admin or trainer.
        </p>
        <Button variant="outline" onClick={loadData}>Refresh</Button>
      </div>
    );
  }

  const { meals, caloriesPerDay } = plan;

  const NUTRITION_DATA = [
    { name: 'Consumed', value: caloriesConsumed, color: '#3b82f6' },
    { name: 'Remaining', value: Math.max(0, caloriesPerDay - caloriesConsumed), color: '#e2e8f0' },
  ];

  const recentFoodLogs = logs.filter(l => l.type === "food");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{plan.name}</h1>
          <p className="text-muted-foreground mt-1">
            {plan.description}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isLogMealOpen} onOpenChange={setIsLogMealOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Log Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Log a Meal</DialogTitle>
                <DialogDescription>
                  Track what you eat to stay on target.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="meal-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="meal-name"
                    value={mealForm.label}
                    placeholder="e.g. Chicken Salad"
                    className="col-span-3"
                    onChange={(e) => setMealForm({ ...mealForm, label: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="calories" className="text-right">
                    Calories
                  </Label>
                  <Input
                    id="calories"
                    type="number"
                    value={mealForm.calories}
                    className="col-span-3"
                    onChange={(e) => setMealForm({ ...mealForm, calories: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleLogFood}>Save Log</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Plan Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Daily Overview */}
          <Card className="border-none shadow-lg bg-white overflow-hidden rounded-3xl">
            <div className="grid md:grid-cols-2">
              <div className="p-8 flex flex-col justify-center bg-gradient-to-br from-slate-50 to-slate-100/50">
                <h2 className="text-xl font-bold mb-2">Daily Calorie Goal</h2>
                <div className="mb-4">
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-5xl font-extrabold text-slate-900">{caloriesConsumed}</span>
                    <span className="text-lg font-medium text-slate-400 mb-2">/ {caloriesPerDay} kcal</span>
                  </div>
                  <Progress value={(caloriesConsumed / caloriesPerDay) * 100} className="h-3" />
                </div>
                <p className="text-sm text-muted-foreground">
                  You have consumed {Math.round((caloriesConsumed / caloriesPerDay) * 100)}% of your daily goal.
                </p>
              </div>

              <div className="p-8 flex flex-col items-center justify-center relative">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={NUTRITION_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        {NUTRITION_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <Flame className="w-8 h-8 text-orange-500 mx-auto mb-1" />
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Logs & Suggested Meals */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              Today's Logs
            </h3>

            {recentFoodLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">No meals logged today yet.</p>
            ) : (
              <div className="space-y-2">
                {recentFoodLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-full">
                        <Utensils className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{log.label}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm">{log.calories} kcal</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                Your Diet Plan Menu
              </h3>
              <div className="space-y-4">
                {meals.map((meal, index) => (
                  <Card key={index} className="border-0 shadow-sm border-l-4 border-l-primary/30 hover:border-l-primary transition-all group">
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <Utensils className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-base">{meal.name}</h4>
                            <Badge variant="secondary" className="font-normal text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {meal.time}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {meal.items.map((item, idx) => (
                              <span key={idx} className="bg-slate-100 px-2 py-1 rounded text-slate-600 text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right sm:text-right min-w-[80px]">
                        <span className="block font-bold text-lg">{meal.calories}</span>
                        <span className="text-xs text-muted-foreground">Kcal</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-7 text-xs w-full border border-dashed"
                          onClick={() => {
                            setMealForm({ label: meal.name, calories: meal.calories || 300 });
                            setIsLogMealOpen(true);
                          }}
                        >
                          Log This
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hydration */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg bg-blue-50/50 overflow-hidden relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <GlassWater className="w-5 h-5" /> Hydration
              </CardTitle>
              <CardDescription>Daily water intake tracker</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="text-4xl font-bold text-blue-600 mb-2">{waterConsumed} L</div>
              <p className="text-sm text-blue-400 mb-6">/ 2.5 L Goal</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-100" onClick={() => handleLogWater(250)}>
                  + 250ml
                </Button>
                <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-100" onClick={() => handleLogWater(500)}>
                  + 500ml
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" /> Recent Water Logs
            </h4>
            <div className="space-y-2">
              {logs.filter(l => l.type === "water").slice(0, 5).map(log => (
                <div key={log.id} className="flex justify-between text-xs text-muted-foreground border-b border-dashed pb-1 last:border-0 last:pb-0">
                  <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>{log.waterMl} ml</span>
                </div>
              ))}
              {logs.filter(l => l.type === "water").length === 0 && (
                <p className="text-xs text-slate-400 italic">No water logged today</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
