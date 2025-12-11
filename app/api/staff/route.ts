import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { staffRepository } from "@/modules/database";
import type { Staff, StaffRole } from "@/lib/types";

// GET /api/staff - List staff
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);
    
    const filters = {
      branchId: searchParams.get("branchId") || undefined,
      role: (searchParams.get("role") as StaffRole) || undefined,
      status: (searchParams.get("status") as "active" | "inactive") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const result = staffRepository.findAll(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get staff error:", error);
    return errorResponse("Failed to fetch staff", 500);
  }
}

// POST /api/staff - Create staff member
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<Partial<Staff>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    if (!body.name || !body.email || !body.phone || !body.role || !body.branchId) {
      return errorResponse("name, email, phone, role, and branchId are required");
    }

    // Check for duplicate email
    const existing = staffRepository.findByEmail(body.email);
    if (existing) {
      return errorResponse("A staff member with this email already exists", 409);
    }

    const staff = staffRepository.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      branchId: body.branchId,
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
