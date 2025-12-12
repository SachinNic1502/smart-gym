import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { classRepository } from "@/modules/database";
import type { GymClass, ClassType } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

// GET /api/classes - List classes
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
      trainerId: searchParams.get("trainerId") || undefined,
      type: (searchParams.get("type") as ClassType) || undefined,
      status: (searchParams.get("status") as "active" | "cancelled" | "completed") || undefined,
    };

    const result = classRepository.findAll(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get classes error:", error);
    return errorResponse("Failed to fetch classes", 500);
  }
}

// POST /api/classes - Create class
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<Partial<GymClass>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const scoped = resolveBranchScope(auth.session, body.branchId);
    if ("response" in scoped) return scoped.response;

    if (!body.name || !body.type || !body.trainerId || !scoped.branchId || !body.capacity) {
      return errorResponse("name, type, trainerId, branchId, and capacity are required");
    }

    const gymClass = classRepository.create({
      name: body.name,
      type: body.type,
      description: body.description,
      trainerId: body.trainerId,
      trainerName: body.trainerName || "Unknown",
      branchId: scoped.branchId,
      capacity: body.capacity,
      schedule: body.schedule || [],
      status: body.status || "active",
    });

    return successResponse(gymClass, "Class created successfully", 201);

  } catch (error) {
    console.error("Create class error:", error);
    return errorResponse("Failed to create class", 500);
  }
}
