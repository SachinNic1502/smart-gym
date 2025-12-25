import mongoose, { Schema, type Model, Document } from "mongoose";

export interface OTPDocument extends Document {
    identifier: string; // email or phone
    code: string;
    expiresAt: Date;
}

const OTPSchema = new Schema<OTPDocument>(
    {
        identifier: { type: String, required: true, unique: true },
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true },
    },
    {
        collection: "otps",
        timestamps: true,
    }
);

// Auto-delete expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTPModel: Model<OTPDocument> =
    (mongoose.models.OTP as Model<OTPDocument>) ||
    mongoose.model<OTPDocument>("OTP", OTPSchema);
