import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminCredentials
} from "@/lib/auth";

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const credentials = getAdminCredentials();

    if (!credentials) {
      throw new Error("Admin credentials are not configured.");
    }

    const payload = (await request.json()) as LoginPayload;
    const username = payload.username?.trim() ?? "";
    const password = payload.password ?? "";

    if (
      username !== credentials.username ||
      password !== credentials.password
    ) {
      throw new Error("Invalid admin username or password.");
    }

    const sessionToken = await createAdminSessionToken(
      credentials.username,
      credentials.password
    );
    const response = NextResponse.json({
      ok: true,
      message: "Logged in."
    });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 12
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to log in.";

    return NextResponse.json({ ok: false, message }, { status: 401 });
  }
}
