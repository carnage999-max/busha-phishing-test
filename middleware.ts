import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  decodeBasicAuthorizationHeader,
  getAdminCredentials,
  isAdminRoute
} from "@/lib/auth";

function unauthorizedResponse() {
  const response = new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Busha Admin"'
    }
  });

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

  const expectedSessionToken = await createAdminSessionToken(
    credentials.username,
    credentials.password
  );
  const existingSessionToken =
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (existingSessionToken === expectedSessionToken) {
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return unauthorizedResponse();
  }

  const parsedCredentials = decodeBasicAuthorizationHeader(authorization);

  if (!parsedCredentials) {
    return unauthorizedResponse();
  }

  if (
    parsedCredentials.username !== credentials.username ||
    parsedCredentials.password !== credentials.password
  ) {
    return unauthorizedResponse();
  }

  const response = NextResponse.next();

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: expectedSessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
