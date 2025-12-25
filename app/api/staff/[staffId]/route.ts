import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { staffRepository } from "@/modules/database";
import { auditService } from "@/modules/services";
import type { Staff } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

interface RouteParams {
  params: Promise<{ staffId: string }>;
}

// GET /api/staff/[staffId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { staffId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const staff = await staffRepository.findByIdAsync(staffId);

    if (!staff) {
      return errorResponse("Staff member not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, staff.branchId);
    if ("response" in scoped) return scoped.response;

    return successResponse(staff);

  } catch (error) {
    console.error("Get staff error:", error);
    return errorResponse("Failed to fetch staff member", 500);
  }
}

// PUT /api/staff/[staffId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { staffId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const existing = await staffRepository.findByIdAsync(staffId);
    if (!existing) {
      return errorResponse("Staff member not found", 404);
    }

    const body = await parseBody<Partial<Staff>>(request);
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const requestedBranchId = body.branchId ?? existing.branchId;
    const scoped = resolveBranchScope(auth.session, requestedBranchId);
    if ("response" in scoped) return scoped.response;

    const updated = await staffRepository.updateAsync(staffId, {
      ...body,
      branchId: scoped.branchId ?? body.branchId,
    });

    if (!updated) {
      return errorResponse("Staff member not found", 404);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    await auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "update_staff",
      resource: "staff",
      resourceId: staffId,
      details: body as Record<string, unknown>,
      ipAddress,
      branchId: updated.branchId,
    });

    // Notify branch admins about staff update
    if (updated.branchId) {
      try {
        console.log("[Staff Update] Starting notification process for branch:", updated.branchId);
        const { userRepository, notificationRepository } = await import("@/modules/database");
        const branchAdmins = await userRepository.findByBranchAsync(updated.branchId);
        console.log("[Staff Update] Found branch admins:", branchAdmins.length);
        const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");
        console.log("[Staff Update] Filtering for role 'branch_admin':", adminUsers.length);

        for (const admin of adminUsers) {
          console.log("[Staff Update] Creating notification for user:", admin.id);
          await notificationRepository.createAsync({
            userId: admin.id,
            type: "branch_update" as const,
            title: "Staff Updated",
            message: `Staff "${updated.name}" profile was updated by ${actor.userName}`,
            priority: "low" as const,
            status: "unread" as const,
            read: false,
            data: { staffId: staffId, updatedBy: actor.userName },
            branchId: updated.branchId,
          });
          console.log("[Staff Update] Notification created for:", admin.id);
        }
      } catch (notifError) {
        console.error("[Staff Update] Failed to create notifications:", notifError);
      }
    }

    return successResponse(updated, "Staff member updated successfully");

  } catch (error) {
    console.error("Update staff error:", error);
    return errorResponse("Failed to update staff member", 500);
  }
}

// DELETE /api/staff/[staffId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { staffId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const existing = await staffRepository.findByIdAsync(staffId);
    if (!existing) {
      return errorResponse("Staff member not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, existing.branchId);
    if ("response" in scoped) return scoped.response;

    const deleted = await staffRepository.deleteAsync(staffId);

    if (!deleted) {
      return errorResponse("Staff member not found", 404);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    await auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "delete_staff",
      resource: "staff",
      resourceId: staffId,
      details: { name: existing.name, role: existing.role },
      ipAddress,
      branchId: existing.branchId,
    });

    // Notify branch admins about staff deletion
    if (existing.branchId) {
      try {
        const { userRepository, notificationRepository } = await import("@/modules/database");
        const branchAdmins = await userRepository.findByBranchAsync(existing.branchId);
        const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

        for (const admin of adminUsers) {
          await notificationRepository.createAsync({
            userId: admin.id,
            type: "branch_update" as const,
            title: "Staff Removed",
            message: `Staff "${existing.name}" was removed by ${actor.userName}`,
            priority: "medium" as const,
            status: "unread" as const,
            read: false,
            data: { staffId: staffId, deletedBy: actor.userName, staffName: existing.name },
            branchId: existing.branchId,
          });
        }
      } catch (notifError) {
        console.error("[Staff Delete] Failed to create notifications:", notifError);
      }
    }

    return successResponse({ id: staffId }, "Staff member deleted successfully");

  } catch (error) {
    console.error("Delete staff error:", error);
    return errorResponse("Failed to delete staff member", 500);
  }
}
