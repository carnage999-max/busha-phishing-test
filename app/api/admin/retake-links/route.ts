import { NextResponse } from "next/server";
import { getSubmissionById } from "@/lib/db";
import { sendRetakeAssessmentEmail } from "@/lib/mail";
import { getLiveCourseUrlFromEnv } from "@/lib/site-url";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { submissionId?: number };
    const submissionId = Number(payload.submissionId);

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      throw new Error("Submission ID is missing.");
    }

    const submission = await getSubmissionById(submissionId);

    if (!submission) {
      throw new Error("Submission not found.");
    }

    const retakeUrl = getLiveCourseUrlFromEnv();
    retakeUrl.searchParams.set("start", "assessment");

    await sendRetakeAssessmentEmail({
      fullName: submission.full_name,
      email: submission.email,
      liveCourseUrl: retakeUrl.toString()
    });

    return NextResponse.json({
      ok: true,
      message: `Retake link sent to ${submission.email}.`
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send retake email.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
