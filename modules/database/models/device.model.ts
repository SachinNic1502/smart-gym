import mongoose, { Schema, type Model } from "mongoose";
import type { Device } from "@/lib/types";

export interface DeviceDocument extends Device, Document {}

const DeviceSchema = new Schema<DeviceDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true },
    branchId: { type: String, required: true },
    branchName: { type: String, required: true },
    lastPing: { type: String },
    firmwareVersion: { type: String },
    model: { type: String },
    connectionType: { type: String },
    ipAddress: { type: String },
    cloudUrl: { type: String },
    createdAt: { type: String, required: true },
  },
  {
    collection: "devices",
  }
);

export const DeviceModel: Model<DeviceDocument> =
  (mongoose.models.Device as Model<DeviceDocument>) ||
  mongoose.model<DeviceDocument>("Device", DeviceSchema);
