import { NextRequest } from "next/server";
import { successResponse, errorResponse, getPaginationParams } from "@/lib/api/utils";
import { auditRepository } from "@/modules/database";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

// GET /api/audit-logs - List audit logs
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { session } = auth;
    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);

    // Resolve branch scope to ensure security
    const branchScope = resolveBranchScope(session, searchParams.get("branchId"));
    if ("response" in branchScope) return branchScope.response;

    const filters = {
      userId: searchParams.get("userId") || undefined,
      resource: searchParams.get("resource") || undefined,
      action: searchParams.get("action") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      branchId: branchScope.branchId, // Enforce branch filtering
    };

    const result = auditRepository.findAll(filters, pagination);

    return successResponse(result);

  } catch (error) {
    console.error("Get audit logs error:", error);
    return errorResponse("Failed to fetch audit logs", 500);
  }
}
