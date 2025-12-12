import mongoose, { Schema, type Model } from "mongoose";
import type { MembershipPlan } from "@/lib/types";

export interface MembershipPlanDocument extends MembershipPlan, Document {}

const MembershipPlanSchema = new Schema<MembershipPlanDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    durationDays: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    features: { type: [String], required: true },
    isActive: { type: Boolean, required: true },
  },
  {
    collection: "membership_plans",
  }
);

export const MembershipPlanModel: Model<MembershipPlanDocument> =
  (mongoose.models.MembershipPlan as Model<MembershipPlanDocument>) ||
  mongoose.model<MembershipPlanDocument>("MembershipPlan", MembershipPlanSchema);
