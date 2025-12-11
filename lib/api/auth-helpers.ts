import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/modules/services";

export interface RequestUser {
  userId: string | null;
  userName: string | null;
  role: string | null;
}

export async function getRequestUser(): Promise<RequestUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return { userId: null, userName: null, role: null };
  }

  const session = authService.validateSession(token);
  if (!session) {
    return { userId: null, userName: null, role: null };
  }

  const user = authService.getUserById(session.userId);

  return {
    userId: session.userId,
    userName: user?.name ?? null,
    role: session.role ?? null,
  };
}

export function getRequestIp(req: NextRequest): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  const remote = req.headers.get("remote-addr");
  return remote ?? undefined;
}
