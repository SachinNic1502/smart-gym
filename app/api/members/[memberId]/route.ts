import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { memberService, auditService } from "@/modules/services";
import type { Member } from "@/lib/types";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";
import { requireSession } from "@/lib/api/require-auth";

interface RouteParams {
  params: Promise<{ memberId: string }>;
}

// GET /api/members/[memberId] - Get a single member
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { memberId } = await params;
    const result = await memberService.getMember(memberId);

    if (!result.success) {
      return errorResponse(result.error || "Member not found", 404);
    }

    if (auth.session.role === "branch_admin" && result.data?.branchId && auth.session.branchId !== result.data.branchId) {
      return errorResponse("Forbidden", 403);
    }

    return successResponse(result.data);

  } catch (error) {
    console.error("Get member error:", error);
    return errorResponse("Failed to fetch member", 500);
  }
}

// PUT /api/members/[memberId] - Update a member
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { memberId } = await params;
    const body = await parseBody<Partial<Member>>(request);

    if (!body) {
      return errorResponse("Invalid request body");
    }

    if (auth.session.role === "branch_admin") {
      const existing = await memberService.getMember(memberId);
      if (!existing.success || !existing.data) {
        return errorResponse(existing.error || "Member not found", 404);
      }
      if (!auth.session.branchId || existing.data.branchId !== auth.session.branchId) {
        return errorResponse("Forbidden", 403);
      }

      if (body.branchId && body.branchId !== auth.session.branchId) {
        return errorResponse("Forbidden", 403);
      }
    }

    const result = await memberService.updateMember(memberId, body);

    if (!result.success) {
      return errorResponse(result.error || "Member not found", 404);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    if (result.data) {
      auditService.logAction({
        userId: actor.userId,
        userName: actor.userName,
        action: "update_member",
        resource: "member",
        resourceId: memberId,
        details: body as Record<string, unknown>,
        ipAddress,
        branchId: result.data.branchId,
      });

      // Notify branch admins about member update
      if (result.data.branchId) {
        try {
          const { userRepository, notificationRepository } = await import("@/modules/database");
          const branchAdmins = await userRepository.findByBranchAsync(result.data.branchId);
          const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

          for (const admin of adminUsers) {
            await notificationRepository.createAsync({
              userId: admin.id,
              type: "system_announcement" as const,
              title: "Member Updated",
              message: `Member "${result.data.name}" was updated by ${actor.userName}`,
              priority: "low" as const,
              status: "unread" as const,
              read: false,
              data: { memberId: memberId, updatedBy: actor.userName },
              branchId: result.data.branchId,
            });
          }
        } catch (notifError) {
          console.error("[Members Update] Failed to create notifications:", notifError);
        }
      }
    }

    return successResponse(result.data, "Member updated successfully");

  } catch (error) {
    console.error("Update member error:", error);
    return errorResponse("Failed to update member", 500);
  }
}

// PATCH /api/members/[memberId] - Partial update
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return PUT(request, { params });
}

// DELETE /api/members/[memberId] - Delete a member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { memberId } = await params;

    if (auth.session.role === "branch_admin") {
      const existing = await memberService.getMember(memberId);
      if (!existing.success || !existing.data) {
        return errorResponse(existing.error || "Member not found", 404);
      }
      if (!auth.session.branchId || existing.data.branchId !== auth.session.branchId) {
        return errorResponse("Forbidden", 403);
      }
    }

    const result = await memberService.deleteMember(memberId);

    if (!result.success) {
      return errorResponse(result.error || "Member not found", 404);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    const existing = await memberService.getMember(memberId);
    const branchId = existing.data?.branchId || auth.session.branchId;

    auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "delete_member",
      resource: "member",
      resourceId: memberId,
      details: result.data as unknown as Record<string, unknown>,
      ipAddress,
      branchId,
    });

    // Notify branch admins about member deletion
    if (branchId && result.data) {
      try {
        const { userRepository, notificationRepository } = await import("@/modules/database");
        const branchAdmins = await userRepository.findByBranchAsync(branchId);
        const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

        const memberName = (result.data as any)?.name || "Unknown Member";
        for (const admin of adminUsers) {
          await notificationRepository.createAsync({
            userId: admin.id,
            type: "system_announcement" as const,
            title: "Member Deleted",
            message: `Member "${memberName}" was deleted by ${actor.userName}`,
            priority: "medium" as const,
            status: "unread" as const,
            read: false,
            data: { memberId: memberId, deletedBy: actor.userName, memberName },
            branchId: branchId,
          });
        }
      } catch (notifError) {
        console.error("[Members Delete] Failed to create notifications:", notifError);
      }
    }

    return successResponse(result.data, "Member deleted successfully");

  } catch (error) {
    console.error("Delete member error:", error);
    return errorResponse("Failed to delete member", 500);
  }
}
