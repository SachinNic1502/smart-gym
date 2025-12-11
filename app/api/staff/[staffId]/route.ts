import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { staffRepository } from "@/modules/database";
import type { Staff } from "@/lib/types";

interface RouteParams {
  params: Promise<{ staffId: string }>;
}

// GET /api/staff/[staffId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { staffId } = await params;
    const staff = staffRepository.findById(staffId);
    
    if (!staff) {
      return errorResponse("Staff member not found", 404);
    }

    return successResponse(staff);

  } catch (error) {
    console.error("Get staff error:", error);
    return errorResponse("Failed to fetch staff member", 500);
  }
}

// PUT /api/staff/[staffId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { staffId } = await params;
    const body = await parseBody<Partial<Staff>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const updated = staffRepository.update(staffId, body);
    
    if (!updated) {
      return errorResponse("Staff member not found", 404);
    }

    return successResponse(updated, "Staff member updated successfully");

  } catch (error) {
    console.error("Update staff error:", error);
    return errorResponse("Failed to update staff member", 500);
  }
}

// DELETE /api/staff/[staffId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { staffId } = await params;
    const deleted = staffRepository.delete(staffId);
    
    if (!deleted) {
      return errorResponse("Staff member not found", 404);
    }

    return successResponse({ id: staffId }, "Staff member deleted successfully");

  } catch (error) {
    console.error("Delete staff error:", error);
    return errorResponse("Failed to delete staff member", 500);
  }
}
