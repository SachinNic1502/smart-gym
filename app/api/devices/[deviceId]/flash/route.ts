import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { deviceService, auditService } from "@/modules/services";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
    try {
        // Require authentication
        const auth = await requireSession(["super_admin", "branch_admin"]);
        if ("response" in auth) return auth.response;

        const { deviceId } = await params;

        // Get device to verify existence and check branch access
        const result = await deviceService.getDevice(deviceId);
        if (!result.data) {
            return errorResponse("Device not found", 404);
        }

        // Check branch access
        const scoped = resolveBranchScope(auth.session, result.data.branchId);
        if ("response" in scoped) return scoped.response;

        // Get actor information
        const actor = await getRequestUser();
        const ipAddress = getRequestIp(request);

        // Log the flash action
        const auditLog = await auditService.logAction({
            userId: actor.userId,
            userName: actor.userName,
            action: "flash_device",
            resource: "device",
            resourceId: deviceId,
            details: {
                deviceName: result.data.name,
                deviceType: result.data.type,
                action: "firmware_flash"
            },
            ipAddress,
            branchId: result.data.branchId,
        });
        console.log("[Device Flash] Audit log created:", auditLog.id);

        // Notify branch admins about device flash
        if (result.data.branchId) {
            try {
                const { userRepository, notificationRepository } = await import("@/modules/database");
                const branchAdmins = await userRepository.findByBranchAsync(result.data.branchId);
                const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

                console.log(`[Device Flash] Found ${adminUsers.length} branch admins for branch ${result.data.branchId}`);

                for (const admin of adminUsers) {
                    const notification = await notificationRepository.createAsync({
                        userId: admin.id,
                        type: "system_announcement" as const,
                        title: "Device Firmware Flash",
                        message: `Firmware flash initiated for device '${result.data.name}' by ${actor.userName}`,
                        priority: "medium" as const,
                        status: "unread" as const,
                        read: false,
                        data: { deviceId: deviceId, action: "flash" },
                        branchId: result.data.branchId,
                    });
                    console.log(`[Device Flash] Created notification ${notification.id} for admin ${admin.id}`);
                }
            } catch (notifError) {
                console.error("[Device Flash] Failed to create notifications:", notifError);
            }
        }

        // Mock flash - in production, this would trigger actual firmware update
        return successResponse({ success: true, message: "Firmware flash initiated" });
    } catch (error) {
        console.error("Flash device error:", error);
        return errorResponse("Failed to flash device", 500);
    }
}
