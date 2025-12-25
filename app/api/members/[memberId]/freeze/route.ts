import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { memberService, auditService } from "@/modules/services";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";

interface RouteParams {
    params: Promise<{ memberId: string }>;
}

// POST /api/members/[memberId]/freeze - Freeze a member's membership
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireSession(["super_admin", "branch_admin"]);
        if ("response" in auth) return auth.response;

        const { memberId } = await params;
        const body = await parseBody<{ reason?: string }>(request);

        // Get member to check branch access
        const existing = await memberService.getMember(memberId);
        if (!existing.success || !existing.data) {
            return errorResponse(existing.error || "Member not found", 404);
        }

        // Check branch access
        const scoped = resolveBranchScope(auth.session, existing.data.branchId);
        if ("response" in scoped) return scoped.response;

        // Freeze member using service
        const result = await memberService.freezeMember(memberId, body?.reason);

        if (!result.success) {
            return errorResponse(result.error || "Failed to freeze member", 400);
        }

        // Audit log
        const actor = await getRequestUser();
        const ipAddress = getRequestIp(request);

        await auditService.logAction({
            userId: actor.userId,
            userName: actor.userName,
            action: "freeze_member",
            resource: "member",
            resourceId: memberId,
            details: { name: existing.data.name, reason: body?.reason },
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
                        title: "Membership Frozen",
                        message: `${memberData.name}'s membership was frozen by ${actor.userName}.`,
                        priority: "low" as const,
                        status: "unread" as const,
                        read: false,
                        data: { memberId: memberId, memberName: memberData.name, reason: body?.reason },
                        branchId: memberData.branchId,
                    });
                }
            } catch (notifError) {
                console.error("[Freeze] Failed to create notifications:", notifError);
            }
        }

        return successResponse(result.data, "Membership frozen successfully");

    } catch (error) {
        console.error("Freeze member error:", error);
        return errorResponse("Failed to freeze member", 500);
    }
}
