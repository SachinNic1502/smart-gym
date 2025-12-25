import mongoose, { Schema, type Model, Document } from "mongoose";
import type { Notification } from "@/lib/types";

export interface NotificationDocument extends Notification, Document { }

const NotificationSchema = new Schema<NotificationDocument>(
    {
        id: { type: String, required: true, unique: true },
        userId: { type: String, required: true },
        type: { type: String, required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        priority: { type: String, required: true },
        status: { type: String, required: true },
        read: { type: Boolean, required: true, default: false },
        data: { type: Schema.Types.Mixed },
        actionUrl: { type: String },
        imageUrl: { type: String },
        createdAt: { type: String, required: true },
        readAt: { type: String },
        expiresAt: { type: String },
        branchId: { type: String },
    },
    {
        collection: "notifications",
    }
);

export const NotificationModel: Model<NotificationDocument> =
    (mongoose.models.Notification as Model<NotificationDocument>) ||
    mongoose.model<NotificationDocument>("Notification", NotificationSchema);
