import mongoose, { Schema, type Model } from "mongoose";
import type { GymClass } from "@/lib/types";

export interface GymClassDocument extends GymClass, mongoose.Document {}

const ClassScheduleSchema = new Schema(
  {
    dayOfWeek: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const GymClassSchema = new Schema<GymClassDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String },
    trainerId: { type: String, required: true },
    trainerName: { type: String, required: true },
    branchId: { type: String, required: true },
    capacity: { type: Number, required: true },
    enrolled: { type: Number, required: true },
    schedule: { type: [ClassScheduleSchema], required: true },
    status: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  {
    collection: "classes",
  }
);

export const GymClassModel: Model<GymClassDocument> =
  (mongoose.models.GymClass as Model<GymClassDocument>) ||
  mongoose.model<GymClassDocument>("GymClass", GymClassSchema);
