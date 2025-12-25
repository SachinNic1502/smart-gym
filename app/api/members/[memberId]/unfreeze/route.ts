import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { memberService, auditService } from "@/modules/services";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

interface RouteParams {
    params: Promise<{ memberId: string }>;
}

// POST /api/members/[memberId]/unfreeze - Unfreeze a member's membership
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

        // Unfreeze member using service
        const result = await memberService.unfreezeMember(memberId);

        if (!result.success) {
            return errorResponse(result.error || "Failed to unfreeze member", 400);
        }

        // Audit log
        const actor = await getRequestUser();
        const ipAddress = getRequestIp(request);

        await auditService.logAction({
            userId: actor.userId,
            userName: actor.userName,
            action: "unfreeze_member",
            resource: "member",
            resourceId: memberId,
            details: { name: existing.data.name },
            ipAddress,
            branchId: existing.data.branchId,
        });

        // Notify branch admins
        const memberData = result.data!;
        if (memberData.branchId) {
            try {
                const { userRepository, notificationRepository } = await import("@/modules/database");
                const branchAdmins = await userRepository.findByBranchAsync(memberData.branchId);
                const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

                for (const admin of adminUsers) {
                    await notificationRepository.createAsync({
                        userId: admin.id,
                        type: "system_announcement" as const,
                        title: "Membership Restored",
                        message: `${memberData.name}'s membership was reactivated by ${actor.userName}.`,
                        priority: "low" as const,
                        status: "unread" as const,
                        read: false,
                        data: { memberId: memberId, memberName: memberData.name },
                        branchId: memberData.branchId,
                    });
                }
            } catch (notifError) {
                console.error("[Unfreeze] Failed to create notifications:", notifError);
            }
        }

        return successResponse(result.data, "Membership reactivated successfully");

    } catch (error) {
        console.error("Unfreeze member error:", error);
        return errorResponse("Failed to unfreeze member", 500);
    }
}
