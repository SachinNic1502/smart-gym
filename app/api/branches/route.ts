import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { addBranchSchema } from "@/lib/validations/auth";
import { branchService, auditService } from "@/modules/services";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

// GET /api/branches - List all branches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);
    
    const filters = {
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const result = await branchService.getBranches(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get branches error:", error);
    return errorResponse("Failed to fetch branches", 500);
  }
}

// POST /api/branches - Create a new branch
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<Record<string, unknown>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const validation = addBranchSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      return errorResponse(issues[0]?.message || "Validation failed", 422);
    }

    const result = await branchService.createBranch({
      name: validation.data.name,
      address: validation.data.address,
      city: validation.data.city,
      state: validation.data.state,
      phone: validation.data.phone,
      email: validation.data.email,
    });

    if (!result.success) {
      return errorResponse(result.error || "Failed to create branch", 409);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    if (result.data) {
      auditService.logAction({
        userId: actor.userId,
        userName: actor.userName,
        action: "create_branch",
        resource: "branch",
        resourceId: result.data.id,
        details: result.data as unknown as Record<string, unknown>,
        ipAddress,
      });
    }

    return successResponse(result.data, "Branch created successfully", 201);

  } catch (error) {
    console.error("Create branch error:", error);
    return errorResponse("Failed to create branch", 500);
  }
}
