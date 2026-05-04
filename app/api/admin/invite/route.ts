import { NextResponse } from "next/server";
import { createAccessToken } from "@/lib/db";
import { sendInviteEmail } from "@/lib/mail";
import { getLiveCourseUrlFromEnv } from "@/lib/site-url";

type InvitePayload = {
  emails?: unknown[];
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as InvitePayload;
    const rawEmails = Array.isArray(payload.emails) ? payload.emails : [];

    const validEmails = rawEmails
      .map((e) => String(e).trim().toLowerCase())
      .filter((e) => e.includes("@") && e.length > 3);

    if (!validEmails.length) {
      throw new Error("At least one valid email address is required.");
    }

    const baseUrl = getLiveCourseUrlFromEnv();

    const results = await Promise.allSettled(
      validEmails.map(async (email) => {
        const tokenRecord = await createAccessToken(email);
        const inviteUrl = new URL(baseUrl.toString());
        inviteUrl.searchParams.set("token", tokenRecord.token);
        await sendInviteEmail({ email, inviteUrl: inviteUrl.toString() });
        return email;
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      ok: true,
      message: `Sent ${succeeded} invite${succeeded !== 1 ? "s" : ""}${failed ? `, ${failed} failed` : ""}.`,
      succeeded,
      failed
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send invites.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
