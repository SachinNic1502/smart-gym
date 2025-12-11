import mongoose, { Schema, type Model } from "mongoose";
import type { Branch } from "@/lib/types";

export interface BranchDocument extends Branch, Document {}

const BranchSchema = new Schema<BranchDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    status: { type: String, required: true },
    memberCount: { type: Number, required: true },
    deviceCount: { type: Number, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: "branches",
  }
);

export const BranchModel: Model<BranchDocument> =
  (mongoose.models.Branch as Model<BranchDocument>) ||
  mongoose.model<BranchDocument>("Branch", BranchSchema);
