import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { notificationRepository } from "@/modules/database";
import { requireSession } from "@/lib/api/require-auth";

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin", "member"]);
    if ("response" in auth) return auth.response;

    const { session } = auth;
    const body = await parseBody<{ notificationId?: string; markAll?: boolean }>(request);

    if (body?.markAll) {
      await notificationRepository.markAllAsReadAsync(session.sub);
      return successResponse({ message: "All notifications marked as read" });
    }

    if (body?.notificationId) {
      const notification = await notificationRepository.findByIdAsync(body.notificationId);

      if (!notification) {
        return errorResponse("Notification not found", 404);
      }

      if (session.role !== "super_admin" && notification.userId !== session.sub) {
        return errorResponse("Unauthorized", 403);
      }

      await notificationRepository.markAsReadAsync(body.notificationId);
      return successResponse({ message: "Notification marked as read" });
    }

    return errorResponse("Invalid request", 400);

  } catch (error) {
    console.error("Mark read error:", error);
    return errorResponse("Failed to mark notifications as read", 500);
  }
}
