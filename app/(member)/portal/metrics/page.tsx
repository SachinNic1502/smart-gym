"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { 
  Weight, 
  Ruler, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Calendar,
  Target,
  Activity,
  Heart
} from "lucide-react";
import { ApiError, meApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast-provider";
import type { Member } from "@/lib/types";

interface BodyMetric {
  id: string;
  date: string;
  weight: number;
  height: number;
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
}

interface FitnessGoal {
  id: string;
  type: "weight_loss" | "muscle_gain" | "endurance" | "strength";
  target: number;
  current: number;
  unit: string;
  deadline: string;
}

export default function MemberMetricsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState<Member | null>(null);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetric, setNewMetric] = useState({
    weight: "",
    bodyFat: "",
    muscleMass: "",
    waist: "",
    chest: "",
    arms: "",
    thighs: "",
    notes: ""
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch profile
      const profileRes = await meApi.getProfile();
      setProfile(profileRes);

      // Mock metrics data (in real app, would fetch from API)
      const mockMetrics: BodyMetric[] = [
        {
          id: "1",
          date: "2024-01-01",
          weight: 75,
          height: 175,
          bodyFat: 18,
          muscleMass: 55,
          waist: 80,
          chest: 95,
          arms: 35,
          thighs: 50
        },
        {
          id: "2",
          date: "2024-01-15",
          weight: 74.5,
          height: 175,
          bodyFat: 17.5,
          muscleMass: 55.5,
          waist: 79,
          chest: 94.5,
          arms: 35.5,
          thighs: 50.5
        }
      ];
      setMetrics(mockMetrics);

      // Mock goals data
      const mockGoals: FitnessGoal[] = [
        {
          id: "1",
          type: "weight_loss",
          target: 70,
          current: 74.5,
          unit: "kg",
          deadline: "2024-03-01"
        },
        {
          id: "2",
          type: "muscle_gain",
          target: 60,
          current: 55.5,
          unit: "kg",
          deadline: "2024-04-01"
        }
      ];
      setGoals(mockGoals);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load metrics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addMetric = async () => {
    if (!newMetric.weight) {
      toast({ title: "Error", description: "Weight is required", variant: "destructive" });
      return;
    }

    const metric: BodyMetric = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(newMetric.weight),
      height: 175, // Default height in cm
      bodyFat: newMetric.bodyFat ? parseFloat(newMetric.bodyFat) : undefined,
      muscleMass: newMetric.muscleMass ? parseFloat(newMetric.muscleMass) : undefined,
      waist: newMetric.waist ? parseFloat(newMetric.waist) : undefined,
      chest: newMetric.chest ? parseFloat(newMetric.chest) : undefined,
      arms: newMetric.arms ? parseFloat(newMetric.arms) : undefined,
      thighs: newMetric.thighs ? parseFloat(newMetric.thighs) : undefined,
      notes: newMetric.notes
    };

    setMetrics([metric, ...metrics]);
    setShowAddMetric(false);
    setNewMetric({
      weight: "",
      bodyFat: "",
      muscleMass: "",
      waist: "",
      chest: "",
      arms: "",
      thighs: "",
      notes: ""
    });

    toast({ 
      title: "Metric Added", 
      description: "Your body metrics have been recorded",
      variant: "success" 
    });
  };

  const getWeightTrend = () => {
    if (metrics.length < 2) return "stable";
    const recent = metrics.slice(-2);
    if (recent[1].weight < recent[0].weight) return "decreasing";
    if (recent[1].weight > recent[0].weight) return "increasing";
    return "stable";
  };

  const getBMI = () => {
    if (metrics.length === 0) return 0;
    const latestMetric = metrics[0];
    return latestMetric.weight / Math.pow(latestMetric.height / 100, 2);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const chartData = metrics.map(metric => ({
    date: new Date(metric.date).toLocaleDateString(),
    weight: metric.weight,
    bodyFat: metric.bodyFat || 0,
    muscleMass: metric.muscleMass || 0
  })).reverse();

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading metrics...</div>;
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

  const weightTrend = getWeightTrend();
  const bmi = getBMI();
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Body Metrics</h1>
          <p className="text-muted-foreground">Track your physical progress</p>
        </div>
        <Button onClick={() => setShowAddMetric(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Measurement
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-2xl font-bold">{metrics[0]?.weight || 0} kg</p>
              </div>
              <div className="flex items-center gap-1">
                {weightTrend === "decreasing" ? (
                  <TrendingDown className="h-6 w-6 text-green-500" />
                ) : weightTrend === "increasing" ? (
                  <TrendingUp className="h-6 w-6 text-red-500" />
                ) : (
                  <Activity className="h-6 w-6 text-blue-500" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 capitalize">{weightTrend}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">BMI</p>
                <p className="text-2xl font-bold">{bmi.toFixed(1)}</p>
              </div>
              <Heart className="h-6 w-6 text-pink-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{bmiCategory}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Body Fat</p>
                <p className="text-2xl font-bold">{metrics[0]?.bodyFat || 0}%</p>
              </div>
              <Target className="h-6 w-6 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Healthy range</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Muscle Mass</p>
                <p className="text-2xl font-bold">{metrics[0]?.muscleMass || 0} kg</p>
              </div>
              <Activity className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Lean tissue</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Goals */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Body Composition</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="bodyFat" stroke="#EF4444" strokeWidth={2} name="Body Fat %" />
                  <Line type="monotone" dataKey="muscleMass" stroke="#10B981" strokeWidth={2} name="Muscle Mass" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold capitalize">
                      {goal.type.replace('_', ' ')}
                    </h3>
                    <Badge variant="outline">
                      {goal.current} / {goal.target} {goal.unit}
                    </Badge>
                  </div>
                  <Progress 
                    value={(goal.current / goal.target) * 100} 
                    className="mb-2" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Measurement History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div key={metric.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {new Date(metric.date).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="outline">{metric.weight} kg</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Body Fat:</span>
                        <span className="ml-2">{metric.bodyFat || 0}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Muscle:</span>
                        <span className="ml-2">{metric.muscleMass || 0} kg</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Waist:</span>
                        <span className="ml-2">{metric.waist || 0} cm</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Chest:</span>
                        <span className="ml-2">{metric.chest || 0} cm</span>
                      </div>
                    </div>
                    {metric.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{metric.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Metric Dialog */}
      {showAddMetric && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Add New Measurement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={newMetric.weight}
                  onChange={(e) => setNewMetric({ ...newMetric, weight: e.target.value })}
                  placeholder="70.5"
                />
              </div>
              <div>
                <Label htmlFor="bodyFat">Body Fat (%)</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  step="0.1"
                  value={newMetric.bodyFat}
                  onChange={(e) => setNewMetric({ ...newMetric, bodyFat: e.target.value })}
                  placeholder="18.5"
                />
              </div>
              <div>
                <Label htmlFor="muscleMass">Muscle Mass (kg)</Label>
                <Input
                  id="muscleMass"
                  type="number"
                  step="0.1"
                  value={newMetric.muscleMass}
                  onChange={(e) => setNewMetric({ ...newMetric, muscleMass: e.target.value })}
                  placeholder="55.0"
                />
              </div>
              <div>
                <Label htmlFor="waist">Waist (cm)</Label>
                <Input
                  id="waist"
                  type="number"
                  step="0.1"
                  value={newMetric.waist}
                  onChange={(e) => setNewMetric({ ...newMetric, waist: e.target.value })}
                  placeholder="80.0"
                />
              </div>
              <div>
                <Label htmlFor="chest">Chest (cm)</Label>
                <Input
                  id="chest"
                  type="number"
                  step="0.1"
                  value={newMetric.chest}
                  onChange={(e) => setNewMetric({ ...newMetric, chest: e.target.value })}
                  placeholder="95.0"
                />
              </div>
              <div>
                <Label htmlFor="arms">Arms (cm)</Label>
                <Input
                  id="arms"
                  type="number"
                  step="0.1"
                  value={newMetric.arms}
                  onChange={(e) => setNewMetric({ ...newMetric, arms: e.target.value })}
                  placeholder="35.0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={newMetric.notes}
                onChange={(e) => setNewMetric({ ...newMetric, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addMetric}>Save Measurement</Button>
              <Button variant="outline" onClick={() => setShowAddMetric(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
