"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Apple, Coffee, Sun, Moon, Utensils, TrendingUp, CheckCircle, Plus } from "lucide-react";
import { ApiError, meApi, plansApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast-provider";
import type { Member, DietPlan, DietMeal } from "@/lib/types";

interface NutritionLog {
  id: string;
  date: string;
  meals: Array<{
    type: "breakfast" | "lunch" | "dinner" | "snack";
    completed: boolean;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export default function MemberDietPage() {
  const { user } = useAuth();
  const branchId = user?.branchId;
  const toast = useToast();

  const [profile, setProfile] = useState<Member | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState<NutritionLog | null>(null);

  const loadData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch profile
      const profileRes = await meApi.getProfile();
      setProfile(profileRes);

      // Fetch diet plan if assigned
      if (profileRes?.dietPlanId) {
        const dietRes = await plansApi.getDietPlans();
        const dietPlan = dietRes.data.find(plan => plan.id === profileRes.dietPlanId);
        setDietPlan(dietPlan || null);

        // Load today's nutrition log (mock data for now)
        const today = new Date().toISOString().split('T')[0];
        const mockTodayLog: NutritionLog = {
          id: "1",
          date: today,
          meals: [
            { type: "breakfast", completed: false, calories: 450, protein: 25, carbs: 50, fat: 15 },
            { type: "lunch", completed: false, calories: 650, protein: 35, carbs: 60, fat: 25 },
            { type: "dinner", completed: false, calories: 550, protein: 30, carbs: 55, fat: 20 },
            { type: "snack", completed: false, calories: 200, protein: 10, carbs: 25, fat: 8 }
          ]
        };
        setTodayLog(mockTodayLog);
        setNutritionLogs([mockTodayLog]);
      }
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load diet data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completeMeal = (mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    if (!todayLog) return;

    const updatedLog = {
      ...todayLog,
      meals: todayLog.meals.map(meal =>
        meal.type === mealType ? { ...meal, completed: true } : meal
      )
    };

    setTodayLog(updatedLog);
    setNutritionLogs(prev => 
      prev.map(log => log.date === todayLog.date ? updatedLog : log)
    );

    toast({ 
      title: "Meal Logged", 
      description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} completed!`,
      variant: "success" 
    });
  };

  const getDailyProgress = () => {
    if (!todayLog) return 0;
    const completedMeals = todayLog.meals.filter(m => m.completed).length;
    return (completedMeals / todayLog.meals.length) * 100;
  };

  const getTodayCalories = () => {
    if (!todayLog) return 0;
    return todayLog.meals.filter(m => m.completed).reduce((sum, meal) => sum + meal.calories, 0);
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case "breakfast": return <Sun className="h-5 w-5" />;
      case "lunch": return <Coffee className="h-5 w-5" />;
      case "dinner": return <Moon className="h-5 w-5" />;
      case "snack": return <Apple className="h-5 w-5" />;
      default: return <Utensils className="h-5 w-5" />;
    }
  };

  const getMealByType = (mealType: string) => {
    if (!dietPlan?.meals) return null;
    return dietPlan.meals.find((meal, index) => {
      const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
      return mealTypes[index] === mealType;
    }) || null;
  };

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading diet plan...</div>;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!profile?.dietPlanId || !dietPlan) {
    return (
      <div className="space-y-6">
        <div className="text-center py-20">
          <Apple className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Diet Plan Assigned</h2>
          <p className="text-muted-foreground mb-6">
            Contact your trainer to get a personalized nutrition plan
          </p>
          <Button>Contact Trainer</Button>
        </div>
      </div>
    );
  }

  const dailyProgress = getDailyProgress();
  const todayCalories = getTodayCalories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Nutrition Plan</h1>
        <p className="text-muted-foreground">Track your daily nutrition</p>
      </div>

      {/* Nutrition Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Goal</p>
                <p className="text-2xl font-bold">{dietPlan.caloriesPerDay}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">calories</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consumed</p>
                <p className="text-2xl font-bold">{todayCalories}</p>
              </div>
              <Apple className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">calories today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">{Math.max(0, dietPlan.caloriesPerDay - todayCalories)}</p>
              </div>
              <Coffee className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">calories left</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{Math.round(dailyProgress)}%</p>
              </div>
              <Utensils className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={dailyProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Today's Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Today's Meals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
              const meal = getMealByType(mealType);
              const loggedMeal = todayLog?.meals.find(m => m.type === mealType);
              
              return (
                <div key={mealType} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getMealIcon(mealType)}
                      <h3 className="font-semibold capitalize">{mealType}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {loggedMeal?.completed && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {loggedMeal?.calories || meal?.calories || 0} cal
                      </Badge>
                    </div>
                  </div>

                  {meal && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{meal.time}</p>
                      
                      {meal.items && meal.items.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Recommended foods:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {meal.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-muted-foreground">
                          Protein: {loggedMeal?.protein || 0}g • 
                          Carbs: {loggedMeal?.carbs || 0}g • 
                          Fat: {loggedMeal?.fat || 0}g
                        </div>
                        {!loggedMeal?.completed && (
                          <Button
                            size="sm"
                            onClick={() => completeMeal(mealType as any)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Nutrition Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Stay Hydrated</h4>
              <p className="text-sm text-blue-700">Drink at least 8 glasses of water throughout the day.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Balanced Meals</h4>
              <p className="text-sm text-green-700">Include protein, carbs, and healthy fats in each meal.</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">Portion Control</h4>
              <p className="text-sm text-orange-700">Use smaller plates and eat slowly to recognize fullness.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Meal Timing</h4>
              <p className="text-sm text-purple-700">Eat every 3-4 hours to maintain energy levels.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
