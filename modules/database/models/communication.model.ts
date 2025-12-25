import mongoose, { Schema, type Model, Document } from "mongoose";
import type { BroadcastMessage } from "@/lib/types";

export interface CommunicationDocument extends BroadcastMessage, Document { }

const CommunicationSchema = new Schema<CommunicationDocument>(
    {
        id: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        channel: { type: String, required: true },
        recipientCount: { type: Number, required: true },
        sentAt: { type: String, required: true },
        status: { type: String, required: true },
    },
    {
        collection: "communications",
    }
);

export const CommunicationModel: Model<CommunicationDocument> =
    (mongoose.models.Communication as Model<CommunicationDocument>) ||
    mongoose.model<CommunicationDocument>("Communication", CommunicationSchema);
