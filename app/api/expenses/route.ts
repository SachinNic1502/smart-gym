import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { expenseRepository } from "@/modules/database";
import type { Expense, ExpenseCategory } from "@/lib/types";

// GET /api/expenses - List expenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);
    
    const filters = {
      branchId: searchParams.get("branchId") || undefined,
      category: (searchParams.get("category") as ExpenseCategory) || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    const result = expenseRepository.findAll(filters, pagination);
    const categoryTotals = expenseRepository.getByCategory(filters.branchId);

    return successResponse({ ...result, categoryTotals });

  } catch (error) {
    console.error("Get expenses error:", error);
    return errorResponse("Failed to fetch expenses", 500);
  }
}

// POST /api/expenses - Create expense
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<Partial<Expense>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    if (!body.branchId || !body.category || !body.amount || !body.description || !body.date) {
      return errorResponse("branchId, category, amount, description, and date are required");
    }

    const expense = expenseRepository.create({
      branchId: body.branchId,
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
