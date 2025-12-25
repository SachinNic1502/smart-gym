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

        // Log the sync action
        await auditService.logAction({
            userId: actor.userId,
            userName: actor.userName,
            action: "sync_device",
            resource: "device",
            resourceId: deviceId,
            details: {
                deviceName: result.data.name,
                deviceType: result.data.type,
                action: "sync"
            },
            ipAddress,
            branchId: result.data.branchId,
        });

        // Notify branch admins about device sync
        if (result.data.branchId) {
            try {
                const { userRepository, notificationRepository } = await import("@/modules/database");
                const branchAdmins = await userRepository.findByBranchAsync(result.data.branchId);
                const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

                for (const admin of adminUsers) {
                    await notificationRepository.createAsync({
                        userId: admin.id,
                        type: "system_announcement" as const,
                        title: "Device Synced",
                        message: `Device '${result.data.name}' sync initiated by ${actor.userName}`,
                        priority: "low" as const,
                        status: "unread" as const,
                        read: false,
                        data: { deviceId: deviceId, action: "sync" },
                        branchId: result.data.branchId,
                    });
                }
            } catch (notifError) {
                console.error("[Device Sync] Failed to create notifications:", notifError);
            }
        }

        // Mock sync - in production, this would trigger actual device data sync
        return successResponse({ success: true, message: "Sync initiated" });
    } catch (error) {
        console.error("Sync device error:", error);
        return errorResponse("Failed to sync device", 500);
    }
}
