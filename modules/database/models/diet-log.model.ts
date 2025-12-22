
import mongoose, { Schema, Document } from "mongoose";
import type { DietLog } from "@/lib/types";

export interface DietLogDocument extends Omit<DietLog, "id">, Document {
    id: string;
}

const dietLogSchema = new Schema<DietLogDocument>(
    {
        id: { type: String, required: true, unique: true },
        memberId: { type: String, required: true, index: true },
        date: { type: String, required: true, index: true }, // YYYY-MM-DD
        type: { type: String, enum: ["food", "water"], required: true },
        calories: { type: Number },
        waterMl: { type: Number },
        label: { type: String },
        createdAt: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

// Compound index for querying a member's logs for a specific date
dietLogSchema.index({ memberId: 1, date: 1 });

export const DietLogModel =
    mongoose.models.DietLog || mongoose.model<DietLogDocument>("DietLog", dietLogSchema);
