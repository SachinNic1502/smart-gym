import mongoose, { Schema, type Model } from "mongoose";
import type { Member } from "@/lib/types";

export interface MemberDocument extends Member, Document { }

const MemberSchema = new Schema<MemberDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, required: true },
    dateOfBirth: { type: String },
    address: { type: String },
    plan: { type: String, required: true },
    status: { type: String, required: true },
    expiryDate: { type: String, required: true },
    lastVisit: { type: String },
    image: { type: String },
    branchId: { type: String, required: true },
    workoutPlanId: { type: String },
    dietPlanId: { type: String },
    trainerId: { type: String },
    referralSource: { type: String },
    notes: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: "members",
  }
);

export const MemberModel: Model<MemberDocument> =
  (mongoose.models.Member as Model<MemberDocument>) ||
  mongoose.model<MemberDocument>("Member", MemberSchema);
