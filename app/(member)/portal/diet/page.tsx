"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Apple, GlassWater, Flame, Utensils, Clock, Trash2, Droplets, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { toast } = useToast();

  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState<DietLog[]>([]);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [waterConsumed, setWaterConsumed] = useState(0);

  const [isLogMealOpen, setIsLogMealOpen] = useState(false);
  const [mealForm, setMealForm] = useState({ label: "", calories: 300 });
  const [mealSearch, setMealSearch] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const localDate = new Date();
      const dateParam = localDate.toLocaleDateString('en-CA');

      const [programs, summary] = await Promise.all([
        meApi.getMyPrograms(),
        meApi.getDietLogs(dateParam)
      ]);

      if (programs.dietPlan) {
        setPlan(programs.dietPlan);
      } else {
        setPlan(null);
      }

      setLogs(summary.logs);
      setCaloriesConsumed(summary.caloriesConsumed);
      setWaterConsumed(summary.waterConsumed);

    } catch (err) {
      console.error("Failed to load diet data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

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
      setMealSearch("");
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
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-5 w-96 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-[300px] w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-[600px] rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center p-12 text-center space-y-6">
        <div className="bg-slate-100 p-8 rounded-full shadow-inner animate-bounce">
          <Utensils className="h-16 w-16 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800">Fuel Your Potential</h2>
          <p className="text-slate-500 max-w-sm font-medium">
            Your personalized nutrition strategy hasn't been mapped out yet.
            Connect with your trainer to unlock your diet plan.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} className="rounded-2xl px-8 h-12 font-bold flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Sync Now
        </Button>
      </div>
    );
  }

  const { meals, caloriesPerDay } = plan;
  const caloriesRemaining = Math.max(0, caloriesPerDay - caloriesConsumed);

  const NUTRITION_DATA = [
    { name: 'Consumed', value: caloriesConsumed, color: '#3b82f6' },
    { name: 'Remaining', value: caloriesRemaining, color: '#e2e8f0' },
  ];

  const recentFoodLogs = logs.filter(l => l.type === "food");

  return (
    <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header with Title & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">{plan.name}</h1>
          <p className="text-slate-500 font-medium max-w-xl">
            {plan.description}
          </p>
        </div>

        <Dialog open={isLogMealOpen} onOpenChange={setIsLogMealOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10 font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
              <Plus className="w-5 h-5" /> Log Daily Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
            <DialogHeader className="p-8 pb-4 bg-slate-50">
              <DialogTitle className="text-2xl font-black text-slate-900">Add Meal Entry</DialogTitle>
              <DialogDescription className="font-medium">
                Track your intake from your plan or enter custom details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 p-8 pt-2">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Search Your Plan</Label>
                <div className="relative">
                  <Input
                    placeholder="Search breakfast, lunch, etc..."
                    value={mealSearch}
                    onChange={(e) => setMealSearch(e.target.value)}
                    className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all pl-4"
                  />
                  {mealSearch && (
                    <div className="absolute top-14 left-0 right-0 z-50 border border-slate-100 rounded-2xl divide-y bg-white shadow-2xl overflow-hidden max-h-[220px] overflow-y-auto">
                      {meals
                        .filter(m => m.name.toLowerCase().includes(mealSearch.toLowerCase()))
                        .map((m, i) => (
                          <div
                            key={i}
                            className="p-4 text-sm hover:bg-slate-50 cursor-pointer flex justify-between items-center group transition-colors"
                            onClick={() => {
                              setMealForm({ label: m.name, calories: m.calories || 0 });
                              setMealSearch("");
                            }}
                          >
                            <span className="font-bold text-slate-700 group-hover:text-blue-600">{m.name}</span>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-0">{m.calories} kcal</Badge>
                          </div>
                        ))}
                      {meals.filter(m => m.name.toLowerCase().includes(mealSearch.toLowerCase())).length === 0 && (
                        <div className="p-6 text-center text-xs text-slate-400 font-medium">
                          Not in your plan? Try manual entry below.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative h-px bg-slate-100 my-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">OR</span>
                </div>
              </div>

              <div className="grid gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Custom Meal Name</Label>
                  <Input
                    value={mealForm.label}
                    placeholder="e.g. Grilled Salmon"
                    className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all"
                    onChange={(e) => setMealForm({ ...mealForm, label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Calories (kcal)</Label>
                  <Input
                    type="number"
                    value={mealForm.calories}
                    className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all"
                    onChange={(e) => setMealForm({ ...mealForm, calories: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
              <Button type="button" onClick={handleLogFood} className="h-12 w-full rounded-2xl bg-blue-600 font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20">Record Log</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">

          {/* Daily Goal Overview Card */}
          <Card className="border-0 shadow-2xl bg-white overflow-hidden rounded-[40px]">
            <div className="grid md:grid-cols-2">
              <div className="p-10 flex flex-col justify-center bg-gradient-to-br from-slate-50 to-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6 w-fit">
                  Nutrition Progress
                </div>
                <div className="space-y-2 mb-8">
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Daily Calorie Target</h2>
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-black text-slate-900 tracking-tighter">{caloriesConsumed}</span>
                    <span className="text-xl font-bold text-slate-300">/ {caloriesPerDay} kcal</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Progress value={(caloriesConsumed / caloriesPerDay) * 100} className="h-4 bg-slate-100" />
                  <div className="flex justify-between items-center text-xs font-bold tracking-wide">
                    <span className="text-slate-400 uppercase">Energy Spent</span>
                    <span className="text-blue-600 uppercase">{caloriesRemaining} kcal Left</span>
                  </div>
                </div>
              </div>

              <div className="p-10 flex flex-col items-center justify-center relative bg-white">
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={NUTRITION_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={100}
                        paddingAngle={5}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        {NUTRITION_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="h-16 w-16 rounded-3xl bg-orange-50 flex items-center justify-center shadow-lg shadow-orange-500/10">
                    <Flame className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Today's Timeline */}
          <section className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-orange-600" />
              </div>
              Today's Timeline
            </h3>

            {recentFoodLogs.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                <p className="text-slate-400 font-medium italic">Start tracking your journey. Log your first meal today.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {recentFoodLogs.map((log) => (
                  <Card key={log.id} className="border-0 shadow-sm rounded-2xl bg-white hover:shadow-md transition-all group overflow-hidden">
                    <div className="flex">
                      <div className="w-1.5 bg-orange-200 group-hover:bg-orange-500 transition-all"></div>
                      <div className="flex-1 p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-orange-50 transition-colors">
                            <Clock className="h-4 w-4 text-slate-400 group-hover:text-orange-500" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-base">{log.label}</p>
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-slate-900">{log.calories}</span>
                          <span className="text-[10px] font-bold text-slate-400 block -mt-1 tracking-widest uppercase">Kcal</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Plan Menu Section */}
            <div className="pt-10 space-y-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Apple className="h-5 w-5 text-indigo-600" />
                  </div>
                  Program Menu
                </h3>
              </div>

              <div className="grid gap-6">
                {meals.map((meal, index) => (
                  <Card key={index} className="group border-0 shadow-lg rounded-3xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500">
                    <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex items-start gap-6">
                        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-all duration-500 group-hover:rotate-6">
                          <Utensils className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-black text-xl text-slate-900">{meal.name}</h4>
                              <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-0 font-bold text-[10px] tracking-widest px-2 py-0.5">
                                <Clock className="w-3 h-3 mr-1" /> {meal.time}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {meal.items.map((item, idx) => (
                              <span key={idx} className="bg-slate-50 group-hover:bg-indigo-50/50 px-3 py-1.5 rounded-xl text-slate-500 group-hover:text-indigo-600 text-[11px] font-bold tracking-tight transition-colors">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 min-w-[120px]">
                        <div className="text-right">
                          <span className="block font-black text-3xl text-slate-900">{meal.calories}</span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] block -mt-1">Kcal Energy</span>
                        </div>
                        <Button
                          onClick={() => {
                            setMealForm({ label: meal.name, calories: meal.calories || 300 });
                            setIsLogMealOpen(true);
                          }}
                          className="w-full rounded-xl h-10 bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white font-bold transition-all border-0 shadow-none"
                        >
                          Quick Log
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar: Hydration & Tools */}
        <div className="space-y-8">
          <Card className="border-0 shadow-2xl bg-[#eff6ff] rounded-[40px] overflow-hidden relative group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>

            <CardHeader className="p-8 pb-0 pb-2">
              <CardTitle className="flex items-center gap-3 text-blue-800 font-black text-xl">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <GlassWater className="w-5 h-5" />
                </div>
                Hydration
              </CardTitle>
              <CardDescription className="text-blue-500/70 font-bold text-xs uppercase tracking-widest">Liquid Intake Counter</CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center bg-white/50 backdrop-blur-md mx-6 mb-8 mt-4 rounded-3xl border border-white/50 shadow-xl shadow-blue-500/5">
              <div className="text-6xl font-black text-blue-600 tracking-tighter mb-2">{waterConsumed}<span className="text-2xl ml-1">L</span></div>
              <p className="text-blue-400 font-bold text-sm tracking-wide mb-8">Target: 2.5 Liters</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleLogWater(250)}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all duration-300 group/btn"
                >
                  <Plus className="w-4 h-4 text-blue-400 group-hover/btn:text-white" />
                  <span className="text-xs font-black">250ML</span>
                </button>
                <button
                  onClick={() => handleLogWater(500)}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all duration-300 group/btn"
                >
                  <Plus className="w-4 h-4 text-blue-400 group-hover/btn:text-white" />
                  <span className="text-xs font-black">500ML</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Water Activity */}
          <div className="bg-white p-8 rounded-[40px] border shadow-2xl space-y-6">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-3 uppercase tracking-widest">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
              Recent Hydration
            </h4>
            <div className="space-y-4">
              {logs.filter(l => l.type === "water").slice(0, 5).map(log => (
                <div key={log.id} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Droplets className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className="font-black text-blue-600">{log.waterMl} ml</span>
                </div>
              ))}
              {logs.filter(l => l.type === "water").length === 0 && (
                <div className="py-6 text-center">
                  <Droplets className="h-8 w-8 text-slate-100 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Drink more water</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
