import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
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

    const result = await auditRepository.findAllAsync(filters, pagination);

    return successResponse(result);

  } catch (error) {
    console.error("Get audit logs error:", error);
    return errorResponse("Failed to fetch audit logs", 500);
  }
}

// POST /api/audit-logs - Create a manual audit log entry
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    const { session } = auth;
    const body = await parseBody<{
      action: string;
      resource: string;
      resourceId: string;
      details?: Record<string, unknown>;
      branchId?: string;
    }>(request);

    if (!body?.action || !body?.resource || !body?.resourceId) {
      return errorResponse("Action, resource, and resourceId are required", 400);
    }

    const log = await auditRepository.createAsync({
      userId: session.sub,
      userName: session.name || "System Admin",
      action: body.action,
      resource: body.resource,
      resourceId: body.resourceId,
      details: body.details,
      branchId: body.branchId || session.branchId,
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      timestamp: new Date().toISOString(),
    });

    return successResponse(log, "Audit log entry created successfully", 201);
  } catch (error) {
    console.error("Create audit log error:", error);
    return errorResponse("Failed to create audit log entry", 500);
  }
}

