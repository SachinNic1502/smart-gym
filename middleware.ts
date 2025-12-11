import { NextResponse, type NextRequest } from "next/server";

interface SessionPayload {
  userId: string;
  role: "super_admin" | "branch_admin" | "member";
  exp: number;
}

function parseSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  try {
    // Token is created as Buffer.from(JSON.stringify(payload)).toString("base64")
    const json = typeof atob === "function" ? atob(token) : Buffer.from(token, "base64").toString();
    const session = JSON.parse(json) as SessionPayload;
    if (!session.exp || session.exp < Date.now()) return null;
    if (!session.userId || !session.role) return null;
    return session;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;
  const session = parseSessionToken(sessionCookie);

  const isLoginPage = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");
  const isBranchRoute = pathname.startsWith("/branch");
  const isPortalRoute = pathname.startsWith("/portal");

  // If user is not authenticated and trying to access protected routes
  if (!session && (isAdminRoute || isBranchRoute || isPortalRoute)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access login page, redirect to their dashboard
  if (session && isLoginPage) {
    const url = request.nextUrl.clone();
    if (session.role === "super_admin") {
      url.pathname = "/admin/dashboard";
    } else if (session.role === "branch_admin") {
      url.pathname = "/branch/dashboard";
    } else {
      url.pathname = "/portal/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Optional: role-based route protection
  if (session) {
    if (isAdminRoute && session.role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/branch/dashboard";
      return NextResponse.redirect(url);
    }
    if (isBranchRoute && session.role !== "branch_admin" && session.role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/dashboard";
      return NextResponse.redirect(url);
    }
    if (isPortalRoute && session.role !== "member") {
      const url = request.nextUrl.clone();
      url.pathname = session.role === "super_admin" ? "/admin/dashboard" : "/branch/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/branch/:path*",
    "/portal/:path*",
    "/login",
  ],
};
