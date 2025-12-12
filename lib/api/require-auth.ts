import { cookies } from "next/headers";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/api/utils";
import { authService } from "@/modules/services";
import type { JwtRole, JwtSessionPayload } from "@/lib/auth/jwt";

export type RequireSessionResult =
  | { session: JwtSessionPayload }
  | { response: Response };

export async function requireSession(roles?: JwtRole[]): Promise<RequireSessionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return { response: unauthorizedResponse("No session found") };
  }

  const session = await authService.validateSession(token);
  if (!session) {
    cookieStore.delete("session");
    return { response: unauthorizedResponse("Session expired or invalid") };
  }

  if (roles && roles.length > 0 && !roles.includes(session.role)) {
    return { response: forbiddenResponse("Forbidden") };
  }

  return { session };
}

export function resolveBranchScope(
  session: JwtSessionPayload,
  requestedBranchId?: string | null,
): { branchId?: string } | { response: Response } {
  if (session.role === "super_admin") {
    return { branchId: requestedBranchId ?? undefined };
  }

  const branchId = session.branchId;
  if (!branchId) {
    return { response: forbiddenResponse("Branch not assigned") };
  }

  if (requestedBranchId && requestedBranchId !== branchId) {
    return { response: forbiddenResponse("Forbidden") };
  }

  return { branchId };
}
