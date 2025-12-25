import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { classRepository } from "@/modules/database";
import { auditService } from "@/modules/services";
import type { GymClass, ClassType } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

// GET /api/classes - List classes
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
      trainerId: searchParams.get("trainerId") || undefined,
      type: (searchParams.get("type") as ClassType) || undefined,
      status: (searchParams.get("status") as "active" | "cancelled" | "completed") || undefined,
    };

    const result = await classRepository.findAllAsync(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get classes error:", error);
    return errorResponse("Failed to fetch classes", 500);
  }
}

// POST /api/classes - Create class
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<Partial<GymClass>>(request);

    if (!body) {
      return errorResponse("Invalid request body");
    }

    const scoped = resolveBranchScope(auth.session, body.branchId);
    if ("response" in scoped) return scoped.response;

    if (!body.name || !body.type || !body.trainerId || !scoped.branchId || !body.capacity) {
      return errorResponse("name, type, trainerId, branchId, and capacity are required");
    }

    const gymClass = await classRepository.createAsync({
      name: body.name,
      type: body.type,
      description: body.description,
      trainerId: body.trainerId,
      trainerName: body.trainerName || "Unknown",
      branchId: scoped.branchId,
      capacity: body.capacity,
      schedule: body.schedule || [],
      status: body.status || "active",
      enrolled: 0,
    });

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    await auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "create_class",
      resource: "class",
      resourceId: gymClass.id,
      details: { ...gymClass },
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
          title: "New Class Scheduled",
          message: `New class '${gymClass.name}' scheduled by ${gymClass.trainerName}`,
          priority: "medium" as const,
          status: "unread" as const,
          read: false,
          data: { classId: gymClass.id },
          branchId: scoped.branchId,
        });
      }
    } catch (notifError) {
      console.error("[Classes] Failed to create notifications:", notifError);
    }

    return successResponse(gymClass, "Class created successfully", 201);

  } catch (error) {
    console.error("Create class error:", error);
    return errorResponse("Failed to create class", 500);
  }
}
