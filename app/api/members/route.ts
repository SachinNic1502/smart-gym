import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { addMemberSchema } from "@/lib/validations/auth";
import { memberService, auditService } from "@/modules/services";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

// GET /api/members - List all members with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);

    const scope = resolveBranchScope(auth.session, searchParams.get("branchId"));
    if ("response" in scope) return scope.response;

    const filters = {
      branchId: scope.branchId,
      status: searchParams.get("status") || undefined,
      plan: searchParams.get("plan") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const result = await memberService.getMembers(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get members error:", error);
    return errorResponse("Failed to fetch members", 500);
  }
}

// POST /api/members - Create a new member
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<Record<string, unknown>>(request);

    if (!body) {
      return errorResponse("Invalid request body");
    }

    // Validate input
    const validation = addMemberSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      return errorResponse(issues[0]?.message || "Validation failed", 422);
    }

    const requestedBranchId = typeof body.branchId === "string" ? body.branchId : undefined;
    const scope = resolveBranchScope(auth.session, requestedBranchId);
    if ("response" in scope) return scope.response;

    const branchId = scope.branchId ?? requestedBranchId ?? "BRN_001";

    const result = await memberService.createMember({
      name: validation.data.name,
      phone: validation.data.phone,
      email: validation.data.email,
      dateOfBirth: validation.data.dateOfBirth,
      address: validation.data.address,
      branchId,
      planId: validation.data.planId || undefined,
      referralSource: validation.data.referralSource,
      notes: validation.data.notes,
    });

    if (!result.success) {
      return errorResponse(result.error || "Failed to create member", 409);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    if (result.data) {
      auditService.logAction({
        userId: actor.userId,
        userName: actor.userName,
        action: "create_member",
        resource: "member",
        resourceId: result.data.id,
        details: result.data as unknown as Record<string, unknown>,
        ipAddress,
        branchId,
      });

      // Notify Branch Admins
      if (branchId) {
        try {
          const { userRepository, notificationRepository } = await import("@/modules/database");
          const branchAdmins = await userRepository.findByBranchAsync(branchId);
          const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

          for (const admin of adminUsers) {
            await notificationRepository.createAsync({
              userId: admin.id,
              type: "system_announcement" as const,
              title: "New Member Joined",
              message: `${result.data.name} has joined the gym.`,
              priority: "medium" as const,
              status: "unread" as const,
              read: false,
              data: { memberId: result.data.id },
              branchId,
            });
          }
        } catch (notifError) {
          console.error("[Members] Failed to create notifications:", notifError);
        }
      }
    }

    return successResponse(result.data, "Member created successfully", 201);

  } catch (error) {
    console.error("Create member error:", error);
    return errorResponse("Failed to create member", 500);
  }
}
