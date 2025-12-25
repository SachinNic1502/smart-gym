import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { notificationRepository } from "@/modules/database";
import { requireSession } from "@/lib/api/require-auth";
import type { Notification } from "@/lib/types";

interface RouteParams {
    params: Promise<{
        notificationId: string;
    }>;
}

// GET /api/notifications/[notificationId] - Get a single notification
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireSession(["super_admin", "branch_admin", "member"]);
        if ("response" in auth) return auth.response;

        const { session } = auth;
        const { notificationId } = await params;
        const notification = await notificationRepository.findByIdAsync(notificationId);

        if (!notification) {
            return errorResponse("Notification not found", 404);
        }

        // Security check: Only owner or super admin can view
        if (session.role !== "super_admin" && notification.userId !== session.sub) {
            return errorResponse("Unauthorized", 403);
        }

        return successResponse(notification);
    } catch (error) {
        console.error("Get notification error:", error);
        return errorResponse("Failed to fetch notification", 500);
    }
}

// PATCH /api/notifications/[notificationId] - Update a notification
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireSession(["super_admin", "branch_admin", "member"]);
        if ("response" in auth) return auth.response;

        const { session } = auth;
        const body = await parseBody<Partial<Notification>>(request);

        if (!body) {
            return errorResponse("Invalid request body");
        }

        const { notificationId } = await params;
        const notification = await notificationRepository.findByIdAsync(notificationId);

        if (!notification) {
            return errorResponse("Notification not found", 404);
        }

        // Security check: Only owner or super admin can update
        if (session.role !== "super_admin" && notification.userId !== session.sub) {
            return errorResponse("Unauthorized", 403);
        }

        const updated = await notificationRepository.updateAsync(notificationId, body);
        return successResponse(updated, "Notification updated successfully");
    } catch (error) {
        console.error("Update notification error:", error);
        return errorResponse("Failed to update notification", 500);
    }
}

// DELETE /api/notifications/[notificationId] - Delete a notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireSession(["super_admin", "branch_admin", "member"]);
        if ("response" in auth) return auth.response;

        const { session } = auth;
        const { notificationId } = await params;
        const notification = await notificationRepository.findByIdAsync(notificationId);

        if (!notification) {
            return errorResponse("Notification not found", 404);
        }

        // Security check: Only owner or super admin can delete
        if (session.role !== "super_admin" && notification.userId !== session.sub) {
            return errorResponse("Unauthorized", 403);
        }

        await notificationRepository.deleteAsync(notificationId);
        return successResponse({ id: notificationId }, "Notification deleted successfully");
    } catch (error) {
        console.error("Delete notification error:", error);
        return errorResponse("Failed to delete notification", 500);
    }
}
