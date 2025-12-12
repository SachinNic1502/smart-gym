import mongoose, { Schema, type Model } from "mongoose";
import type { Expense } from "@/lib/types";

export interface ExpenseDocument extends Expense, Document {}

const ExpenseSchema = new Schema<ExpenseDocument>(
  {
    id: { type: String, required: true, unique: true },
    branchId: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  {
    collection: "expenses",
  }
);

export const ExpenseModel: Model<ExpenseDocument> =
  (mongoose.models.Expense as Model<ExpenseDocument>) ||
  mongoose.model<ExpenseDocument>("Expense", ExpenseSchema);
