/**
 * Expense Repository
 */

import { connectToDatabase } from "../mongoose";
import { ExpenseModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Expense } from "@/lib/types";

export interface ExpenseFilters {
  branchId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export const expenseRepository = {
  async findAllAsync(filters?: ExpenseFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Expense>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.branchId) query.branchId = filters.branchId;
    if (filters?.category) query.category = filters.category;
    if (filters?.startDate || filters?.endDate) {
      const dateQuery: Record<string, unknown> = {};
      if (filters.startDate) dateQuery.$gte = filters.startDate;
      if (filters.endDate) dateQuery.$lte = filters.endDate;
      query.date = dateQuery;
    }

    const total = await ExpenseModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const docs = await ExpenseModel.find(query)
        .sort({ date: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<Expense[]>();

      return {
        data: docs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const docs = await ExpenseModel.find(query).sort({ date: -1 }).lean<Expense[]>();
    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async findByIdAsync(id: string): Promise<Expense | undefined> {
    await connectToDatabase();
    const doc = await ExpenseModel.findOne({ id }).lean<Expense | null>();
    return doc ?? undefined;
  },

  async createAsync(data: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
    await connectToDatabase();
    const expense: Expense = {
      ...data,
      id: generateId("EXP"),
      createdAt: formatDate(),
    };
    await ExpenseModel.create(expense);
    return expense;
  },

  async updateAsync(id: string, data: Partial<Expense>): Promise<Expense | undefined> {
    await connectToDatabase();
    const doc = await ExpenseModel.findOneAndUpdate(
      { id },
      { ...data },
      { new: true }
    ).lean<Expense | null>();
    return doc ?? undefined;
  },

  async deleteAsync(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await ExpenseModel.deleteOne({ id }).exec();
    return res.deletedCount === 1;
  },

  async getStatsAsync(branchId?: string) {
    await connectToDatabase();
    const query: Record<string, unknown> = {};
    if (branchId) query.branchId = branchId;

    const docs = await ExpenseModel.find(query).lean<Expense[]>();

    const total = docs.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = docs.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    return { total, byCategory };
  },
};
