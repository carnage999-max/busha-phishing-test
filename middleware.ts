import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminCredentials,
  isAdminPublicRoute,
  isAdminRoute
} from "@/lib/auth";

function clearAdminSession(response: NextResponse) {
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}

export async function middleware(request: NextRequest) {
  if (!isAdminRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const credentials = getAdminCredentials();

  if (!credentials) {
    return NextResponse.next();
  }

  const expectedSessionToken = await createAdminSessionToken(credentials.username, credentials.password);
  const existingSessionToken =
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (isAdminPublicRoute(request.nextUrl.pathname)) {
    if (existingSessionToken === expectedSessionToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return clearAdminSession(NextResponse.next());
  }

  if (existingSessionToken === expectedSessionToken) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    return clearAdminSession(
      NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  return clearAdminSession(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
