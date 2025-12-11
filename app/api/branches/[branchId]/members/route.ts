import { NextRequest } from "next/server";
import { successResponse, errorResponse, getPaginationParams } from "@/lib/api/utils";
import { branchService } from "@/modules/services";

interface RouteParams {
  params: Promise<{ branchId: string }>;
}

// GET /api/branches/[branchId]/members - Get all members of a branch
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { branchId } = await params;
    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);

    const result = await branchService.getBranchMembers(branchId, pagination);
    
    if (!result.success) {
      return errorResponse(result.error || "Branch not found", 404);
    }

    return successResponse(result.data);

  } catch (error) {
    console.error("Get branch members error:", error);
    return errorResponse("Failed to fetch branch members", 500);
  }
}
