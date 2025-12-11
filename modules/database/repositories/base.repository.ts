/**
 * Base Repository
 * 
 * Provides common CRUD operations for all entities.
 */

import { getStore } from "../store";

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`.toUpperCase();
}

export function formatDate(date: Date = new Date()): string {
  return date.toISOString();
}

export function paginate<T>(
  items: T[],
  options?: PaginationOptions
): PaginatedResult<T> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = items.slice(start, end);

  return { data, total, page, pageSize, totalPages };
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
