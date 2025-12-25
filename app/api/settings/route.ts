/**
 * Settings API Route
 * GET: Fetch all system settings
 * PUT: Update system settings (partial)
 */

import { NextRequest } from "next/server";
import { settingsService, auditService } from "@/modules/services";
import { userRepository, notificationRepository } from "@/modules/database";
import { success, error } from "@/lib/api/utils";
import type { SystemSettings } from "@/lib/types";
import { getRequestUser, getRequestIp } from "@/lib/api/auth-helpers";
import { requireSession } from "@/lib/api/require-auth";

export async function GET() {
  try {
    const auth = await requireSession(["super_admin", "branch_admin", "member"]);
    if ("response" in auth) return auth.response;

    const settings = await settingsService.getSettingsAsync();
    return success<SystemSettings>(settings);
  } catch (err) {
    console.error("[Settings GET]", err);
    return error("Failed to fetch settings", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireSession(["super_admin"]);
    if ("response" in auth) return auth.response;

    const body = (await req.json()) as Partial<SystemSettings>;
    const updated = await settingsService.updateSettingsAsync(body);
    const actor = await getRequestUser();
    const ipAddress = getRequestIp(req);

    await auditService.logAction({
      userId: actor.userId,
      userName: actor.userName,
      action: "update_settings",
      resource: "settings",
      resourceId: "global",
      details: body,
      ipAddress,
    });

    // Notify other Super Admins
    try {
      const superAdmins = await userRepository.findSuperAdminsAsync();
      for (const admin of superAdmins) {
        if (admin.id === actor.userId) continue;
        await notificationRepository.createAsync({
          userId: admin.id,
          type: "system_announcement",
          title: "System Settings Updated",
          message: `${actor.userName} has updated the system configuration.`,
          priority: "high",
          status: "unread",
          read: false,
          data: { updatedFields: Object.keys(body) }
        });
      }
    } catch (e) {
      console.warn("Settings notification failed", e);
    }

    return success<SystemSettings>(updated);
  } catch (err) {
    console.error("[Settings PUT]", err);
    return error("Failed to update settings", 500);
  }
}
