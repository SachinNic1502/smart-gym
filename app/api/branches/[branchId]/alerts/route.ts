import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { requireSession, resolveBranchScope } from "@/lib/api/require-auth";
import { memberRepository } from "@/modules/database";

interface RouteParams {
  params: Promise<{ branchId: string }>;
}

type AlertItem = {
  id: string;
  name: string;
  days: number;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysUntilDate(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - today.getTime()) / MS_PER_DAY);
}

function daysUntilBirthday(dateOfBirthIso: string): number | null {
  const dob = new Date(dateOfBirthIso);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const next = new Date(todayStart.getFullYear(), dob.getMonth(), dob.getDate());
  next.setHours(0, 0, 0, 0);

  if (next.getTime() < todayStart.getTime()) {
    next.setFullYear(todayStart.getFullYear() + 1);
  }

  return Math.round((next.getTime() - todayStart.getTime()) / MS_PER_DAY);
}

// GET /api/branches/[branchId]/alerts
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { branchId } = await params;

    const auth = await requireSession(["super_admin", "branch_admin"]);
    if ("response" in auth) return auth.response;

    const scoped = resolveBranchScope(auth.session, branchId);
    if ("response" in scoped) return scoped.response;

    const { searchParams } = new URL(request.url);
    const daysWindow = Number(searchParams.get("days") ?? "7");
    const limit = Number(searchParams.get("limit") ?? "8");

    const days = Number.isFinite(daysWindow) && daysWindow > 0 ? Math.min(60, daysWindow) : 7;
    const max = Number.isFinite(limit) && limit > 0 ? Math.min(50, limit) : 8;

    const members = await memberRepository.findByBranchAsync(branchId);

    const expiringSoon: AlertItem[] = members
      .map((m) => {
        const expiry = new Date(m.expiryDate);
        if (Number.isNaN(expiry.getTime())) return null;
        const d = daysUntilDate(expiry);
        return { id: m.id, name: m.name, days: d };
      })
      .filter((x): x is AlertItem => x !== null && x.days >= 0 && x.days <= days)
      .sort((a, b) => a.days - b.days)
      .slice(0, max);

    const birthdaysThisWeek: AlertItem[] = members
      .map((m) => {
        if (!m.dateOfBirth) return null;
        const d = daysUntilBirthday(m.dateOfBirth);
        if (d === null) return null;
        return { id: m.id, name: m.name, days: d };
      })
      .filter((x): x is AlertItem => x !== null && x.days >= 0 && x.days <= days)
      .sort((a, b) => a.days - b.days)
      .slice(0, max);

    return successResponse({
      branchId,
      windowDays: days,
      expiringSoon,
      birthdaysThisWeek,
    });
  } catch (error) {
    console.error("Get branch alerts error:", error);
    return errorResponse("Failed to fetch branch alerts", 500);
  }
}
