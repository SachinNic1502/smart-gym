import { NextRequest } from "next/server";
import { successResponse, errorResponse, getPaginationParams, parseBody } from "@/lib/api/utils";
import { deviceService, auditService } from "@/modules/services";
import { deviceSchema } from "@/lib/validations/auth";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

// GET /api/devices - List all devices
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);

    const scoped = resolveBranchScope(auth.session, searchParams.get("branchId"));
    if ("response" in scoped) return scoped.response;

    const filters = {
      branchId: scoped.branchId,
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
    };

    const result = await deviceService.getDevices(filters, pagination);

    return successResponse(result);

  } catch (error) {
    console.error("Get devices error:", error);
    return errorResponse("Failed to fetch devices", 500);
  }
}

// POST /api/devices - Create a new device
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<Record<string, unknown>>(request);

    if (!body) {
      return errorResponse("Invalid request body");
    }

    const validation = deviceSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      return errorResponse(issues[0]?.message || "Validation failed", 422);
    }

    const scoped = resolveBranchScope(auth.session, validation.data.branchId);
    if ("response" in scoped) return scoped.response;

    const result = await deviceService.createDevice({
      ...validation.data,
      branchId: scoped.branchId ?? validation.data.branchId,
    });

    if (!result.success) {
      const status = result.error === "Branch not found" ? 404 : 409;
      return errorResponse(result.error || "Failed to create device", status);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    if (result.data) {
      auditService.logAction({
        userId: actor.userId,
        userName: actor.userName,
        action: "create_device",
        resource: "device",
        resourceId: result.data.id,
        details: result.data as unknown as Record<string, unknown>,
        ipAddress,
        branchId: scoped.branchId,
      });

      // Notify Branch Admins
      if (scoped.branchId) {
        try {
          const { userRepository, notificationRepository } = await import("@/modules/database");
          const branchAdmins = await userRepository.findByBranchAsync(scoped.branchId);
          const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

          for (const admin of adminUsers) {
            await notificationRepository.createAsync({
              userId: admin.id,
              type: "system_announcement" as const,
              title: "New Device Registered",
              message: `New ${result.data.type} device '${result.data.name}' has been registered.`,
              priority: "low" as const,
              status: "unread" as const,
              read: false,
              data: { deviceId: result.data.id },
              branchId: scoped.branchId,
            });
          }
        } catch (notifError) {
          console.error("[Devices] Failed to create notifications:", notifError);
        }
      }
    }

    return successResponse(result.data, "Device created successfully", 201);

  } catch (error) {
    console.error("Create device error:", error);
    return errorResponse("Failed to create device", 500);
  }
}
