import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { authService, auditService } from "@/modules/services";
import { userRepository, notificationRepository } from "@/modules/database";
import { connectToDatabase } from "@/modules/database/mongoose";
import { UserModel } from "@/modules/database/models";
import { hashPassword } from "@/modules/database/password";
import { getRequestIp } from "@/lib/api/auth-helpers";
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

    const actorUserId = auth.session.sub;
    const actor = await userRepository.findByIdAsync(actorUserId);
    const ipAddress = getRequestIp(request);

    await auditService.logAction({
      userId: actorUserId,
      userName: actor?.name ?? null,
      action: "update_admin_user",
      resource: "admin_user",
      resourceId: user.id,
      details: {
        updatedFields: Object.keys(body),
        id: user.id,
        role: user.role
      },
      ipAddress,
    });

    // Notify other Super Admins
    try {
      const superAdmins = await userRepository.findSuperAdminsAsync();
      for (const admin of superAdmins) {
        if (admin.id === actorUserId) continue;
        await notificationRepository.createAsync({
          userId: admin.id,
          type: "system_announcement",
          title: "Admin Credentials Updated",
          message: `${actor?.name || "A Super Admin"} has updated administrative details for: ${user.name}`,
          priority: "high",
          status: "unread",
          read: false,
          data: { updatedUserId: user.id, actorId: actorUserId }
        });
      }
    } catch (e) {
      console.warn("Admin update notification failed", e);
    }

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
