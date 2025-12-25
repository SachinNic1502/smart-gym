import mongoose, { Schema, type Model, Document } from "mongoose";
import type { AuditLog } from "@/lib/types";

export interface AuditLogDocument extends AuditLog, Document { }

const AuditLogSchema = new Schema<AuditLogDocument>(
    {
        id: { type: String, required: true, unique: true },
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        action: { type: String, required: true },
        resource: { type: String, required: true },
        resourceId: { type: String, required: true },
        details: { type: Schema.Types.Mixed },
        ipAddress: { type: String },
        branchId: { type: String },
        timestamp: { type: String, required: true },
    },
    {
        collection: "audit_logs",
    }
);

export const AuditLogModel: Model<AuditLogDocument> =
    (mongoose.models.AuditLog as Model<AuditLogDocument>) ||
    mongoose.model<AuditLogDocument>("AuditLog", AuditLogSchema);
