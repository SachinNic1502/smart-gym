import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { notificationRepository } from "@/modules/database";
import { requireSession } from "@/lib/api/require-auth";

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin", "member"]);
    if ("response" in auth) return auth.response;

    const { session } = auth;
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // Mark all notifications as read for current user
      const updatedNotifications = await notificationRepository.markAllAsReadAsync(session.sub);
      return successResponse({ 
        message: "All notifications marked as read",
        count: updatedNotifications.length 
      });
    } else if (notificationId) {
      // Mark specific notification as read
      const updatedNotification = await notificationRepository.markAsReadAsync(notificationId);
      if (!updatedNotification) {
        return errorResponse("Notification not found", 404);
      }
      return successResponse(updatedNotification, "Notification marked as read");
    } else {
      return errorResponse("Either notificationId or markAll must be provided", 400);
    }

  } catch (error) {
    console.error("Mark notification as read error:", error);
    return errorResponse("Failed to mark notification as read", 500);
  }
}
