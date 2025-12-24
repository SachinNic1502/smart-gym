import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { memberService, auditService } from "@/modules/services";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

interface RouteParams {
    params: Promise<{ memberId: string }>;
}

// POST /api/members/[memberId]/block - Block a member
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireSession(["super_admin", "branch_admin"]);
        if ("response" in auth) return auth.response;

        const { memberId } = await params;

        // Get member to check branch access
        const existing = await memberService.getMember(memberId);
        if (!existing.success || !existing.data) {
            return errorResponse(existing.error || "Member not found", 404);
        }

        // Check branch access
        const scoped = resolveBranchScope(auth.session, existing.data.branchId);
        if ("response" in scoped) return scoped.response;

        // Block member by setting status to Cancelled
        const result = await memberService.updateMember(memberId, {
            status: "Cancelled",
        });

        if (!result.success) {
            return errorResponse(result.error || "Failed to block member", 400);
        }

        // Audit log
        const actor = await getRequestUser();
        const ipAddress = getRequestIp(request);

        auditService.logAction({
            userId: actor.userId,
            userName: actor.userName,
            action: "block_member",
            resource: "member",
            resourceId: memberId,
            details: { name: existing.data.name, previousStatus: existing.data.status },
            ipAddress,
            branchId: existing.data.branchId,
        });

        // Notify branch admins
        const memberData = existing.data; // Safe because we checked earlier
        if (memberData.branchId) {
            try {
                const { userRepository } = await import("@/modules/database");
                const { notificationRepository } = await import("@/modules/database");

                // Get all branch admins for this branch
                const branchAdmins = await userRepository.findByBranchAsync(memberData.branchId);
                const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

                console.log(`[Block] Found ${adminUsers.length} branch admins for branch ${memberData.branchId}`);

                // Create notification for each admin
                for (const admin of adminUsers) {
                    const notification = await notificationRepository.createAsync({
                        userId: admin.id,
                        type: "system_announcement" as const,
                        title: "Member Blocked",
                        message: `${memberData.name} has been blocked from accessing the gym.`,
                        priority: "medium" as const,
                        status: "unread" as const,
                        read: false,
                        data: { memberId: memberId, memberName: memberData.name },
                        branchId: memberData.branchId,
                    });
                    console.log(`[Block] Created notification ${notification.id} for admin ${admin.id}`);
                }
            } catch (notifError) {
                console.error("[Block] Failed to create notifications:", notifError);
                // Don't fail the request if notifications fail
            }
        }

        return successResponse(result.data, "Member blocked successfully");

    } catch (error) {
        console.error("Block member error:", error);
        return errorResponse("Failed to block member", 500);
    }
}
