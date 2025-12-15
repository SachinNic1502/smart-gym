import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { planRepository } from "@/modules/database";
import { requireSession } from "@/lib/api/require-auth";
import { connectToDatabase } from "@/modules/database/mongoose";
import type { WorkoutPlan, DietPlan } from "@/lib/types";

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

// POST /api/plans - Create a new plan (workout or diet)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const { type, ...payload } = body;

    if (!type || !["workout", "diet"].includes(type)) {
      return errorResponse("Invalid or missing plan type. Expected 'workout' or 'diet'.", 400);
    }

    if (type === "workout") {
      const { name, difficulty, durationWeeks, description, exercises } = payload;
      if (!name || !difficulty || !durationWeeks) {
        return errorResponse("Missing required fields: name, difficulty, durationWeeks", 400);
      }
      const newPlan: Omit<WorkoutPlan, "id" | "createdAt"> = {
        name,
        difficulty,
        durationWeeks: Number(durationWeeks),
        description: description || "",
        exercises: exercises || [],
      };
      const created = await planRepository.createWorkoutPlanAsync(newPlan as WorkoutPlan);
      return successResponse(created, "Workout plan created successfully");
    }

    if (type === "diet") {
      const { name, caloriesPerDay, description, meals } = payload;
      if (!name || !caloriesPerDay) {
        return errorResponse("Missing required fields: name, caloriesPerDay", 400);
      }
      const newPlan: Omit<DietPlan, "id" | "createdAt"> = {
        name,
        caloriesPerDay: Number(caloriesPerDay),
        description: description || "",
        meals: meals || [],
      };
      const created = await planRepository.createDietPlanAsync(newPlan as DietPlan);
      return successResponse(created, "Diet plan created successfully");
    }

    return errorResponse("Unsupported plan type", 400);
  } catch (error) {
    console.error("Create plan error:", error);
    return errorResponse("Failed to create plan", 500);
  }
}
