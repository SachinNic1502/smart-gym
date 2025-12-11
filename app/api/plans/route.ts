import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { planRepository } from "@/modules/database";

// GET /api/plans - List all plans (membership, workout, diet)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // membership, workout, diet

    if (type === "workout") {
      const plans = planRepository.findAllWorkoutPlans();
      return successResponse({
        data: plans,
        total: plans.length,
      });
    }

    if (type === "diet") {
      const plans = planRepository.findAllDietPlans();
      return successResponse({
        data: plans,
        total: plans.length,
      });
    }

    // Default: membership plans
    const plans = planRepository.findAllMembershipPlans(true);
    
    return successResponse({
      data: plans,
      total: plans.length,
    });

  } catch (error) {
    console.error("Get plans error:", error);
    return errorResponse("Failed to fetch plans", 500);
  }
}
