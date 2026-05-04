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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [retakeMessage, setRetakeMessage] = useState("");

  const averageScore = useMemo(() => {
    if (!submissions.length) return 0;
    return Math.round(
      submissions.reduce((sum, item) => sum + item.percentage, 0) /
        submissions.length
    );
  }, [submissions]);

  const highScores = submissions.filter((item) => item.percentage >= 80).length;
  const allSelected =
    submissions.length > 0 && selectedIds.size === submissions.length;

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(submissions.map((s) => s.id)));
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function openRetakeModal() {
    if (!selectedIds.size) return;
    setRetakeMessage("");
    setShowRetakeModal(true);
  }

  async function handleSendRetake() {
    if (!selectedIds.size || isSending) return;
    setIsSending(true);

    try {
      const response = await fetch("/api/admin/retake-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionIds: Array.from(selectedIds),
          message: retakeMessage.trim() || undefined
        })
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.ok ? "Unable to send retake links." : data.message);
      }

      setToast({ kind: "success", message: data.message ?? "Retake links sent." });
      setSelectedIds(new Set());
      setShowRetakeModal(false);
      setRetakeMessage("");
    } catch (error) {
      setToast({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Unable to send retake links."
      });
    } finally {
      setIsSending(false);
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

      {/* Retake modal */}
      {showRetakeModal ? (
        <div className="modal-backdrop" onClick={() => setShowRetakeModal(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="retake-modal-title"
          >
            <h3 id="retake-modal-title">Send retake links</h3>
            <p className="modal-sub">
              Sending personalised 24-hour retake links to{" "}
              <strong>{selectedIds.size}</strong> recipient
              {selectedIds.size !== 1 ? "s" : ""}.
            </p>

            <label className="modal-label" htmlFor="retake-message">
              Optional message to recipients
              <textarea
                className="modal-textarea"
                id="retake-message"
                onChange={(e) => setRetakeMessage(e.target.value)}
                placeholder="e.g. Hi, you are invited to retake the phishing awareness assessment. Please complete it by end of week."
                rows={4}
                value={retakeMessage}
              />
            </label>

            <div className="modal-actions">
              <button
                className="ghost-button"
                disabled={isSending}
                onClick={() => setShowRetakeModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={isSending}
                onClick={() => void handleSendRetake()}
                type="button"
              >
                {isSending ? "Sending…" : "Send retake links"}
              </button>
            </div>
          </div>
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

      {selectedIds.size > 0 ? (
        <div className="bulk-action-bar">
          <span>
            {selectedIds.size} submission{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <button
            className="primary-button"
            disabled={isSending}
            onClick={openRetakeModal}
            type="button"
          >
            Send retake link{selectedIds.size !== 1 ? "s" : ""}
          </button>
          <button
            className="ghost-button"
            onClick={() => setSelectedIds(new Set())}
            type="button"
          >
            Clear selection
          </button>
        </div>
      ) : null}

      <section className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>
                <input
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  type="checkbox"
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Score</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length ? (
              submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className={selectedIds.has(submission.id) ? "row-selected" : ""}
                >
                  <td>
                    <input
                      aria-label={`Select ${submission.full_name}`}
                      checked={selectedIds.has(submission.id)}
                      onChange={() => toggleSelect(submission.id)}
                      type="checkbox"
                    />
                  </td>
                  <td>{submission.full_name}</td>
                  <td className="admin-table-email">{submission.email}</td>
                  <td>
                    {submission.score}/{submission.total_questions} (
                    {submission.percentage}%)
                  </td>
                  <td>{formatDate(submission.created_at)}</td>
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
