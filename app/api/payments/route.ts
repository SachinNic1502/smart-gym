import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { paymentService, auditService } from "@/modules/services";
import type { PaymentMethod } from "@/lib/types";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";

// GET /api/payments - List payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);
    
    const filters = {
      branchId: searchParams.get("branchId") || undefined,
      memberId: searchParams.get("memberId") || undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    const result = paymentService.getPayments(filters, pagination);
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
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<PaymentRequest>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const { memberId, branchId, planId, amount, method, description } = body;

    if (!memberId || !branchId || !planId || !amount || !method) {
      return errorResponse("memberId, branchId, planId, amount, and method are required");
    }

    const result = paymentService.createPayment({
      memberId,
      branchId,
      planId,
      amount,
      method,
      description,
    });

    if (!result.success) {
      return errorResponse(result.error || "Payment failed", 400);
    }

    const actor = await getRequestUser();
    const ipAddress = getRequestIp(request);

    if (result.data?.payment) {
      const payment = result.data.payment;
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
