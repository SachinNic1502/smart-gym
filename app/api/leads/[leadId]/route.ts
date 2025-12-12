import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { leadService } from "@/modules/services";
import type { Lead } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

interface RouteParams {
  params: Promise<{ leadId: string }>;
}

// GET /api/leads/[leadId] - Get a single lead
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const result = leadService.getLead(leadId);
    
    if (!result.success) {
      return errorResponse(result.error || "Lead not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, result.data?.branchId);
    if ("response" in scoped) return scoped.response;

    return successResponse(result.data);

  } catch (error) {
    console.error("Get lead error:", error);
    return errorResponse("Failed to fetch lead", 500);
  }
}

// PUT /api/leads/[leadId] - Update a lead
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<Partial<Lead>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const existing = leadService.getLead(leadId);
    if (!existing.success || !existing.data) {
      return errorResponse(existing.error || "Lead not found", 404);
    }

    const requestedBranchId = body.branchId ?? existing.data.branchId;
    const scoped = resolveBranchScope(auth.session, requestedBranchId);
    if ("response" in scoped) return scoped.response;

    const result = leadService.updateLead(leadId, {
      ...body,
      branchId: scoped.branchId ?? body.branchId,
    });
    
    if (!result.success) {
      return errorResponse(result.error || "Lead not found", 404);
    }

    return successResponse(result.data, "Lead updated successfully");

  } catch (error) {
    console.error("Update lead error:", error);
    return errorResponse("Failed to update lead", 500);
  }
}

// DELETE /api/leads/[leadId] - Delete a lead
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const existing = leadService.getLead(leadId);
    if (!existing.success || !existing.data) {
      return errorResponse(existing.error || "Lead not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, existing.data.branchId);
    if ("response" in scoped) return scoped.response;

    const result = leadService.deleteLead(leadId);
    
    if (!result.success) {
      return errorResponse(result.error || "Lead not found", 404);
    }

    return successResponse(result.data, "Lead deleted successfully");

  } catch (error) {
    console.error("Delete lead error:", error);
    return errorResponse("Failed to delete lead", 500);
  }
}
