import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { memberRepository, planRepository } from "@/modules/database";
import { requireSession } from "@/lib/api/require-auth";

// GET /api/me/programs - Get my workout and diet plans
export async function GET(request: NextRequest) {
    try {
        const auth = await requireSession(["member"]);
        if ("response" in auth) return auth.response;

        const { session } = auth;

        // Get member to find assigned programs
        // Use async method for production
        const member = await memberRepository.findByIdAsync(session.sub);
        if (!member) {
            return errorResponse("Member profile not found", 404);
        }

        let workoutPlan = null;
        let dietPlan = null;

        // Fetch assigned workout plan
        if (member.workoutPlanId) {
            workoutPlan = await planRepository.findWorkoutPlanByIdAsync(member.workoutPlanId);
        }

        // Fetch assigned diet plan
        if (member.dietPlanId) {
            dietPlan = await planRepository.findDietPlanByIdAsync(member.dietPlanId);
        }

        return successResponse({
            workoutPlan,
            dietPlan,
        });

    } catch (error) {
        console.error("Get member programs error:", error);
        return errorResponse("Failed to fetch programs", 500);
    }
}
