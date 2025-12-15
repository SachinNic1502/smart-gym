import mongoose, { Schema, type Model } from "mongoose";
import type { WorkoutPlan } from "@/lib/types";

export interface WorkoutPlanDocument extends WorkoutPlan, mongoose.Document {}

const WorkoutExerciseSchema = new Schema(
  {
    name: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: String, required: true },
    restSeconds: { type: Number, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const WorkoutPlanSchema = new Schema<WorkoutPlanDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, required: true },
    durationWeeks: { type: Number, required: true },
    exercises: { type: [WorkoutExerciseSchema], required: true },
    createdAt: { type: String, required: true },
  },
  {
    collection: "workout_plans",
  }
);

export const WorkoutPlanModel: Model<WorkoutPlanDocument> =
  (mongoose.models.WorkoutPlan as Model<WorkoutPlanDocument>) ||
  mongoose.model<WorkoutPlanDocument>("WorkoutPlan", WorkoutPlanSchema);
