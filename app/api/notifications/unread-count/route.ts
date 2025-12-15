import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { notificationRepository } from "@/modules/database";
import { requireSession } from "@/lib/api/require-auth";

// GET /api/notifications/unread-count - Get unread notification count for current user
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin", "member"]);
    if ("response" in auth) return auth.response;

    const { session } = auth;
    const unreadCount = await notificationRepository.getUnreadCountAsync(session.sub);

    return successResponse({ unreadCount });

  } catch (error) {
    console.error("Get unread count error:", error);
    return errorResponse("Failed to get unread count", 500);
  }
}
