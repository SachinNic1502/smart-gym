import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { addMemberSchema } from "@/lib/validations/auth";
import { memberService, auditService } from "@/modules/services";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

// GET /api/members - List all members with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);
    
    const filters = {
      branchId: searchParams.get("branchId") || undefined,
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

    const result = await memberService.createMember({
      name: validation.data.name,
      phone: validation.data.phone,
      email: validation.data.email,
      dateOfBirth: validation.data.dateOfBirth,
      address: validation.data.address,
      branchId: (body.branchId as string) || "BRN_001",
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
      });
    }

    return successResponse(result.data, "Member created successfully", 201);

  } catch (error) {
    console.error("Create member error:", error);
    return errorResponse("Failed to create member", 500);
  }
}
