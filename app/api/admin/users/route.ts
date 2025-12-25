import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { authService, auditService } from "@/modules/services";
import { userRepository, notificationRepository } from "@/modules/database";
import { connectToDatabase } from "@/modules/database/mongoose";
import { UserModel } from "@/modules/database/models";
import { hashPassword } from "@/modules/database/password";
import { generateId } from "@/modules/database/repositories/base.repository";
import { createBranchAdminSchema } from "@/lib/validations/auth";
import { getRequestIp } from "@/lib/api/auth-helpers";
import { requireSession } from "@/lib/api/require-auth";

// GET /api/admin/users - List admin users (super + branch admins)
export async function GET() {
  try {
    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    await connectToDatabase();

    const users = await UserModel.find({ role: { $in: ["super_admin", "branch_admin"] } }).lean();

    const data = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      avatar: u.avatar,
      branchId: u.branchId,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return successResponse({ data, total: data.length });
  } catch (error) {
    console.error("List admin users error:", error);
    return errorResponse("Failed to fetch admin users", 500);
  }
}

// POST /api/admin/users - Create a new branch admin user
// Only accessible to super admin
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<unknown>(request);
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const validation = createBranchAdminSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      return errorResponse(issues[0]?.message || "Validation failed", 422);
    }

    const { name, email, phone, branchId, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    const existing = await UserModel.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return errorResponse("A user with this email already exists", 409);
    }

    const now = new Date().toISOString();
    const id = generateId("USR");
    const passwordHash = await hashPassword(password);

    const user = await UserModel.create({
      id,
      name,
      email: normalizedEmail,
      phone,
      role: "branch_admin",
      branchId,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const actorUserId = auth.session.sub;
    const actor = await authService.getUserById(actorUserId);
    const ipAddress = getRequestIp(request);

    await auditService.logAction({
      userId: actorUserId,
      userName: actor?.name ?? null,
      action: "create_admin_user",
      resource: "admin_user",
      resourceId: user.id,
      details: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        branchId: user.branchId,
        role: user.role,
      },
      ipAddress,
    });

    // Notify other Super Admins
    try {
      const superAdmins = await userRepository.findSuperAdminsAsync();
      const creator = await userRepository.findByIdAsync(actorUserId);
      for (const admin of superAdmins) {
        if (admin.id === actorUserId) continue;
        await notificationRepository.createAsync({
          userId: admin.id,
          type: "system_announcement",
          title: "New Admin Created",
          message: `${creator?.name || "A Super Admin"} has created a new branch admin: ${user.name}`,
          priority: "medium",
          status: "unread",
          read: false,
          data: { userId: user.id, role: user.role, branchId: user.branchId }
        });
      }
    } catch (e) {
      console.warn("User creation notification failed", e);
    }

    return successResponse(

      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "branch_admin",
        avatar: user.avatar,
        branchId: user.branchId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      "Branch admin created successfully",
      201,
    );
  } catch (error) {
    console.error("Create branch admin error:", error);
    return errorResponse("Failed to create branch admin", 500);
  }
}
