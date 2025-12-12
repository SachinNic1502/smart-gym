/**
 * Payment Repository
 */

import { getStore } from "../store";
import { connectToDatabase } from "../mongoose";
import { PaymentModel } from "../models";
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

  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

  async findAllAsync(filters?: PaymentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Payment>> {
    try {
      await connectToDatabase();
    } catch {
      return this.findAll(filters, pagination);
    }

    const query: Record<string, unknown> = {};
    if (filters?.branchId) query.branchId = filters.branchId;
    if (filters?.memberId) query.memberId = filters.memberId;
    if (filters?.status) query.status = filters.status;

    const createdAtQuery: Record<string, string> = {};
    if (filters?.startDate) createdAtQuery.$gte = filters.startDate;
    if (filters?.endDate) createdAtQuery.$lte = filters.endDate;
    if (Object.keys(createdAtQuery).length) {
      query.createdAt = createdAtQuery;
    }

    const total = await PaymentModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const docs = await PaymentModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<Payment[]>();

      return {
        data: docs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const docs = await PaymentModel.find(query)
      .sort({ createdAt: -1 })
      .lean<Payment[]>();

    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async generateInvoiceNumberAsync(): Promise<string> {
    try {
      await connectToDatabase();
    } catch {
      return this.generateInvoiceNumber();
    }

    const count = await PaymentModel.countDocuments({}).exec();
    return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
  },

  async createAsync(data: Omit<Payment, "id" | "createdAt">): Promise<Payment> {
    const payment = this.create(data);

    try {
      await connectToDatabase();
      await PaymentModel.create(payment);
    } catch {
      // ignore and keep in-memory
    }

    return payment;
  },

  async getTodayTotalAsync(branchId: string): Promise<{ amount: number; count: number }> {
    try {
      await connectToDatabase();
    } catch {
      return this.getTodayTotal(branchId);
    }

    const today = new Date().toISOString().split("T")[0];
    const docs = await PaymentModel.find({
      branchId,
      status: "completed",
      createdAt: { $gte: `${today}T00:00:00.000Z`, $lte: `${today}T23:59:59.999Z` },
    }).lean<Payment[]>();

    return {
      amount: docs.reduce((sum, p) => sum + p.amount, 0),
      count: docs.length,
    };
  },

  async getWeekTotalAsync(branchId: string): Promise<number> {
    try {
      await connectToDatabase();
    } catch {
      return this.getWeekTotal(branchId);
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const docs = await PaymentModel.find({ branchId, status: "completed", createdAt: { $gte: weekAgo } })
      .lean<Payment[]>();
    return docs.reduce((sum, p) => sum + p.amount, 0);
  },

  async getMonthRenewalsAsync(branchId: string): Promise<number> {
    try {
      await connectToDatabase();
    } catch {
      return this.getMonthRenewals(branchId);
    }

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const count = await PaymentModel.countDocuments({ branchId, status: "completed", createdAt: { $gte: monthStart } }).exec();
    return count;
  },
};
