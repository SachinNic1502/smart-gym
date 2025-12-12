import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { requireSession } from "@/lib/api/require-auth";
import { planRepository } from "@/modules/database";
import type { MembershipPlan } from "@/lib/types";

interface RouteParams {
  params: Promise<{ planId: string }>;
}

// PUT /api/admin/plans/[planId] - Update membership plan (super admin)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    const { planId } = await params;

    const body = await parseBody<Partial<Omit<MembershipPlan, "id">>>(request);
    if (!body) return errorResponse("Invalid request body");

    const updated = await planRepository.updateMembershipPlanAsync(planId, {
      ...body,
      name: typeof body.name === "string" ? body.name.trim() : body.name,
      description: typeof body.description === "string" ? body.description.trim() : body.description,
      currency: typeof body.currency === "string" ? body.currency.trim() : body.currency,
    });

    if (!updated) return errorResponse("Plan not found", 404);
    return successResponse(updated, "Plan updated");
  } catch (error) {
    console.error("Update plan error:", error);
    return errorResponse("Failed to update plan", 500);
  }
}

// DELETE /api/admin/plans/[planId] - Delete membership plan (super admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    const { planId } = await params;
    const ok = await planRepository.deleteMembershipPlanAsync(planId);
    if (!ok) return errorResponse("Plan not found", 404);

    return successResponse({ id: planId }, "Plan deleted");
  } catch (error) {
    console.error("Delete plan error:", error);
    return errorResponse("Failed to delete plan", 500);
  }
}
