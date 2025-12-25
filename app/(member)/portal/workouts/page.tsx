"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dumbbell, Clock, Flame, Calendar, Play, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { meApi } from "@/lib/api/client";
import { cn } from "@/lib/utils";
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

  const fetchPlan = async () => {
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
  };

  useEffect(() => {
    if (user) {
      fetchPlan();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center p-12 text-center space-y-6">
        <div className="bg-slate-100 p-8 rounded-full shadow-inner animate-bounce">
          <Dumbbell className="h-16 w-16 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800">No Mission Assigned</h2>
          <p className="text-slate-500 max-w-sm font-medium">
            Your custom training regimen hasn't been drafted yet.
            Speak with your coach to start your transformation.
          </p>
        </div>
        <Button variant="outline" onClick={fetchPlan} className="rounded-2xl px-8 h-12 font-bold flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Sync Program
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-[40px] bg-slate-900 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]"></div>

        <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-4">
            <Badge className="bg-blue-600 text-white font-black text-[10px] tracking-[0.2em] px-4 py-1 rounded-full border-0 uppercase">
              {plan.difficulty} Intensity Protocol
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
              {plan.name}
            </h1>
            <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
              {plan.description}
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Duration</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{plan.durationWeeks}</span>
              <span className="text-xl font-bold text-slate-500">Weeks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Activity, label: "Volume", value: `${plan.exercises.length} Exercises`, color: "bg-blue-50 text-blue-600" },
          { icon: Flame, label: "Effort", value: plan.difficulty?.toUpperCase(), color: "bg-orange-50 text-orange-600" },
          { icon: Clock, label: "Commitment", value: `${plan.durationWeeks} Weeks`, color: "bg-indigo-50 text-indigo-600" },
          { icon: Play, label: "Tutorials", value: "Video Guides", color: "bg-emerald-50 text-emerald-600" },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-lg rounded-3xl bg-white group hover:scale-105 transition-all duration-300">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-12", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-lg font-black text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Strategic List */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
            <div className="h-2 w-8 bg-blue-600 rounded-full"></div>
            Exercise Selection
          </h3>
          <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold rounded-xl px-4 py-1">
            {plan.exercises.length} MOVEMENTS
          </Badge>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {plan.exercises.map((exercise, index) => (
            <Card key={index} className="group border-0 shadow-xl rounded-[32px] overflow-hidden bg-white hover:shadow-2xl transition-all duration-500">
              <CardContent className="p-0">
                <div className="relative h-48 bg-slate-900 overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&fit=crop`}
                    className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                    alt={exercise.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

                  <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                    <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white font-black">
                      {index + 1}
                    </div>
                    <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 font-black px-4 py-1 rounded-full uppercase text-[10px] tracking-widest">
                      {exercise.sets} Sets
                    </Badge>
                  </div>

                  <div className="absolute bottom-6 left-6">
                    <h4 className="font-black text-2xl text-white tracking-tight group-hover:text-blue-400 transition-colors uppercase">
                      {exercise.name}
                    </h4>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-blue-50 transition-colors">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-400">Repetitions</div>
                      <div className="text-xl font-black text-slate-800">{exercise.reps}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-400">Recovery</div>
                      <div className="text-xl font-black text-slate-800">{exercise.restSeconds}s</div>
                    </div>
                  </div>

                  {exercise.notes && (
                    <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-blue-500 text-sm font-medium text-slate-600 leading-relaxed group-hover:bg-white group-hover:shadow-inner transition-all">
                      {exercise.notes}
                    </div>
                  )}

                  {exercise.videoUrl && (
                    <Button
                      onClick={() => setSelectedVideo({ url: exercise.videoUrl!, title: exercise.name })}
                      className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black hover:bg-blue-600 transition-all shadow-lg group-hover:scale-105 active:scale-95 border-0 flex items-center gap-3"
                    >
                      <Play className="w-5 h-5 fill-current" /> EXECUTION GUIDE
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="sm:max-w-[900px] p-0 bg-[#0F172A] overflow-hidden rounded-[32px] border-0 shadow-2xl">
          <div className="p-8 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl border-b border-white/5">
            <div>
              <h3 className="text-white font-black text-2xl tracking-tight">{selectedVideo?.title}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Movement Execution Masterclass</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setSelectedVideo(null)}
              className="text-white hover:bg-white/10 rounded-xl"
            >
              Close
            </Button>
          </div>
          <div className="aspect-video w-full bg-black relative">
            {selectedVideo && (
              <iframe
                width="100%"
                height="100%"
                src={getEmbedUrl(selectedVideo.url)}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="relative z-10"
              ></iframe>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <Dumbbell className="h-20 w-20 text-slate-800 animate-pulse" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
