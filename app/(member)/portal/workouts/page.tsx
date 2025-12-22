"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dumbbell, Clock, Flame, Calendar, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { meApi } from "@/lib/api/client";
import type { WorkoutPlan } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getEmbedUrl(url: string) {
  if (!url) return "";
  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }
  if (url.includes("youtu.be/")) {
    return url.replace("youtu.be/", "www.youtube.com/embed/");
  }
  return url;
}

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const data = await meApi.getMyPrograms();
        if (data.workoutPlan) {
          setPlan(data.workoutPlan);
        }
      } catch (err) {
        console.error("Failed to load workout plan:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchPlan();
    }
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center">Loading workout program...</div>;
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-slate-100 p-4 rounded-full">
          <Dumbbell className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold">No Workout Plan Assigned</h2>
        <p className="text-muted-foreground max-w-sm">
          Contact your trainer to get a personalized workout plan assigned to your profile.
        </p>
        <Button variant="outline">Refresh</Button>
      </div>
    );
  }

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
        <div>
          <Badge className="text-base px-3 py-1 capitalize" variant={
            plan.difficulty === 'advanced' ? 'destructive' :
              plan.difficulty === 'intermediate' ? 'default' : 'secondary'
          }>
            {plan.difficulty} Level
          </Badge>
        </div>
      </div>

      {/* Program Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 text-white border-none">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Calendar className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{plan.durationWeeks}</div>
            <div className="text-xs text-zinc-400">Weeks Duration</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 text-white border-none">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Dumbbell className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{plan.exercises.length}</div>
            <div className="text-xs text-zinc-400">Exercises</div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Exercises</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plan.exercises.map((exercise, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-lg line-clamp-1">{exercise.name}</h4>
                    <Badge variant="outline">{exercise.sets} Sets</Badge>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground bg-slate-50 p-2 rounded">
                      <span>Reps</span>
                      <span className="font-medium text-slate-900">{exercise.reps}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground bg-slate-50 p-2 rounded">
                      <span>Rest</span>
                      <span className="font-medium text-slate-900">{exercise.restSeconds}s</span>
                    </div>
                    {exercise.notes && (
                      <div className="mt-3 text-xs text-slate-500 italic border-l-2 border-primary pl-2">
                        "{exercise.notes}"
                      </div>
                    )}
                  </div>

                  {exercise.videoUrl && (
                    <Button
                      className="w-full mt-4"
                      variant="secondary"
                      onClick={() => setSelectedVideo({ url: exercise.videoUrl!, title: exercise.name })}
                    >
                      <Play className="w-4 h-4 mr-2" /> Watch Tutorial
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 bg-black overflow-hidden">
          <DialogHeader className="p-4 bg-white/10 absolute top-0 left-0 right-0 z-10 backdrop-blur-sm">
            <DialogTitle className="text-white text-shadow">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black flex items-center justify-center">
            {selectedVideo && (
              <iframe
                width="100%"
                height="100%"
                src={getEmbedUrl(selectedVideo.url)}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
