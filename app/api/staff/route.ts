import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { staffRepository } from "@/modules/database";
import type { Staff, StaffRole } from "@/lib/types";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

// GET /api/staff - List staff
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
      role: (searchParams.get("role") as StaffRole) || undefined,
      status: (searchParams.get("status") as "active" | "inactive") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const result = await staffRepository.findAllAsync(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get staff error:", error);
    return errorResponse("Failed to fetch staff", 500);
  }
}

// POST /api/staff - Create staff member
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const body = await parseBody<Partial<Staff>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const scoped = resolveBranchScope(auth.session, body.branchId);
    if ("response" in scoped) return scoped.response;

    if (!body.name || !body.email || !body.phone || !body.role || !scoped.branchId) {
      return errorResponse("name, email, phone, role, and branchId are required");
    }

    // Check for duplicate email
    const existing = await staffRepository.findByEmailAsync(body.email);
    if (existing) {
      return errorResponse("A staff member with this email already exists", 409);
    }

    const staff = await staffRepository.createAsync({
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      branchId: scoped.branchId,
      branchName: body.branchName,
      salary: body.salary,
      joiningDate: body.joiningDate || new Date().toISOString().split("T")[0],
      status: body.status || "active",
      avatar: body.avatar,
    });

    return successResponse(staff, "Staff member created successfully", 201);

  } catch (error) {
    console.error("Create staff error:", error);
    return errorResponse("Failed to create staff member", 500);
  }
}
