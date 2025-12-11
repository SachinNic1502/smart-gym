/**
 * Expense Repository
 */

import { getStore } from "../store";
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
};
