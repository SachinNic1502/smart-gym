import mongoose, { Schema, type Model } from "mongoose";
import type { Payment } from "@/lib/types";

export interface PaymentDocument extends Payment, Document {}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    id: { type: String, required: true, unique: true },
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    branchId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    method: { type: String, required: true },
    description: { type: String, required: true },
    invoiceNumber: { type: String },
    createdAt: { type: String, required: true },
  },
  {
    collection: "payments",
  }
);

export const PaymentModel: Model<PaymentDocument> =
  (mongoose.models.Payment as Model<PaymentDocument>) ||
  mongoose.model<PaymentDocument>("Payment", PaymentSchema);
