import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { dashboardService } from "@/modules/services";
import { requireSession } from "@/lib/api/require-auth";

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    if (auth.session.role === "super_admin") {
      const { searchParams } = new URL(request.url);
      const branchId = searchParams.get("branchId") || undefined;
      const stats = await dashboardService.getSuperAdminStats(branchId);
      return successResponse(stats);
    } else {
      const branchId = auth.session.branchId;
      if (!branchId) {
        return errorResponse("Branch not assigned", 403);
      }

      const stats = await dashboardService.getBranchStats(branchId);
      return successResponse(stats);
    }

  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return errorResponse("Failed to fetch dashboard stats", 500);
  }
}
