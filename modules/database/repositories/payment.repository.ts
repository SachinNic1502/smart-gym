/**
 * Payment Repository
 */

import { getStore } from "../store";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Payment } from "@/lib/types";

export interface PaymentFilters {
  branchId?: string;
  memberId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const paymentRepository = {
  findAll(filters?: PaymentFilters, pagination?: PaginationOptions): PaginatedResult<Payment> {
    let payments = [...getStore().payments];

    if (filters) {
      if (filters.branchId) {
        payments = payments.filter(p => p.branchId === filters.branchId);
      }
      if (filters.memberId) {
        payments = payments.filter(p => p.memberId === filters.memberId);
      }
      if (filters.status) {
        payments = payments.filter(p => p.status === filters.status);
      }
      if (filters.startDate) {
        payments = payments.filter(p => p.createdAt >= filters.startDate!);
      }
      if (filters.endDate) {
        payments = payments.filter(p => p.createdAt <= filters.endDate!);
      }
    }

    payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (pagination) {
      return paginate(payments, pagination);
    }

    return {
      data: payments,
      total: payments.length,
      page: 1,
      pageSize: payments.length,
      totalPages: 1,
    };
  },

  findById(id: string): Payment | undefined {
    return getStore().payments.find(p => p.id === id);
  },

  create(data: Omit<Payment, "id" | "createdAt">): Payment {
    const payment: Payment = {
      ...data,
      id: generateId("PAY"),
      createdAt: formatDate(),
    };
    getStore().payments.unshift(payment);
    return payment;
  },

  generateInvoiceNumber(): string {
    const count = getStore().payments.length + 1;
    return `INV-${new Date().getFullYear()}-${String(count).padStart(4, "0")}`;
  },

  getTodayTotal(branchId: string): { amount: number; count: number } {
    const today = new Date().toISOString().split("T")[0];
    const todayPayments = getStore().payments.filter(
      p => p.branchId === branchId && p.createdAt.startsWith(today) && p.status === "completed"
    );
    return {
      amount: todayPayments.reduce((sum, p) => sum + p.amount, 0),
      count: todayPayments.length,
    };
  },

  getWeekTotal(branchId: string): number {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return getStore().payments
      .filter(p => p.branchId === branchId && p.createdAt >= weekAgo && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
  },

  getMonthRenewals(branchId: string): number {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    return getStore().payments.filter(
      p => p.branchId === branchId && p.createdAt >= monthStart && p.status === "completed"
    ).length;
  },
};
