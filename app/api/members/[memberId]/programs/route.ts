import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { memberService } from "@/modules/services";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

interface RouteParams {
  params: Promise<{ memberId: string }>;
}

interface ProgramsRequest {
  workoutPlanId?: string;
  dietPlanId?: string;
}

// GET /api/members/[memberId]/programs - Get member's assigned programs
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const member = await memberService.getMember(memberId);
    if (!member.success || !member.data) {
      return errorResponse(member.error || "Member not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, member.data.branchId);
    if ("response" in scoped) return scoped.response;

    const result = await memberService.getMemberPrograms(memberId);
    
    if (!result.success) {
      return errorResponse(result.error || "Member not found", 404);
    }

    return successResponse(result.data);

  } catch (error) {
    console.error("Get member programs error:", error);
    return errorResponse("Failed to fetch member programs", 500);
  }
}

// PUT /api/members/[memberId]/programs - Assign programs to member
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const member = await memberService.getMember(memberId);
    if (!member.success || !member.data) {
      return errorResponse(member.error || "Member not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, member.data.branchId);
    if ("response" in scoped) return scoped.response;

    const body = await parseBody<ProgramsRequest>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const result = await memberService.assignPrograms(memberId, body.workoutPlanId, body.dietPlanId);
    
    if (!result.success) {
      return errorResponse(result.error || "Failed to assign programs", 404);
    }

    return successResponse({
      memberId,
      workoutPlanId: result.data?.workoutPlanId,
      dietPlanId: result.data?.dietPlanId,
    }, "Programs assigned successfully");

  } catch (error) {
    console.error("Assign programs error:", error);
    return errorResponse("Failed to assign programs", 500);
  }
}
