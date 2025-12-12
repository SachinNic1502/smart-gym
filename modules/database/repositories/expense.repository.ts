/**
 * Expense Repository
 */

import { getStore } from "../store";
import { connectToDatabase } from "../mongoose";
import { ExpenseModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Expense, ExpenseCategory } from "@/lib/types";

export interface ExpenseFilters {
  branchId?: string;
  category?: ExpenseCategory;
  startDate?: string;
  endDate?: string;
}

export const expenseRepository = {
  findAll(filters: ExpenseFilters = {}, pagination?: PaginationOptions): PaginatedResult<Expense> {
    const store = getStore();
    let filtered = [...store.expenses];

    if (filters.branchId) {
      filtered = filtered.filter(e => e.branchId === filters.branchId);
    }

    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }

    if (filters.startDate) {
      filtered = filtered.filter(e => e.date >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(e => e.date <= filters.endDate!);
    }

    // Sort by most recent
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return paginate(filtered, pagination);
  },

  findById(id: string): Expense | undefined {
    return getStore().expenses.find(e => e.id === id);
  },

  create(data: Omit<Expense, "id" | "createdAt">): Expense {
    const store = getStore();
    const expense: Expense = {
      ...data,
      id: generateId("EXP"),
      createdAt: formatDate(new Date()),
    };
    store.expenses.unshift(expense);
    return expense;
  },

  update(id: string, data: Partial<Expense>): Expense | null {
    const store = getStore();
    const index = store.expenses.findIndex(e => e.id === id);
    if (index === -1) return null;

    store.expenses[index] = {
      ...store.expenses[index],
      ...data,
      id, // Prevent ID change
    };
    return store.expenses[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.expenses.findIndex(e => e.id === id);
    if (index === -1) return false;
    store.expenses.splice(index, 1);
    return true;
  },

  getTotalByBranch(branchId: string, startDate?: string, endDate?: string): number {
    const store = getStore();
    return store.expenses
      .filter(e => e.branchId === branchId)
      .filter(e => !startDate || e.date >= startDate)
      .filter(e => !endDate || e.date <= endDate)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  getByCategory(branchId?: string): Record<ExpenseCategory, number> {
    const store = getStore();
    const expenses = branchId 
      ? store.expenses.filter(e => e.branchId === branchId)
      : store.expenses;

    const result: Record<string, number> = {};
    expenses.forEach(e => {
      result[e.category] = (result[e.category] || 0) + e.amount;
    });
    return result as Record<ExpenseCategory, number>;
  },

  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

  async findAllAsync(filters: ExpenseFilters = {}, pagination?: PaginationOptions): Promise<PaginatedResult<Expense>> {
    try {
      await connectToDatabase();
    } catch {
      return this.findAll(filters, pagination);
    }

    const query: Record<string, unknown> = {};
    if (filters.branchId) query.branchId = filters.branchId;
    if (filters.category) query.category = filters.category;

    const dateQuery: Record<string, string> = {};
    if (filters.startDate) dateQuery.$gte = filters.startDate;
    if (filters.endDate) dateQuery.$lte = filters.endDate;
    if (Object.keys(dateQuery).length) {
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

  async createAsync(data: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
    const expense = this.create(data);

    try {
      await connectToDatabase();
      await ExpenseModel.create(expense);
    } catch {
      // ignore
    }

    return expense;
  },

  async getTotalByBranchAsync(branchId: string, startDate?: string, endDate?: string): Promise<number> {
    try {
      await connectToDatabase();
    } catch {
      return this.getTotalByBranch(branchId, startDate, endDate);
    }

    const query: Record<string, unknown> = { branchId };

    const dateQuery: Record<string, string> = {};
    if (startDate) dateQuery.$gte = startDate;
    if (endDate) dateQuery.$lte = endDate;
    if (Object.keys(dateQuery).length) {
      query.date = dateQuery;
    }

    const docs = await ExpenseModel.find(query).lean<Expense[]>();
    return docs.reduce((sum, e) => sum + e.amount, 0);
  },

  async getByCategoryAsync(branchId?: string): Promise<Record<ExpenseCategory, number>> {
    try {
      await connectToDatabase();
    } catch {
      return this.getByCategory(branchId);
    }

    const query: Record<string, unknown> = {};
    if (branchId) query.branchId = branchId;

    const docs = await ExpenseModel.find(query).lean<Expense[]>();
    const result: Record<string, number> = {};
    docs.forEach(e => {
      result[e.category] = (result[e.category] || 0) + e.amount;
    });
    return result as Record<ExpenseCategory, number>;
  },
};
