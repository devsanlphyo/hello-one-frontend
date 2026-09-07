import { type NextRequest, NextResponse } from "next/server";

const ADMIN_ROLES = new Set(["admin", "director", "headmaster"]);

interface DecodedToken {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
}

function decodeJwtPayload(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  let payload: DecodedToken | null = null;
  if (token) {
    payload = decodeJwtPayload(token);
    // If token has expired, treat as unauthenticated
    if (payload?.exp && Date.now() >= payload.exp * 1000) {
      payload = null;
    }
  }

  const isAuthenticated = Boolean(payload?.sub);
  const userRole = payload?.role?.toLowerCase() || "";
  const isAdmin = ADMIN_ROLES.has(userRole);

  // 1. Root route ("/")
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin/users", request.url));
    }
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // 2. Auth login page
  if (pathname.startsWith("/auth/login")) {
    if (isAuthenticated) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin/users", request.url));
      }
      return NextResponse.redirect(new URL("/profile", request.url));
    }
    return NextResponse.next();
  }

  // 3. Admin portal routes ("/admin/*")
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin) {
      // Non-administrative users are server-redirected to /profile (no admin UI leaked)
      return NextResponse.redirect(new URL("/profile", request.url));
    }
    return NextResponse.next();
  }

  // 4. Profile page ("/profile")
  if (pathname.startsWith("/profile")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
