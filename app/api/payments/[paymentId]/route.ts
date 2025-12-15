import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";
import { paymentRepository } from "@/modules/database";
import { auditService } from "@/modules/services";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

interface RouteParams {
  params: Promise<{ paymentId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { paymentId } = await params;

    const payment = await paymentRepository.findByIdAsync(paymentId);
    if (!payment) {
      return errorResponse("Payment not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, payment.branchId);
    if ("response" in scoped) return scoped.response;

    return successResponse(payment);
  } catch (error) {
    console.error("Get payment error:", error);
    return errorResponse("Failed to fetch payment", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { paymentId } = await params;

    const payment = await paymentRepository.findByIdAsync(paymentId);
    if (!payment) {
      return errorResponse("Payment not found", 404);
    }

    const scoped = resolveBranchScope(auth.session, payment.branchId);
    if ("response" in scoped) return scoped.response;

    const deleted = await paymentRepository.deleteAsync(paymentId);
    if (!deleted) {
      return errorResponse("Payment not found", 404);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "delete_payment",
      resource: "payment",
      resourceId: paymentId,
      details: { payment } as unknown as Record<string, unknown>,
      ipAddress,
    });

    return successResponse({ id: paymentId }, "Payment deleted successfully");
  } catch (error) {
    console.error("Delete payment error:", error);
    return errorResponse("Failed to delete payment", 500);
  }
}
