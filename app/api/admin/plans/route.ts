import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { requireSession } from "@/lib/api/require-auth";
import { planRepository } from "@/modules/database";
import { connectToDatabase } from "@/modules/database/mongoose";
import type { MembershipPlan } from "@/lib/types";

// GET /api/admin/plans - List membership plans (super admin)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    try {
      await connectToDatabase();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Database connection failed";
      return errorResponse(message, 500);
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const plans = await planRepository.findAllMembershipPlansAsync(activeOnly);
    return successResponse({ data: plans, total: plans.length });
  } catch (error) {
    console.error("Get admin plans error:", error);
    return errorResponse("Failed to fetch plans", 500);
  }
}

interface CreateMembershipPlanRequest {
  name: string;
  description: string;
  durationDays: number;
  price: number;
  currency?: string;
  features?: string[];
  isActive?: boolean;
}

// POST /api/admin/plans - Create membership plan (super admin)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    try {
      await connectToDatabase();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Database connection failed";
      return errorResponse(message, 500);
    }

    const body = await parseBody<CreateMembershipPlanRequest>(request);
    if (!body) return errorResponse("Invalid request body");

    if (!body.name?.trim()) return errorResponse("name is required", 422);
    if (!body.description?.trim()) return errorResponse("description is required", 422);
    if (!Number.isFinite(body.durationDays) || body.durationDays <= 0) {
      return errorResponse("durationDays must be > 0", 422);
    }
    if (!Number.isFinite(body.price) || body.price < 0) {
      return errorResponse("price must be >= 0", 422);
    }

    const plan = await planRepository.createMembershipPlanAsync({
      name: body.name.trim(),
      description: body.description.trim(),
      durationDays: body.durationDays,
      price: body.price,
      currency: body.currency?.trim() || "INR",
      features: Array.isArray(body.features) ? body.features.filter(Boolean) : [],
      isActive: body.isActive ?? true,
    } satisfies Omit<MembershipPlan, "id">);

    return successResponse(plan, "Plan created", 201);
  } catch (error) {
    console.error("Create plan error:", error);
    return errorResponse("Failed to create plan", 500);
  }
}
