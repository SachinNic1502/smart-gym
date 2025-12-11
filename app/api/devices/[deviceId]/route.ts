import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { deviceService, auditService } from "@/modules/services";
import { deviceSchema } from "@/lib/validations/auth";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

interface RouteParams {
  params: Promise<{ deviceId: string }>;
}

// GET /api/devices/[deviceId] - Get a single device
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { deviceId } = await params;
    const result = await deviceService.getDevice(deviceId);

    if (!result.success || !result.data) {
      return errorResponse(result.error || "Device not found", 404);
    }

    return successResponse(result.data);
  } catch (error) {
    console.error("Get device error:", error);
    return errorResponse("Failed to fetch device", 500);
  }
}

// PUT /api/devices/[deviceId] - Update a device
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { deviceId } = await params;
    const body = await parseBody<Record<string, unknown>>(request);

    if (!body) {
      return errorResponse("Invalid request body");
    }

    const validation = deviceSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      return errorResponse(issues[0]?.message || "Validation failed", 422);
    }

    const result = await deviceService.updateDevice(deviceId, validation.data);

    if (!result.success || !result.data) {
      const status =
        result.error === "Device not found" || result.error === "Branch not found"
          ? 404
          : 409;
      return errorResponse(result.error || "Failed to update device", status);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    if (result.data) {
      auditService.logAction({
        userId: actor.userId,
        userName: actor.userName,
        action: "update_device",
        resource: "device",
        resourceId: result.data.id,
        details: validation.data as unknown as Record<string, unknown>,
        ipAddress,
      });
    }

    return successResponse(result.data, "Device updated successfully");
  } catch (error) {
    console.error("Update device error:", error);
    return errorResponse("Failed to update device", 500);
  }
}

// DELETE /api/devices/[deviceId] - Delete a device
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { deviceId } = await params;
    const result = await deviceService.deleteDevice(deviceId);

    if (!result.success || !result.data) {
      return errorResponse(result.error || "Device not found", 404);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "delete_device",
      resource: "device",
      resourceId: deviceId,
      details: result.data as unknown as Record<string, unknown>,
      ipAddress,
    });

    return successResponse(result.data, "Device deleted successfully");
  } catch (error) {
    console.error("Delete device error:", error);
    return errorResponse("Failed to delete device", 500);
  }
}
