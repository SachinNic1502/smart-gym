import mongoose, { Schema, type Model } from "mongoose";
import type { Lead } from "@/lib/types";

export interface LeadDocument extends Lead, mongoose.Document {}

const LeadSchema = new Schema<LeadDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    source: { type: String, required: true },
    status: { type: String, required: true },
    notes: { type: String },
    branchId: { type: String, required: true },
    assignedTo: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: "leads",
  }
);

export const LeadModel: Model<LeadDocument> =
  (mongoose.models.Lead as Model<LeadDocument>) ||
  mongoose.model<LeadDocument>("Lead", LeadSchema);
