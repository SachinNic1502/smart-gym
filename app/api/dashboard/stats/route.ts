import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { dashboardService } from "@/modules/services";

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const role = searchParams.get("role") || "super_admin";

    if (role === "super_admin") {
      const stats = dashboardService.getSuperAdminStats();
      return successResponse(stats);
    } else {
      const stats = dashboardService.getBranchStats(branchId || "BRN_001");
      return successResponse(stats);
    }

  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return errorResponse("Failed to fetch dashboard stats", 500);
  }
}
