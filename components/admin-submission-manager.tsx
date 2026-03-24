"use client";

import { useEffect, useMemo, useState } from "react";
import type { SubmissionRecord } from "@/lib/db";

type ToastState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type ApiResponse =
  | { ok: true; message?: string }
  | { ok: false; message?: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AdminSubmissionManager({
  submissions
}: {
  submissions: SubmissionRecord[];
}) {
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const averageScore = useMemo(() => {
    if (!submissions.length) {
      return 0;
    }

    return Math.round(
      submissions.reduce((sum, item) => sum + item.percentage, 0) /
        submissions.length
    );
  }, [submissions]);
  const highScores = submissions.filter((item) => item.percentage >= 80).length;

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  async function handleResend(submissionId: number) {
    setResendingId(submissionId);

    try {
      const response = await fetch("/api/admin/retake-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ submissionId })
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.ok ? "Unable to send retake link." : data.message);
      }

      setToast({
        kind: "success",
        message: data.message || "Retake link sent."
      });
    } catch (error) {
      setToast({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Unable to send retake link."
      });
    } finally {
      setResendingId(null);
    }
  }

  return (
    <>
      {toast ? (
        <div
          aria-live="polite"
          className={`admin-toast admin-toast-${toast.kind}`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}

      <section className="admin-metrics">
        <article>
          <span>Total recent</span>
          <strong>{submissions.length}</strong>
        </article>
        <article>
          <span>Average score</span>
          <strong>{averageScore}%</strong>
        </article>
        <article>
          <span>High scorers</span>
          <strong>{highScores}</strong>
        </article>
      </section>

      <section className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Score</th>
              <th>Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length ? (
              submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.full_name}</td>
                  <td className="admin-table-email">{submission.email}</td>
                  <td>
                    {submission.score}/{submission.total_questions} (
                    {submission.percentage}%)
                  </td>
                  <td>{formatDate(submission.created_at)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="ghost-button"
                        disabled={resendingId !== null}
                        onClick={() => void handleResend(submission.id)}
                        type="button"
                      >
                        {resendingId === submission.id
                          ? "Sending..."
                          : "Send retake link"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No quiz submissions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
