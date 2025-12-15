import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { planRepository } from "@/modules/database";
import { requireSession } from "@/lib/api/require-auth";
import { connectToDatabase } from "@/modules/database/mongoose";

// GET /api/plans - List all plans (membership, workout, diet)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin", "member"]);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // membership, workout, diet

    if (type === "workout") {
      const plans = await planRepository.findAllWorkoutPlansAsync();
      return successResponse({
        data: plans,
        total: plans.length,
      });
    }

    if (type === "diet") {
      const plans = await planRepository.findAllDietPlansAsync();
      return successResponse({
        data: plans,
        total: plans.length,
      });
    }

    // Default: membership plans
    try {
      await connectToDatabase();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Database connection failed";
      return errorResponse(message, 500);
    }

    const plans = await planRepository.findAllMembershipPlansAsync(true);
    
    return successResponse({
      data: plans,
      total: plans.length,
    });

  } catch (error) {
    console.error("Get plans error:", error);
    return errorResponse("Failed to fetch plans", 500);
  }
}
