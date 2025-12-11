/**
 * User Repository
 */

import { getStore } from "../store";
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
  },

  getOtp(phone: string): string | undefined {
    const normalized = phone.replace(/\D/g, "");
    return getStore().otps.get(normalized);
  },

  clearOtp(phone: string): void {
    const normalized = phone.replace(/\D/g, "");
    getStore().otps.delete(normalized);
  },

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
};
