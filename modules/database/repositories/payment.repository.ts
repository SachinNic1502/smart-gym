/**
 * Payment Repository
 */

import { connectToDatabase } from "../mongoose";
import { PaymentModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Payment } from "@/lib/types";

export interface PaymentFilters {
  branchId?: string;
  memberId?: string;
  status?: string;
}

export const paymentRepository = {
  async findAllAsync(filters?: PaymentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Payment>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.branchId) query.branchId = filters.branchId;
    if (filters?.memberId) query.memberId = filters.memberId;
    if (filters?.status) query.status = filters.status;

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

    const docs = await PaymentModel.find(query).sort({ createdAt: -1 }).lean<Payment[]>();
    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async findByIdAsync(id: string): Promise<Payment | undefined> {
    await connectToDatabase();
    const doc = await PaymentModel.findOne({ id }).lean<Payment | null>();
    return doc ?? undefined;
  },

  async generateInvoiceNumberAsync(): Promise<string> {
    return `INV-${Date.now()}`;
  },

  async createAsync(data: Omit<Payment, "id" | "createdAt">): Promise<Payment> {
    await connectToDatabase();
    const payment: Payment = {
      ...data,
      id: generateId("PAY"),
      createdAt: formatDate(),
    };
    await PaymentModel.create(payment);
    return payment;
  },

  async updateAsync(id: string, data: Partial<Payment>): Promise<Payment | undefined> {
    await connectToDatabase();
    const doc = await PaymentModel.findOneAndUpdate(
      { id },
      { ...data },
      { new: true }
    ).lean<Payment | null>();
    return doc ?? undefined;
  },

  async deleteAsync(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await PaymentModel.deleteOne({ id }).exec();
    return res.deletedCount === 1;
  },

  async getTodayTotalAsync(branchId?: string) {
    await connectToDatabase();
    const today = new Date().toISOString().split("T")[0];
    const query: Record<string, unknown> = {
      status: "completed",
      createdAt: { $regex: `^${today}` },
    };
    if (branchId) query.branchId = branchId;

    const payments = await PaymentModel.find(query).lean<Payment[]>();
    const amount = payments.reduce((sum, p) => sum + p.amount, 0);
    return { amount, count: payments.length };
  },

  async getWeekTotalAsync(branchId?: string) {
    await connectToDatabase();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const query: Record<string, unknown> = {
      status: "completed",
      createdAt: { $gte: weekAgo.toISOString() },
    };
    if (branchId) query.branchId = branchId;

    const payments = await PaymentModel.find(query).lean<Payment[]>();
    return payments.reduce((sum, p) => sum + p.amount, 0);
  },

  async getMonthRenewalsAsync(branchId?: string) {
    await connectToDatabase();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const query: Record<string, unknown> = {
      status: "completed",
      description: { $regex: /renewal/i },
      createdAt: { $gte: startOfMonth.toISOString() },
    };
    if (branchId) query.branchId = branchId;

    return await PaymentModel.countDocuments(query).exec();
  },
};
