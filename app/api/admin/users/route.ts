import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { authService, auditService } from "@/modules/services";
import { connectToDatabase } from "@/modules/database/mongoose";
import { UserModel } from "@/modules/database/models";
import { hashPassword } from "@/modules/database/password";
import { generateId } from "@/modules/database/repositories/base.repository";
import { createBranchAdminSchema } from "@/lib/validations/auth";
import { getRequestIp } from "@/lib/api/auth-helpers";

// GET /api/admin/users - List admin users (super + branch admins)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? authService.validateSession(token) : null;

    if (!session || session.role !== "super_admin") {
      return errorResponse("Forbidden", 403);
    }

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
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? authService.validateSession(token) : null;

    if (!session || session.role !== "super_admin") {
      return errorResponse("Forbidden", 403);
    }

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

    const actorUserId = session.userId;
    const actor = authService.getUserById(actorUserId);
    const ipAddress = getRequestIp(request);

    auditService.logAction({
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

    return successResponse(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role as any,
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
