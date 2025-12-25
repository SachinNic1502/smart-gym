/**
 * OTP Repository
 */

import { connectToDatabase } from "../mongoose";
import { OTPModel } from "../models";

export const otpRepository = {
    async setOtpAsync(identifier: string, code: string, expiresAt: Date): Promise<void> {
        await connectToDatabase();
        await OTPModel.findOneAndUpdate(
            { identifier },
            { code, expiresAt },
            { upsert: true, new: true }
        ).exec();
    },

    async getOtpAsync(identifier: string): Promise<string | undefined> {
        await connectToDatabase();
        const doc = await OTPModel.findOne({ identifier }).exec();
        if (!doc) return undefined;

        // Check expiry manually just in case TTL didn't run yet
        if (doc.expiresAt < new Date()) {
            await OTPModel.deleteOne({ identifier }).exec();
            return undefined;
        }

        return doc.code;
    },

    async clearOtpAsync(identifier: string): Promise<void> {
        await connectToDatabase();
        await OTPModel.deleteOne({ identifier }).exec();
    },

    generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },
};
