import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { attendanceService } from "@/modules/services";
import type { AttendanceMethod } from "@/lib/types";

// GET /api/attendance - List attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);
    
    const filters = {
      branchId: searchParams.get("branchId") || undefined,
      memberId: searchParams.get("memberId") || undefined,
      date: searchParams.get("date") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const result = attendanceService.getAttendance(filters, pagination);
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
    const body = await parseBody<CheckInRequest>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const { memberId, branchId, method, deviceId } = body;

    if (!memberId || !branchId || !method) {
      return errorResponse("memberId, branchId, and method are required");
    }

    const result = attendanceService.checkIn({ memberId, branchId, method, deviceId });

    if (!result.success) {
      return errorResponse(result.error || "Check-in failed", 403);
    }

    return successResponse(result.data, result.message, 201);

  } catch (error) {
    console.error("Check-in error:", error);
    return errorResponse("Failed to record attendance", 500);
  }
}
