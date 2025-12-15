import mongoose, { Schema, type Model } from "mongoose";
import type { DietPlan } from "@/lib/types";

export interface DietPlanDocument extends DietPlan, mongoose.Document {}

const DietMealSchema = new Schema(
  {
    name: { type: String, required: true },
    time: { type: String, required: true },
    items: { type: [String], required: true },
    calories: { type: Number, required: true },
  },
  { _id: false }
);

const DietPlanSchema = new Schema<DietPlanDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    caloriesPerDay: { type: Number, required: true },
    meals: { type: [DietMealSchema], required: true },
    createdAt: { type: String, required: true },
  },
  {
    collection: "diet_plans",
  }
);

export const DietPlanModel: Model<DietPlanDocument> =
  (mongoose.models.DietPlan as Model<DietPlanDocument>) ||
  mongoose.model<DietPlanDocument>("DietPlan", DietPlanSchema);
