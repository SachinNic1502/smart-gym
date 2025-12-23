/**
 * Authentication Service
 */

import { userRepository } from "@/modules/database";
import type { User } from "@/lib/types";
import { connectToDatabase } from "@/modules/database/mongoose";
import { UserModel, MemberModel } from "@/modules/database/models";
import { verifyPassword as verifyPasswordHash } from "@/modules/database/password";
import { signSessionJwt, verifySessionJwt, type JwtSessionPayload, type JwtRole } from "@/lib/auth/jwt";

export interface LoginResult {
  success: boolean;
  user?: Omit<User, "createdAt" | "updatedAt">;
  redirectUrl?: string;
  error?: string;
}

export interface OtpResult {
  success: boolean;
  message?: string;
  devOtp?: string;
  error?: string;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (process.env.NODE_ENV !== "production") {
    return "dev_session_secret_change_me";
  }

  throw new Error("SESSION_SECRET is not defined (or too short). Please set it in your environment.");
}

export const authService = {
  /**
   * Authenticate admin/branch user with email and password
   */
  async login(email: string, password: string): Promise<LoginResult> {
    // First try authenticating against MongoDB (hashed password)
    try {
      await connectToDatabase();
      const dbUser = await UserModel.findOne({ email }).exec();

      if (dbUser && (dbUser.role === "super_admin" || dbUser.role === "branch_admin")) {
        const passwordHash = (dbUser as unknown as { passwordHash?: string }).passwordHash;

        if (passwordHash) {
          const isValid = await verifyPasswordHash(password, passwordHash);
          if (!isValid) {
            return { success: false, error: "Invalid email or password" };
          }

          const redirectUrl = dbUser.role === "super_admin" ? "/admin/dashboard" : "/branch/dashboard";

          return {
            success: true,
            user: {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role as User["role"],
              avatar: dbUser.avatar,
              branchId: dbUser.branchId,
            },
            redirectUrl,
          };
        }
        // If no passwordHash is present, fall through to in-memory check
      }
    } catch (error) {
      console.error("authService.login MongoDB error, falling back to in-memory store:", error);
    }

    // Fallback to existing in-memory user repository (development seed data)
    const user = userRepository.findByEmail(email);

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    if (user.role !== "super_admin" && user.role !== "branch_admin") {
      return { success: false, error: "Access denied. Use member login." };
    }

    const isValid = userRepository.verifyPassword(email, password);
    if (!isValid) {
      return { success: false, error: "Invalid email or password" };
    }

    const redirectUrl = user.role === "super_admin" ? "/admin/dashboard" : "/branch/dashboard";

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        branchId: user.branchId,
      },
      redirectUrl,
    };
  },

  /**
   * Send OTP to member phone
   */
  async sendOtp(phone: string): Promise<OtpResult> {
    const normalized = phone.replace(/\D/g, "");

    if (normalized.length < 10) {
      return { success: false, error: "Invalid phone number" };
    }

    let userExists = false;

    // 1. Check in-memory users
    const user = userRepository.findByPhone(phone);
    if (user && user.role === "member") {
      userExists = true;
    }

    // 2. If not found, check MongoDB members
    if (!userExists) {
      try {
        await connectToDatabase();
        // Simple regex search for phone in MongoDB
        // Note: In production better phone normalization/hashing is needed
        const member = await MemberModel.findOne({
          phone: { $regex: normalized.slice(-10), $options: "i" }
        }).exec();

        if (member) {
          userExists = true;
        }
      } catch (err) {
        console.error("Error looking up member in MongoDB:", err);
        // Fallback to false, proceed to error
      }
    }

    if (!userExists) {
      return { success: false, error: "No member found with this phone number" };
    }

    const otp = userRepository.generateOtp();
    userRepository.setOtp(phone, otp);

    // In production, send OTP via SMS service
    console.log(`[DEV] OTP for ${phone}: ${otp}`);

    return {
      success: true,
      message: "OTP sent successfully",
      // Only include OTP in development
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    };
  },

  /**
   * Verify OTP and login member
   */
  async verifyOtp(phone: string, otp: string): Promise<LoginResult> {
    const storedOtp = userRepository.getOtp(phone);

    // Allow default OTP "1234" as a fallback for members who don't receive SMS
    const isDefaultOtp = otp === "1234";
    const isDevBypass = process.env.NODE_ENV !== "production" && otp === "123456";

    // Accept stored OTP, default OTP "1234", or dev bypass "123456"
    if (storedOtp !== otp && !isDefaultOtp && !isDevBypass) {
      return { success: false, error: "Invalid OTP" };
    }

    userRepository.clearOtp(phone);

    // 1. Check in-memory users
    let user = userRepository.findByPhone(phone);
    if (user) {
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          branchId: user.branchId,
        },
        redirectUrl: "/portal/dashboard",
      };
    }

    // 2. Check MongoDB members
    try {
      await connectToDatabase();
      const normalized = phone.replace(/\D/g, "");
      const member = await MemberModel.findOne({
        phone: { $regex: normalized.slice(-10), $options: "i" }
      }).exec();

      if (member) {
        return {
          success: true,
          user: {
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            role: "member",
            avatar: member.image, // Map image to avatar
            branchId: member.branchId,
          },
          redirectUrl: "/portal/dashboard",
        };
      }
    } catch (err) {
      console.error("Error finding member in MongoDB:", err);
    }

    return { success: false, error: "Member not found" };
  },

  /**
   * Create session token
   */
  async createSessionToken(
    user: { id: string; role: JwtRole; name?: string | null; email?: string; phone?: string; avatar?: string; branchId?: string },
    expiresInHours: number = 24,
  ): Promise<string> {
    const secret = getSessionSecret();
    return signSessionJwt(
      {
        sub: user.id,
        role: user.role,
        name: user.name ?? null,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        branchId: user.branchId,
      },
      secret,
      expiresInHours * 60 * 60,
    );
  },

  /**
   * Decode and validate session token
   */
  async validateSession(token: string): Promise<JwtSessionPayload | null> {
    const secret = getSessionSecret();
    return verifySessionJwt(token, secret);
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | undefined> {
    try {
      const dbUser = await userRepository.findByIdAsync(id);
      if (dbUser) return dbUser;
    } catch (e) {
      console.error("Error fetching user from DB:", e);
    }
    return userRepository.findById(id);
  },
};
