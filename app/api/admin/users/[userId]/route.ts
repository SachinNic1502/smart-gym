import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { authService } from "@/modules/services";
import { connectToDatabase } from "@/modules/database/mongoose";
import { UserModel } from "@/modules/database/models";
import { hashPassword } from "@/modules/database/password";
import { requireSession } from "@/lib/api/require-auth";
import type { User } from "@/lib/types";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// PUT /api/admin/users/[userId] - Update an admin user (super admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    const { userId } = await params;
    const body = await parseBody<{
      name?: string;
      email?: string;
      phone?: string;
      branchId?: string;
      password?: string;
    }>(request);

    if (!body) {
      return errorResponse("Invalid request body");
    }

    await connectToDatabase();

    const user = await UserModel.findOne({ id: userId }).exec();
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Handle email change with uniqueness check
    const newEmail = body.email?.toLowerCase().trim();

    if (newEmail && newEmail !== user.email) {
      const existing = await UserModel.findOne({ email: newEmail }).lean();
      if (existing && existing.id !== userId) {
        return errorResponse("Another user with this email already exists", 409);
      }
      user.email = newEmail;
    }

    if (body.name) {
      user.name = body.name;
    }

    if (body.phone !== undefined) {
      user.phone = body.phone;
    }

    if (body.branchId && user.role === "branch_admin") {
      user.branchId = body.branchId;
    }

    if (body.password && body.password.length >= 6) {
      user.passwordHash = await hashPassword(body.password);
    }

    user.updatedAt = new Date().toISOString();
    await user.save();

    return successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as User["role"],
      avatar: user.avatar,
      branchId: user.branchId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }, "Admin updated successfully");
  } catch (error) {
    console.error("Update admin user error:", error);
    return errorResponse("Failed to update admin user", 500);
  }
}
