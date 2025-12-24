/**
 * User Repository
 */

import { getStore, persistStore } from "../store";
import { connectToDatabase } from "../mongoose";
import { UserModel } from "../models";
import { formatDate } from "./base.repository";
import type { User } from "@/lib/types";

export const userRepository = {
  findAll(): User[] {
    return getStore().users;
  },

  findById(id: string): User | undefined {
    return getStore().users.find(u => u.id === id);
  },

  findByEmail(email: string): User | undefined {
    return getStore().users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  findByPhone(phone: string): User | undefined {
    const normalized = phone.replace(/\D/g, "");
    return getStore().users.find(
      u => u.phone?.replace(/\D/g, "").endsWith(normalized.slice(-10))
    );
  },

  verifyPassword(email: string, password: string): boolean {
    const stored = getStore().passwords.get(email.toLowerCase());
    return stored === password;
  },

  // OTP Management
  setOtp(phone: string, otp: string): void {
    const normalized = phone.replace(/\D/g, "");
    getStore().otps.set(normalized, otp);
    persistStore();
  },

  getOtp(phone: string): string | undefined {
    const normalized = phone.replace(/\D/g, "");
    return getStore().otps.get(normalized);
  },

  clearOtp(phone: string): void {
    const normalized = phone.replace(/\D/g, "");
    getStore().otps.delete(normalized);
    persistStore();
  },

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

  async findAllAsync(): Promise<User[]> {
    await connectToDatabase();
    // @ts-ignore - lean() returns plain objects that match User interface mostly
    return UserModel.find({}).lean();
  },

  async findByIdAsync(id: string): Promise<User | undefined> {
    await connectToDatabase();
    const doc = await UserModel.findOne({ id }).lean();
    // @ts-ignore
    return doc ?? undefined;
  },

  async findByEmailAsync(email: string): Promise<User | undefined> {
    await connectToDatabase();
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    // @ts-ignore
    return doc ?? undefined;
  },

  async findByPhoneAsync(phone: string): Promise<User | undefined> {
    await connectToDatabase();
    // Simple regex for "ends with" 10 digits
    const normalized = phone.replace(/\D/g, "");
    if (normalized.length < 10) return undefined;

    const doc = await UserModel.findOne({
      phone: { $regex: normalized.slice(-10), $options: "i" }
    }).lean();

    // @ts-ignore
    return doc ?? undefined;
  },

  findByBranch(branchId: string): User[] {
    return getStore().users.filter(u => u.branchId === branchId);
  },

  async findByBranchAsync(branchId: string): Promise<User[]> {
    await connectToDatabase();
    // @ts-ignore
    return UserModel.find({ branchId }).lean();
  },
};
