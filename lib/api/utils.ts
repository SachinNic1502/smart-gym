import { NextResponse } from "next/server";

// ============================================
// API Response Helpers
// ============================================

export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

// Backwards-compatible helpers used across many routes
// These mirror the original util names but delegate to the *Response functions above

export function success<T>(data: T, message?: string, status = 200) {
  return successResponse<T>(data, message, status);
}

export function error(message: string, status = 400) {
  return errorResponse(message, status);
}

export function notFoundResponse(resource = "Resource") {
  return errorResponse(`${resource} not found`, 404);
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = "Forbidden") {
  return errorResponse(message, 403);
}

export function validationErrorResponse(errors: Record<string, string[]>) {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      errors,
    },
    { status: 422 }
  );
}

// Legacy aliases for existing imports
export const notFound = notFoundResponse;
export const unauthorized = unauthorizedResponse;
export const forbidden = forbiddenResponse;
export const validationError = validationErrorResponse;

// ============================================
// Request Helpers
// ============================================

export async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ============================================
// ID Generation
// ============================================

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`.toUpperCase();
}

// ============================================
// Date Helpers
// ============================================

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================
// Pagination Helpers
// ============================================

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
  return { page, pageSize };
}

export function paginateArray<T>(items: T[], { page, pageSize }: PaginationParams) {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = items.slice(start, end);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  };
}
