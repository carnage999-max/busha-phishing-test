import { NextResponse } from "next/server";
import { createAccessToken, getSubmissionById } from "@/lib/db";
import { sendRetakeAssessmentEmail } from "@/lib/mail";
import { getLiveCourseUrlFromEnv } from "@/lib/site-url";

type RetakePayload = {
  submissionIds?: number[];
  submissionId?: number; // legacy single-item support
  message?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RetakePayload;
    const message = payload.message?.trim() || undefined;

    // Support both batch (submissionIds) and legacy single (submissionId)
    const ids: number[] = payload.submissionIds?.length
      ? payload.submissionIds
      : payload.submissionId
        ? [payload.submissionId]
        : [];

    if (!ids.length) {
      throw new Error("At least one submission ID is required.");
    }

    const baseUrl = getLiveCourseUrlFromEnv();

    const results = await Promise.allSettled(
      ids.map(async (rawId) => {
        const submissionId = Number(rawId);

        if (!Number.isInteger(submissionId) || submissionId <= 0) {
          throw new Error(`Invalid submission ID: ${String(rawId)}`);
        }

        const submission = await getSubmissionById(submissionId);

        if (!submission) {
          throw new Error(`Submission ${submissionId} not found.`);
        }

        const tokenRecord = await createAccessToken(submission.email);
        const retakeUrl = new URL(baseUrl.toString());
        retakeUrl.searchParams.set("token", tokenRecord.token);

        await sendRetakeAssessmentEmail({
          fullName: submission.full_name,
          email: submission.email,
          liveCourseUrl: retakeUrl.toString(),
          message
        });

        return submission.email;
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (succeeded === 0 && failed > 0) {
      const firstRejected = results.find(
        (r) => r.status === "rejected"
      ) as PromiseRejectedResult;
      throw new Error(
        firstRejected.reason instanceof Error
          ? firstRejected.reason.message
          : "Failed to send retake links."
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Retake link${succeeded !== 1 ? "s" : ""} sent to ${succeeded} recipient${succeeded !== 1 ? "s" : ""}.`
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send retake email.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
