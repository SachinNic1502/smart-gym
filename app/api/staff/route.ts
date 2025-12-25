import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { staffRepository } from "@/modules/database";
import { auditService } from "@/modules/services";
import type { Staff, StaffRole } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

// GET /api/staff - List staff
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin", "member"]);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);

    const scoped = resolveBranchScope(auth.session, searchParams.get("branchId"));
    if ("response" in scoped) return scoped.response;

    const filters = {
      branchId: scoped.branchId,
      role: (searchParams.get("role") as StaffRole) || undefined,
      status: (searchParams.get("status") as "active" | "inactive") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const result = await staffRepository.findAllAsync(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get staff error:", error);
    return errorResponse("Failed to fetch staff", 500);
  }
}

// POST /api/staff - Create staff member
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<Partial<Staff>>(request);

    if (!body) {
      return errorResponse("Invalid request body");
    }

    const scoped = resolveBranchScope(auth.session, body.branchId);
    if ("response" in scoped) return scoped.response;

    if (!body.name || !body.email || !body.phone || !body.role || !scoped.branchId) {
      return errorResponse("name, email, phone, role, and branchId are required");
    }

    // Check for duplicate email
    const existing = await staffRepository.findByEmailAsync(body.email);
    if (existing) {
      return errorResponse("A staff member with this email already exists", 409);
    }

    const staff = await staffRepository.createAsync({
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      branchId: scoped.branchId,
      branchName: body.branchName,
      salary: body.salary,
      joiningDate: body.joiningDate || new Date().toISOString().split("T")[0],
      status: body.status || "active",
      avatar: body.avatar,
    });

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    await auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "create_staff",
      resource: "staff",
      resourceId: staff.id,
      details: { name: staff.name, role: staff.role },
      ipAddress,
      branchId: scoped.branchId,
    });

    // Notify Branch Admins
    try {
      const { userRepository, notificationRepository } = await import("@/modules/database");
      const branchAdmins = await userRepository.findByBranchAsync(scoped.branchId);
      const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

      for (const admin of adminUsers) {
        await notificationRepository.createAsync({
          userId: admin.id,
          type: "branch_update" as const,
          title: "New Staff Member",
          message: `${staff.name} has joined as ${staff.role}`,
          priority: "medium" as const,
          status: "unread" as const,
          read: false,
          data: { staffId: staff.id },
          branchId: scoped.branchId,
        });
      }
    } catch (notifError) {
      console.error("[Staff] Failed to create notifications:", notifError);
    }

    return successResponse(staff, "Staff member created successfully", 201);

  } catch (error) {
    console.error("Create staff error:", error);
    return errorResponse("Failed to create staff member", 500);
  }
}
