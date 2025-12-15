"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Target, TrendingUp, Play, CheckCircle, Dumbbell } from "lucide-react";
import { ApiError, meApi, plansApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast-provider";
import type { Member, WorkoutPlan, WorkoutExercise } from "@/lib/types";

interface WorkoutSession {
  id: string;
  workoutPlanId: string;
  date: string;
  completed: boolean;
  exercises: Array<{
    exerciseId: string;
    completed: boolean;
    sets: number;
    reps: number;
    weight?: number;
  }>;
}

export default function MemberWorkoutsPage() {
  const { user } = useAuth();
  const branchId = user?.branchId;
  const toast = useToast();

  const [profile, setProfile] = useState<Member | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<number>(0);

  const loadData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch profile
      const profileRes = await meApi.getProfile();
      setProfile(profileRes);

      // Fetch workout plan if assigned
      if (profileRes?.workoutPlanId) {
        const workoutRes = await plansApi.getWorkoutPlans();
        const workoutPlan = workoutRes.data.find(plan => plan.id === profileRes.workoutPlanId);
        setWorkoutPlan(workoutPlan || null);

        // Load sessions (mock data for now)
        const mockSessions: WorkoutSession[] = [
          {
            id: "1",
            workoutPlanId: profileRes.workoutPlanId,
            date: new Date().toISOString(),
            completed: false,
            exercises: []
          }
        ];
        setSessions(mockSessions);
      }
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load workout data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startWorkout = (dayIndex: number) => {
    if (!workoutPlan) return;
    
    setActiveDay(dayIndex);
    toast({ 
      title: "Workout Started", 
      description: `Day ${dayIndex + 1} workout started`,
      variant: "success" 
    });
  };

  const completeExercise = (exerciseIndex: number) => {
    // Update exercise completion status
    toast({ 
      title: "Exercise Completed", 
      description: "Great job! Keep going!",
      variant: "success" 
    });
  };

  const getWeeklyProgress = () => {
    if (!workoutPlan) return 0;
    const completedSessions = sessions.filter(s => s.completed).length;
    return (completedSessions / Math.min(workoutPlan.durationWeeks * 7, 30)) * 100;
  };

  const getTodayWorkout = () => {
    if (!workoutPlan || workoutPlan.exercises.length === 0) return null;
    const dayOfWeek = new Date().getDay();
    const workoutDay = dayOfWeek % workoutPlan.exercises.length;
    const exercise = workoutPlan.exercises[workoutDay];
    if (!exercise) return null;
    
    return {
      name: `Day ${workoutDay + 1} - ${exercise.name || 'Workout'}`,
      description: workoutPlan.description,
      difficulty: workoutPlan.difficulty,
      exercises: [exercise]
    };
  };

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading workouts...</div>;
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

  if (!profile?.workoutPlanId || !workoutPlan) {
    return (
      <div className="space-y-6">
        <div className="text-center py-20">
          <Dumbbell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Workout Plan Assigned</h2>
          <p className="text-muted-foreground mb-6">
            Contact your trainer to get a personalized workout plan
          </p>
          <Button>Contact Trainer</Button>
        </div>
      </div>
    );
  }

  const todayWorkout = getTodayWorkout();
  const progress = getWeeklyProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Workout Plans</h1>
        <p className="text-muted-foreground">Track your fitness journey</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Progress</p>
                <p className="text-2xl font-bold">{Math.round(progress)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{sessions.filter(s => s.completed).length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Workouts completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-bold">{workoutPlan.name}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{workoutPlan.durationWeeks} weeks</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      {todayWorkout && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Workout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{todayWorkout.name}</h3>
                  <p className="text-sm text-muted-foreground">{todayWorkout.description}</p>
                </div>
                <Badge variant="secondary">{todayWorkout.difficulty}</Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {todayWorkout.exercises?.length || 0} exercises
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {todayWorkout.difficulty}
                </div>
              </div>

              <Button 
                onClick={() => startWorkout(0)} 
                className="w-full"
                size="lg"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Workout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Workout Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workoutPlan.exercises?.map((exercise, dayIndex) => (
              <div key={dayIndex} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Day {dayIndex + 1}</h3>
                  <Badge variant={dayIndex === activeDay ? "default" : "outline"}>
                    {dayIndex === activeDay ? "Active" : "Scheduled"}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{workoutPlan.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{exercise.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.notes && ` • ${exercise.notes}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => completeExercise(dayIndex)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
