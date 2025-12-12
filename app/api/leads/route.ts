import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { leadSchema } from "@/lib/validations/auth";
import { leadService } from "@/modules/services";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

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

    const result = leadService.getLeads(filters, pagination);
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

    const result = leadService.createLead({
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

    return successResponse(result.data, "Lead created successfully", 201);

  } catch (error) {
    console.error("Create lead error:", error);
    return errorResponse("Failed to create lead", 500);
  }
}
