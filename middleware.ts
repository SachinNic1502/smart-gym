import { NextResponse, type NextRequest } from "next/server";
import { verifySessionJwt, type JwtSessionPayload } from "@/lib/auth/jwt";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (process.env.NODE_ENV !== "production") {
    return "dev_session_secret_change_me";
  }

  throw new Error("SESSION_SECRET is not defined (or too short). Please set it in your environment.");
}

async function getSessionFromCookie(token: string | undefined): Promise<JwtSessionPayload | null> {
  if (!token) return null;
  const secret = getSessionSecret();
  return verifySessionJwt(token, secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;
  const session = await getSessionFromCookie(sessionCookie);

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
