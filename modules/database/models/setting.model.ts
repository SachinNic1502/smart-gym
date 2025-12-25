import mongoose, { Schema, type Model, Document } from "mongoose";
import type { SystemSettings } from "@/lib/types";

export interface SettingDocument extends SystemSettings, Document { }

const SettingSchema = new Schema<SettingDocument>(
    {
        siteName: { type: String, required: true },
        supportEmail: { type: String, required: true },
        currency: { type: String, required: true },
        timezone: { type: String, required: true },
        dateFormat: { type: String, required: true },
        emailNotifications: { type: Boolean, required: true, default: true },
        smsNotifications: { type: Boolean, required: true, default: false },
        maintenanceMode: { type: Boolean, required: true, default: false },
        primaryColor: { type: String },
        secondaryColor: { type: String },
        minPasswordLength: { type: Number, default: 8 },
        sessionTimeoutMinutes: { type: Number, default: 30 },
        allowedIpRange: { type: String },
        publicApiBaseUrl: { type: String },
        webhookUrl: { type: String },

        // Payment Gateway
        paymentGatewayProvider: { type: String, enum: ["razorpay", "stripe", "none"], default: "none" },
        paymentGatewayKey: { type: String },
        paymentGatewaySecret: { type: String },

        // WhatsApp API
        whatsappProvider: { type: String, enum: ["twilio", "meta", "none"], default: "none" },
        whatsappApiKey: { type: String },
        whatsappPhoneNumber: { type: String },

        // Messaging API (SMS)
        messagingProvider: { type: String, enum: ["twilio", "msg91", "none"], default: "none" },
        messagingApiKey: { type: String },
        messagingSenderId: { type: String },

        // Nodemailer (SMTP)
        smtpHost: { type: String },
        smtpPort: { type: Number },
        smtpUser: { type: String },
        smtpPass: { type: String },
        smtpSecure: { type: Boolean, default: true },

        // Security & Rate Limiting
        apiRateLimitEnabled: { type: Boolean, default: false },
        apiRateLimitWindowSeconds: { type: Number, default: 60 },
        apiRateLimitMaxRequests: { type: Number, default: 60 },
    },
    {
        collection: "settings",
        timestamps: true,
    }
);

export const SettingModel: Model<SettingDocument> =
    (mongoose.models.Setting as Model<SettingDocument>) ||
    mongoose.model<SettingDocument>("Setting", SettingSchema);
