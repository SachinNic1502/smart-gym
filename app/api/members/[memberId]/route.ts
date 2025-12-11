import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { memberService, auditService } from "@/modules/services";
import type { Member } from "@/lib/types";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

interface RouteParams {
  params: Promise<{ memberId: string }>;
}

// GET /api/members/[memberId] - Get a single member
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    const result = await memberService.getMember(memberId);
    
    if (!result.success) {
      return errorResponse(result.error || "Member not found", 404);
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
    const { memberId } = await params;
    const body = await parseBody<Partial<Member>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
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
      });
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
    const { memberId } = await params;
    const result = await memberService.deleteMember(memberId);
    
    if (!result.success) {
      return errorResponse(result.error || "Member not found", 404);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "delete_member",
      resource: "member",
      resourceId: memberId,
      details: result.data as unknown as Record<string, unknown>,
      ipAddress,
    });

    return successResponse(result.data, "Member deleted successfully");

  } catch (error) {
    console.error("Delete member error:", error);
    return errorResponse("Failed to delete member", 500);
  }
}
