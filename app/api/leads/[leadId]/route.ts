import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { leadService, auditService } from "@/modules/services";
import type { Lead } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

interface RouteParams {
  params: Promise<{ leadId: string }>;
}

// GET /api/leads/[leadId] - Get a single lead
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const result = await leadService.getLead(leadId);

    if (!result.success || !result.data) {
      return errorResponse(result.error || "Lead not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, result.data.branchId);
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

    const existing = await leadService.getLead(leadId);
    if (!existing.success || !existing.data) {
      return errorResponse(existing.error || "Lead not found", 404);
    }

    const requestedBranchId = body.branchId ?? existing.data.branchId;
    const scoped = resolveBranchScope(auth.session, requestedBranchId);
    if ("response" in scoped) return scoped.response;

    const result = await leadService.updateLead(leadId, {
      ...body,
      branchId: scoped.branchId ?? body.branchId,
    });

    if (!result.success || !result.data) {
      return errorResponse(result.error || "Lead not found", 404);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "update_lead",
      resource: "lead",
      resourceId: leadId,
      details: body as Record<string, unknown>,
      ipAddress,
      branchId: result.data.branchId,
    });

    // Notify branch admins about lead update
    if (result.data.branchId) {
      try {
        const { userRepository, notificationRepository } = await import("@/modules/database");
        const branchAdmins = await userRepository.findByBranchAsync(result.data.branchId);
        const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

        for (const admin of adminUsers) {
          await notificationRepository.createAsync({
            userId: admin.id,
            type: "lead_assigned" as const,
            title: "Lead Updated",
            message: `Lead "${result.data.name}" was updated by ${actor.userName}`,
            priority: "low" as const,
            status: "unread" as const,
            read: false,
            data: { leadId: leadId, updatedBy: actor.userName },
            branchId: result.data.branchId,
          });
        }
      } catch (notifError) {
        console.error("[Leads Update] Failed to create notifications:", notifError);
      }
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

    const existing = await leadService.getLead(leadId);
    if (!existing.success || !existing.data) {
      return errorResponse(existing.error || "Lead not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, existing.data.branchId);
    if ("response" in scoped) return scoped.response;

    const result = await leadService.deleteLead(leadId);

    if (!result.success) {
      return errorResponse(result.error || "Lead not found", 404);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "delete_lead",
      resource: "lead",
      resourceId: leadId,
      details: { name: existing.data.name },
      ipAddress,
      branchId: existing.data.branchId,
    });

    // Notify branch admins about lead deletion
    if (existing.data.branchId) {
      try {
        const { userRepository, notificationRepository } = await import("@/modules/database");
        const branchAdmins = await userRepository.findByBranchAsync(existing.data.branchId);
        const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

        for (const admin of adminUsers) {
          await notificationRepository.createAsync({
            userId: admin.id,
            type: "system_announcement" as const,
            title: "Lead Deleted",
            message: `Lead "${existing.data.name}" was deleted by ${actor.userName}`,
            priority: "low" as const,
            status: "unread" as const,
            read: false,
            data: { leadId: leadId, deletedBy: actor.userName, leadName: existing.data.name },
            branchId: existing.data.branchId,
          });
        }
      } catch (notifError) {
        console.error("[Leads Delete] Failed to create notifications:", notifError);
      }
    }

    return successResponse(result.data, "Lead deleted successfully");

  } catch (error) {
    console.error("Delete lead error:", error);
    return errorResponse("Failed to delete lead", 500);
  }
}
