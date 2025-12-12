import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { expenseRepository } from "@/modules/database";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

// GET /api/expenses - List expenses
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);

    const scoped = resolveBranchScope(auth.session, searchParams.get("branchId"));
    if ("response" in scoped) return scoped.response;
    
    const filters = {
      branchId: scoped.branchId,
      category: (searchParams.get("category") as ExpenseCategory) || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    const result = await expenseRepository.findAllAsync(filters, pagination);
    const categoryTotals = await expenseRepository.getByCategoryAsync(filters.branchId);

    return successResponse({ ...result, categoryTotals });

  } catch (error) {
    console.error("Get expenses error:", error);
    return errorResponse("Failed to fetch expenses", 500);
  }
}

// POST /api/expenses - Create expense
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<Partial<Expense>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const scoped = resolveBranchScope(auth.session, body.branchId);
    if ("response" in scoped) return scoped.response;

    if (!scoped.branchId || !body.category || !body.amount || !body.description || !body.date) {
      return errorResponse("branchId, category, amount, description, and date are required");
    }

    const expense = await expenseRepository.createAsync({
      branchId: scoped.branchId,
      category: body.category,
      amount: body.amount,
      currency: body.currency || "INR",
      description: body.description,
      date: body.date,
      createdBy: body.createdBy || "SYSTEM",
    });

    return successResponse(expense, "Expense created successfully", 201);

  } catch (error) {
    console.error("Create expense error:", error);
    return errorResponse("Failed to create expense", 500);
  }
}
