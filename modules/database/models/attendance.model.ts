import mongoose, { Schema, type Model } from "mongoose";
import type { AttendanceRecord } from "@/lib/types";

export interface AttendanceDocument extends AttendanceRecord, Document {}

const AttendanceSchema = new Schema<AttendanceDocument>(
  {
    id: { type: String, required: true, unique: true },
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    branchId: { type: String, required: true },
    checkInTime: { type: String, required: true },
    checkOutTime: { type: String },
    method: { type: String, required: true },
    status: { type: String, required: true },
    deviceId: { type: String },
  },
  {
    collection: "attendance",
  }
);

export const AttendanceModel: Model<AttendanceDocument> =
  (mongoose.models.Attendance as Model<AttendanceDocument>) ||
  mongoose.model<AttendanceDocument>("Attendance", AttendanceSchema);
