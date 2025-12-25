import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { communicationRepository, notificationRepository, userRepository } from "@/modules/database";
import { auditService } from "@/modules/services";
import type { BroadcastMessage, MessageChannel } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

// GET /api/communications - List communications
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);

    const scoped = resolveBranchScope(auth.session, searchParams.get("branchId"));
    if ("response" in scoped) return scoped.response;

    const filters = {
      branchId: scoped.branchId, // Ensure repository supports this (if not, it's a limitation but safe to pass)
      channel: (searchParams.get("channel") as MessageChannel) || undefined,
      status: (searchParams.get("status") as "sent" | "scheduled" | "draft") || undefined,
    };

    const result = await communicationRepository.findAllAsync(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get communications error:", error);
    return errorResponse("Failed to fetch communications", 500);
  }
}

// POST /api/communications - Create broadcast message
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<Partial<BroadcastMessage>>(request);

    if (!body) {
      return errorResponse("Invalid request body");
    }

    if (!body.title || !body.content || !body.channel) {
      return errorResponse("title, content, and channel are required");
    }

    const message = await communicationRepository.createAsync({
      title: body.title,
      content: body.content,
      channel: body.channel,
      recipientCount: body.recipientCount || 0,
      sentAt: body.status === "sent" ? new Date().toISOString() : "",
      status: body.status || "draft",
    });

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    // Check if we can determine branch from actor
    const branchId = auth.session.branchId;

    await auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "create_communication",
      resource: "communication",
      resourceId: message.id,
      details: { title: message.title, channel: message.channel, status: message.status },
      ipAddress,
      branchId,
    });

    // Notify Super Admins
    try {
      const superAdmins = await userRepository.findSuperAdminsAsync();
      for (const admin of superAdmins) {
        if (admin.id === actor.userId) continue;
        await notificationRepository.createAsync({
          userId: admin.id,
          type: "system_announcement",
          title: "New Broadcast Message",
          message: `${actor.userName} created a ${message.channel} message: ${message.title}`,
          priority: "medium",
          status: "unread",
          read: false,
          data: { messageId: message.id, channel: message.channel }
        });
      }
    } catch (e) {
      console.warn("Communication notification failed", e);
    }

    return successResponse(message, "Message created successfully", 201);

  } catch (error) {
    console.error("Create communication error:", error);
    return errorResponse("Failed to create message", 500);
  }
}
