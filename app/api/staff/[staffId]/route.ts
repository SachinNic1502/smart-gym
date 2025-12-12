import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { staffRepository } from "@/modules/database";
import type { Staff } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

interface RouteParams {
  params: Promise<{ staffId: string }>;
}

// GET /api/staff/[staffId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { staffId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const staff = staffRepository.findById(staffId);
    
    if (!staff) {
      return errorResponse("Staff member not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, staff.branchId);
    if ("response" in scoped) return scoped.response;

    return successResponse(staff);

  } catch (error) {
    console.error("Get staff error:", error);
    return errorResponse("Failed to fetch staff member", 500);
  }
}

// PUT /api/staff/[staffId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { staffId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const existing = staffRepository.findById(staffId);
    if (!existing) {
      return errorResponse("Staff member not found", 404);
    }

    const body = await parseBody<Partial<Staff>>(request);
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const requestedBranchId = body.branchId ?? existing.branchId;
    const scoped = resolveBranchScope(auth.session, requestedBranchId);
    if ("response" in scoped) return scoped.response;

    const updated = staffRepository.update(staffId, {
      ...body,
      branchId: scoped.branchId ?? body.branchId,
    });
    
    if (!updated) {
      return errorResponse("Staff member not found", 404);
    }

    return successResponse(updated, "Staff member updated successfully");

  } catch (error) {
    console.error("Update staff error:", error);
    return errorResponse("Failed to update staff member", 500);
  }
}

// DELETE /api/staff/[staffId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { staffId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const existing = staffRepository.findById(staffId);
    if (!existing) {
      return errorResponse("Staff member not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, existing.branchId);
    if ("response" in scoped) return scoped.response;

    const deleted = staffRepository.delete(staffId);
    
    if (!deleted) {
      return errorResponse("Staff member not found", 404);
    }

    return successResponse({ id: staffId }, "Staff member deleted successfully");

  } catch (error) {
    console.error("Delete staff error:", error);
    return errorResponse("Failed to delete staff member", 500);
  }
}
