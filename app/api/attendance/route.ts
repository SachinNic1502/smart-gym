import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { attendanceService } from "@/modules/services";
import type { AttendanceMethod } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

// GET /api/attendance - List attendance records
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin", "member"]);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);

    const scoped = resolveBranchScope(auth.session, searchParams.get("branchId"));
    if ("response" in scoped) return scoped.response;

    const filters = {
      branchId: scoped.branchId,
      // If member, force their own ID; otherwise allow filtering by memberId param
      memberId: auth.session.role === "member" ? auth.session.sub : (searchParams.get("memberId") || undefined),
      date: searchParams.get("date") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const result = await attendanceService.getAttendance(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get attendance error:", error);
    return errorResponse("Failed to fetch attendance records", 500);
  }
}

interface CheckInRequest {
  memberId: string;
  branchId: string;
  method: AttendanceMethod;
  deviceId?: string;
}

// POST /api/attendance - Record a check-in
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<CheckInRequest>(request);

    if (!body) {
      return errorResponse("Invalid request body");
    }

    const { memberId, method, deviceId } = body;

    const scoped = resolveBranchScope(auth.session, body.branchId);
    if ("response" in scoped) return scoped.response;
    const branchId = scoped.branchId;

    if (!memberId || !branchId || !method) {
      return errorResponse("memberId, branchId, and method are required");
    }

    const result = await attendanceService.checkIn({ memberId, branchId, method, deviceId });

    if (!result.success) {
      return errorResponse(result.error || "Check-in failed", 403);
    }

    return successResponse(result.data, result.message, 201);

  } catch (error) {
    console.error("Check-in error:", error);
    return errorResponse("Failed to record attendance", 500);
  }
}
