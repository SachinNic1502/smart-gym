import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { leadSchema } from "@/lib/validations/auth";
import { leadService, auditService } from "@/modules/services";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

// GET /api/leads - List leads
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);

    const scoped = resolveBranchScope(auth.session, searchParams.get("branchId"));
    if ("response" in scoped) return scoped.response;

    const filters = {
      branchId: scoped.branchId,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const result = await leadService.getLeads(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get leads error:", error);
    return errorResponse("Failed to fetch leads", 500);
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<Record<string, unknown>>(request);

    if (!body) {
      return errorResponse("Invalid request body");
    }

    const validation = leadSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      return errorResponse(issues[0]?.message || "Validation failed", 422);
    }

    const requestedBranchId = typeof body.branchId === "string" ? body.branchId : undefined;
    const scoped = resolveBranchScope(auth.session, requestedBranchId);
    if ("response" in scoped) return scoped.response;

    if (!scoped.branchId) {
      return errorResponse("branchId is required", 422);
    }

    const result = await leadService.createLead({
      name: validation.data.name,
      phone: validation.data.phone,
      email: validation.data.email,
      source: validation.data.source,
      notes: validation.data.notes,
      branchId: scoped.branchId,
    });

    if (!result.success) {
      return errorResponse(result.error || "Failed to create lead", 409);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    await auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "create_lead",
      resource: "lead",
      resourceId: result.data?.id || "unknown",
      details: (result.data || {}) as unknown as Record<string, unknown>,
      ipAddress,
      branchId: scoped.branchId,
    });

    // Notify Branch Admins about new lead
    if (result.success && result.data && scoped.branchId) {
      try {
        const { userRepository, notificationRepository } = await import("@/modules/database");
        const branchAdmins = await userRepository.findByBranchAsync(scoped.branchId);
        const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

        for (const admin of adminUsers) {
          await notificationRepository.createAsync({
            userId: admin.id,
            type: "lead_assigned" as const,
            title: "New Lead Generated",
            message: `New lead: ${result.data.name}`,
            priority: "medium" as const,
            status: "unread" as const,
            read: false,
            data: { leadId: result.data.id },
            branchId: scoped.branchId,
          });
        }
      } catch (notifError) {
        console.error("[Leads] Failed to create notifications:", notifError);
      }
    }

    return successResponse(result.data, "Lead created successfully", 201);

  } catch (error) {
    console.error("Create lead error:", error);
    return errorResponse("Failed to create lead", 500);
  }
}
