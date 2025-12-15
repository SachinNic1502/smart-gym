import { NextRequest } from "next/server";
import { successResponse, errorResponse, getPaginationParams } from "@/lib/api/utils";
import { notificationRepository } from "@/modules/database";
import { requireSession } from "@/lib/api/require-auth";
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
    const filters = {
      userId: session.sub,
      type: searchParams.get("type") as NotificationType || undefined,
      status: searchParams.get("status") as NotificationStatus || undefined,
      priority: searchParams.get("priority") as "low" | "medium" | "high" | "urgent" || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
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
    const { userId, type, title, message, priority, data, actionUrl, imageUrl, expiresAt } = body;

    if (!userId || !type || !title || !message) {
      return errorResponse("Missing required fields: userId, type, title, message", 400);
    }

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
    });

    return successResponse(notification, "Notification created successfully", 201);

  } catch (error) {
    console.error("Create notification error:", error);
    return errorResponse("Failed to create notification", 500);
  }
}
