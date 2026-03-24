import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAdminCredentials, isAdminRoute } from "@/lib/auth";

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Busha Admin"'
    }
  });
}

export function middleware(request: NextRequest) {
  if (!isAdminRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const credentials = getAdminCredentials();

  if (!credentials) {
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const decoded = atob(authorization.replace("Basic ", ""));
  const [username, password] = decoded.split(":");

  if (
    username !== credentials.username ||
    password !== credentials.password
  ) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
