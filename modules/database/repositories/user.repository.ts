/**
 * User Repository
 */

import { connectToDatabase } from "../mongoose";
import { UserModel } from "../models";
import { formatDate } from "./base.repository";
import type { User } from "@/lib/types";

export const userRepository = {
  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

  async findAllAsync(): Promise<User[]> {
    await connectToDatabase();
    return UserModel.find({}).lean<User[]>();
  },

  async findByIdAsync(id: string): Promise<User | undefined> {
    await connectToDatabase();
    const doc = await UserModel.findOne({ id }).lean<User | null>();
    return doc ?? undefined;
  },

  async findByEmailAsync(email: string): Promise<User | undefined> {
    await connectToDatabase();
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean<User | null>();
    return doc ?? undefined;
  },

  async findByPhoneAsync(phone: string): Promise<User | undefined> {
    await connectToDatabase();
    const normalized = phone.replace(/\D/g, "");
    if (normalized.length < 10) return undefined;

    const doc = await UserModel.findOne({
      phone: { $regex: normalized.slice(-10), $options: "i" }
    }).lean<User | null>();

    return doc ?? undefined;
  },

  async findByBranchAsync(branchId: string): Promise<User[]> {
    await connectToDatabase();
    return UserModel.find({ branchId }).lean<User[]>();
  },

  async findSuperAdminsAsync(): Promise<User[]> {
    await connectToDatabase();
    return UserModel.find({ role: "super_admin" }).lean<User[]>();
  },

  async updatePasswordAsync(email: string, passwordHash: string): Promise<void> {
    await connectToDatabase();
    await UserModel.updateOne(
      { email: email.toLowerCase() },
      { $set: { passwordHash, updatedAt: formatDate() } }
    ).exec();
  },
};
