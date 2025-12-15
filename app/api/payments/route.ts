import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { paymentService, auditService } from "@/modules/services";
import { NotificationService } from "@/lib/services/notification.service";
import { memberRepository, planRepository } from "@/modules/database";
import type { PaymentMethod } from "@/lib/types";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

// GET /api/payments - List payments
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
      memberId: searchParams.get("memberId") || undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    const result = await paymentService.getPayments(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get payments error:", error);
    return errorResponse("Failed to fetch payments", 500);
  }
}

interface PaymentRequest {
  memberId: string;
  branchId: string;
  planId: string;
  amount: number;
  method: PaymentMethod;
  description?: string;
  skipMemberUpdate?: boolean;
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<PaymentRequest>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const { memberId, branchId, planId, amount, method, description, skipMemberUpdate } = body;

    const scoped = resolveBranchScope(auth.session, branchId);
    if ("response" in scoped) return scoped.response;

    if (!memberId || !scoped.branchId || !planId || !amount || !method) {
      return errorResponse("memberId, branchId, planId, amount, and method are required");
    }

    const result = await paymentService.createPayment({
      memberId,
      branchId: scoped.branchId,
      planId,
      amount,
      method,
      description,
      skipMemberUpdate,
    });

    if (!result.success) {
      return errorResponse(result.error || "Payment failed", 400);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    if (result.data?.payment) {
      const payment = result.data.payment;
      
      // Send notification to member about payment received
      try {
        const member = memberRepository.findById(payment.memberId);
        
        if (member) {
          await NotificationService.sendTemplateNotification(
            payment.memberId,
            "paymentReceived",
            [member.name, `₹${payment.amount}`, payment.description || "Membership"],
            {
              actionUrl: `/portal/payments`,
              data: { paymentId: payment.id }
            }
          );
        }
      } catch (notificationError) {
        console.error("Failed to send payment notification:", notificationError);
        // Don't fail the payment if notification fails
      }

      auditService.logAction({
        userId: actor.userId,
        userName: actor.userName,
        action: "create_payment",
        resource: "payment",
        resourceId: payment.id,
        details: {
          payment,
          member: result.data.member,
        } as Record<string, unknown>,
        ipAddress,
      });
    }

    return successResponse(result.data, "Payment successful", 201);

  } catch (error) {
    console.error("Create payment error:", error);
    return errorResponse("Failed to process payment", 500);
  }
}
