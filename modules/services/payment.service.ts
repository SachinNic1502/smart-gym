/**
 * Payment Service
 */

import { paymentRepository, memberRepository, planRepository } from "@/modules/database";
import { formatDate, addDays } from "@/modules/database/repositories/base.repository";
import type { Payment, PaymentMethod } from "@/lib/types";
import type { PaymentFilters, PaginationOptions, PaginatedResult } from "@/modules/database";

export interface CreatePaymentData {
  memberId: string;
  branchId: string;
  planId: string;
  amount: number;
  method: PaymentMethod;
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  data?: {
    payment: Payment;
    member: {
      id: string;
      name: string;
      plan: string;
      expiryDate: string;
      status: string;
    };
  };
  error?: string;
}

export interface PaymentListResult extends PaginatedResult<Payment> {
  summary: {
    totalAmount: number;
    completedCount: number;
    pendingCount: number;
  };
}

export const paymentService = {
  /**
   * Get payments with filters and pagination
   */
  getPayments(filters?: PaymentFilters, pagination?: PaginationOptions): PaymentListResult {
    const result = paymentRepository.findAll(filters, pagination);
    
    const allFiltered = paymentRepository.findAll(filters).data;
    const totalAmount = allFiltered
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      ...result,
      summary: {
        totalAmount,
        completedCount: allFiltered.filter(p => p.status === "completed").length,
        pendingCount: allFiltered.filter(p => p.status === "pending").length,
      },
    };
  },

  /**
   * Create a new payment (membership purchase/renewal)
   */
  createPayment(data: CreatePaymentData): PaymentResult {
    const { memberId, branchId, planId, amount, method, description } = data;

    // Validate member
    const member = memberRepository.findById(memberId);
    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Validate plan
    const plan = planRepository.findMembershipPlanById(planId);
    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    // Create payment
    const payment = paymentRepository.create({
      memberId,
      memberName: member.name,
      branchId,
      amount,
      currency: "INR",
      status: "completed",
      method,
      description: description || `${plan.name} - ${plan.durationDays} days`,
      invoiceNumber: paymentRepository.generateInvoiceNumber(),
    });

    // Update member's plan and expiry
    const currentExpiry = new Date(member.expiryDate);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = addDays(baseDate, plan.durationDays);

    const updatedMember = memberRepository.update(memberId, {
      plan: plan.name,
      status: "Active",
      expiryDate: formatDate(newExpiry),
    });

    return {
      success: true,
      data: {
        payment,
        member: {
          id: updatedMember!.id,
          name: updatedMember!.name,
          plan: updatedMember!.plan,
          expiryDate: updatedMember!.expiryDate,
          status: updatedMember!.status,
        },
      },
    };
  },

  /**
   * Get today's collection for a branch
   */
  getTodayCollection(branchId: string) {
    return paymentRepository.getTodayTotal(branchId);
  },

  /**
   * Get week's collection for a branch
   */
  getWeekCollection(branchId: string): number {
    return paymentRepository.getWeekTotal(branchId);
  },
};
