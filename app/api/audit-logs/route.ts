import { NextRequest } from "next/server";
import { successResponse, errorResponse, getPaginationParams } from "@/lib/api/utils";
import { auditRepository } from "@/modules/database";
import { requireSession } from "@/lib/api/require-auth";

// GET /api/audit-logs - List audit logs
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);
    
    const filters = {
      userId: searchParams.get("userId") || undefined,
      resource: searchParams.get("resource") || undefined,
      action: searchParams.get("action") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    const result = auditRepository.findAll(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get audit logs error:", error);
    return errorResponse("Failed to fetch audit logs", 500);
  }
}
