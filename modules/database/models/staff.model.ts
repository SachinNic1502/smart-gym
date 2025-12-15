import mongoose, { Schema, type Model } from "mongoose";
import type { Staff } from "@/lib/types";

export interface StaffDocument extends Staff, mongoose.Document {}

const StaffSchema = new Schema<StaffDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true },
    branchId: { type: String, required: true },
    branchName: { type: String },
    salary: { type: Number },
    joiningDate: { type: String, required: true },
    status: { type: String, required: true },
    avatar: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: "staff",
  }
);

export const StaffModel: Model<StaffDocument> =
  (mongoose.models.Staff as Model<StaffDocument>) ||
  mongoose.model<StaffDocument>("Staff", StaffSchema);
