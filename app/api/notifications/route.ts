import { NextRequest } from "next/server";
import { successResponse, errorResponse, getPaginationParams } from "@/lib/api/utils";
import { notificationRepository } from "@/modules/database";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";
import type { Notification, NotificationType, NotificationStatus } from "@/lib/types";

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin", "member"]);
    if ("response" in auth) return auth.response;

    const { session } = auth;
    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);

    // Filter for current user's notifications
    // If it's a branch admin, let them see notifications for their branch that might not be directly assigned to them?
    // OR restrict everyone to their userId?
    // Generally notifications are personal. However, admins might want to see system notifications for their branch.
    // The previous implementation filtered by userId: session.sub
    // If we want branch admins to generally "view" notifications, we might need to broaden this.
    // BUT the prompt says "check the notification module".
    // Branch admins should probably see notifications for their branch OR specifically addressed to them.

    const branchScope = resolveBranchScope(session, searchParams.get("branchId"));
    if ("response" in branchScope) return branchScope.response;

    const filters = {
      userId: session.role === 'super_admin' ? searchParams.get("userId") || undefined : session.sub, // Super admin can view any user's, others view their own
      type: searchParams.get("type") as NotificationType || undefined,
      status: searchParams.get("status") as NotificationStatus || undefined,
      priority: searchParams.get("priority") as "low" | "medium" | "high" | "urgent" || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      branchId: branchScope.branchId, // Optional: if we want to filter by branch
    };

    const result = await notificationRepository.findAllAsync(filters, pagination);

    return successResponse(result);

  } catch (error) {
    console.error("Get notifications error:", error);
    return errorResponse("Failed to fetch notifications", 500);
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const { userId, type, title, message, priority, data, actionUrl, imageUrl, expiresAt, branchId } = body;

    if (!userId || !type || !title || !message) {
      return errorResponse("Missing required fields: userId, type, title, message", 400);
    }

    // Resolve branch scope if branchId is provided
    const scope = resolveBranchScope(auth.session, branchId);
    if ("response" in scope) return scope.response;

    const notification = await notificationRepository.createAsync({
      userId,
      type,
      title,
      message,
      priority: priority || "medium",
      status: "unread",
      read: false,
      data,
      actionUrl,
      imageUrl,
      expiresAt,
      branchId: scope.branchId, // Persist validated branchId
    });

    return successResponse(notification, "Notification created successfully", 201);

  } catch (error) {
    console.error("Create notification error:", error);
    return errorResponse("Failed to create notification", 500);
  }
}
