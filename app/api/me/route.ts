import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { memberRepository } from "@/modules/database";
import { requireSession } from "@/lib/api/require-auth";
import type { Member } from "@/lib/types";
import bcrypt from "bcryptjs";

// GET /api/me - Get current user's profile (for members)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(["member"]);
    if ("response" in auth) return auth.response;

    const { session } = auth;

    // For members, the session.sub is the member ID
    const memberId = session.sub;
    if (!memberId) {
      return errorResponse("Member ID not found in session", 400);
    }

    const member = await memberRepository.findByIdAsync(memberId);
    if (!member) {
      return errorResponse("Member not found", 404);
    }

    // Return member profile
    return successResponse({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth,
      address: member.address,
      branchId: member.branchId,
      status: member.status,
      plan: member.plan,
      expiryDate: member.expiryDate,
      image: member.image,
      createdAt: member.createdAt,
    });

  } catch (error) {
    console.error("Get profile error:", error);
    return errorResponse("Failed to fetch profile", 500);
  }
}

// POST /api/me/password - Change password for current member
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(["member"]);
    if ("response" in auth) return auth.response;

    const { session } = auth;
    const memberId = session.sub;

    if (!memberId) {
      return errorResponse("Member ID not found in session", 400);
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse("Current password and new password are required", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse("New password must be at least 6 characters", 400);
    }

    // Get member to verify current password
    const member = memberRepository.findById(memberId);
    if (!member) {
      return errorResponse("Member not found", 404);
    }

    // For demo purposes, accept any current password if no hash exists
    // In production, you'd verify against stored hash
    if (member.passwordHash) {
      const isValid = await bcrypt.compare(currentPassword, member.passwordHash);
      if (!isValid) {
        return errorResponse("Current password is incorrect", 400);
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update member password
    const updated = memberRepository.update(memberId, { passwordHash: newPasswordHash });
    if (!updated) {
      return errorResponse("Failed to update password", 500);
    }

    return successResponse(null, "Password changed successfully");
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse("Failed to change password", 500);
  }
}
// PUT /api/me - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSession(["member"]);
    if ("response" in auth) return auth.response;

    const { session } = auth;
    const memberId = session.sub;

    if (!memberId) {
      return errorResponse("Member ID not found in session", 400);
    }

    const body = await request.json();
    const { name, email, phone, dateOfBirth, address } = body;

    // Validate required fields
    if (!name || !phone) {
      return errorResponse("Name and phone are required", 400);
    }

    // Update member
    const updatedMember = await memberRepository.updateAsync(memberId, {
      name,
      email,
      phone,
      dateOfBirth,
      address,
    });

    if (!updatedMember) {
      return errorResponse("Failed to update profile", 500);
    }

    return successResponse(updatedMember, "Profile updated successfully");

  } catch (error) {
    console.error("Update profile error:", error);
    return errorResponse("Failed to update profile", 500);
  }
}
