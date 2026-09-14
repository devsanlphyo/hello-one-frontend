import { type NextRequest, NextResponse } from "next/server";

const ROLE_ROUTE_MAP: Record<string, string> = {
  admin: "/admin/users",
  director: "/director",
  headmaster: "/headmaster",
  officer: "/officer",
  teacher: "/teacher",
  assistant: "/assistant",
};

const NON_ADMIN_ROUTES = ["/director", "/headmaster", "/officer", "/teacher", "/assistant"];

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

function getHomeRouteForRole(role: string): string {
  return ROLE_ROUTE_MAP[role.toLowerCase()] || "/auth/login";
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
  const isAdmin = userRole === "admin";

  // 1. Root route ("/")
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return NextResponse.redirect(new URL(getHomeRouteForRole(userRole), request.url));
  }

  // 2. Auth login page
  if (pathname.startsWith("/auth/login")) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getHomeRouteForRole(userRole), request.url));
    }
    return NextResponse.next();
  }

  // 3. Admin portal routes ("/admin/*") - strictly for role="admin"
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin) {
      // Non-admins routed to their respective role portal
      return NextResponse.redirect(new URL(getHomeRouteForRole(userRole), request.url));
    }
    return NextResponse.next();
  }

  // 4. Non-admin staff routes ("/director", "/headmaster", etc.)
  const isStaffRoute = NON_ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  if (isStaffRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // If an admin accesses staff pages, redirect them to admin dashboard
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin/users", request.url));
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
