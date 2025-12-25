import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { auditRepository } from "@/modules/database";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

interface RouteParams {
    params: Promise<{
        logId: string;
    }>;
}

// GET /api/audit-logs/[logId] - Get a single audit log entry
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireSession(["super_admin", "branch_admin"]);
        if ("response" in auth) return auth.response;

        const { session } = auth;
        const { logId } = await params;
        const log = await auditRepository.findByIdAsync(logId);

        if (!log) {
            return errorResponse("Audit log entry not found", 404);
        }

        // Resolve branch scope to ensure security
        const branchScope = resolveBranchScope(session, log.branchId);
        if ("response" in branchScope) return branchScope.response;

        return successResponse(log);

    } catch (error) {
        console.error("Get audit log error:", error);
        return errorResponse("Failed to fetch audit log entry", 500);
    }
}

/**
 * NOTE: UPDATE (PUT/PATCH) and DELETE methods are intentionally omitted for Audit Logs.
 * Audit trails must be immutable to maintain the integrity of the system's history.
 * Any necessary corrections should be recorded as new audit entries rather than
 * modifying original records.
 */
