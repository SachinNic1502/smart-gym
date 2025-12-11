import mongoose, { Schema, type Model, type Document } from "mongoose";
import type { User } from "@/lib/types";

export interface UserDocument extends User, Document {
  passwordHash?: string;
}

const UserSchema = new Schema<UserDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    role: { type: String, required: true },
    avatar: { type: String },
    branchId: { type: String },
    passwordHash: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: "users",
  }
);

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", UserSchema);
