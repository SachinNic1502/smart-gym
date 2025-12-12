import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { branchService, auditService } from "@/modules/services";
import type { Branch } from "@/lib/types";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

interface RouteParams {
  params: Promise<{ branchId: string }>;
}

// GET /api/branches/[branchId] - Get a single branch with stats
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { branchId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const scoped = resolveBranchScope(auth.session, branchId);
    if ("response" in scoped) return scoped.response;

    const result = await branchService.getBranch(branchId);
    
    if (!result.success) {
      return errorResponse(result.error || "Branch not found", 404);
    }

    return successResponse(result.data);

  } catch (error) {
    console.error("Get branch error:", error);
    return errorResponse("Failed to fetch branch", 500);
  }
}

// PUT /api/branches/[branchId] - Update a branch
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { branchId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const scoped = resolveBranchScope(auth.session, branchId);
    if ("response" in scoped) return scoped.response;

    const body = await parseBody<Partial<Branch>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const result = await branchService.updateBranch(branchId, body);
    
    if (!result.success) {
      return errorResponse(result.error || "Branch not found", 404);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    if (result.data) {
      auditService.logAction({
        userId: actor.userId,
        userName: actor.userName,
        action: "update_branch",
        resource: "branch",
        resourceId: branchId,
        details: body as Record<string, unknown>,
        ipAddress,
      });
    }

    return successResponse(result.data, "Branch updated successfully");

  } catch (error) {
    console.error("Update branch error:", error);
    return errorResponse("Failed to update branch", 500);
  }
}

// DELETE /api/branches/[branchId] - Delete a branch
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { branchId } = await params;

    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    const result = await branchService.deleteBranch(branchId);
    
    if (!result.success) {
      return errorResponse(result.error || "Branch not found", 400);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "delete_branch",
      resource: "branch",
      resourceId: branchId,
      details: result.data as unknown as Record<string, unknown>,
      ipAddress,
    });

    return successResponse(result.data, "Branch deleted successfully");

  } catch (error) {
    console.error("Delete branch error:", error);
    return errorResponse("Failed to delete branch", 500);
  }
}
