"use client";

import { useEffect, useRef, useState } from "react";

type ToastState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type ApiResponse =
  | { ok: true; message?: string }
  | { ok: false; message?: string };

export function AdminInviteSender() {
  const [emailsText, setEmailsText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  function parseEmails(raw: string): string[] {
    return raw
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@") && e.length > 3);
  }

  const parsedEmails = parseEmails(emailsText);

  async function handleSend() {
    if (!parsedEmails.length || isSending) return;

    setIsSending(true);

    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: parsedEmails })
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.ok ? "Failed to send invites." : data.message);
      }

      setToast({ kind: "success", message: data.message ?? "Invites sent." });
      setEmailsText("");
    } catch (error) {
      setToast({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Failed to send invites."
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="admin-invite-section">
      {toast ? (
        <div
          aria-live="polite"
          className={`admin-toast admin-toast-${toast.kind}`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}

      <div className="admin-section-copy">
        <p className="eyebrow">Invite sender</p>
        <h2>Send training access links</h2>
        <p>
          Paste one or more email addresses below — separated by commas, semicolons,
          or new lines. Each recipient gets a personalised 24-hour training link
          that can only be used once.
        </p>
      </div>

      <div className="invite-form">
        <label className="invite-label" htmlFor="invite-emails">
          Email addresses
          <textarea
            className="invite-textarea"
            id="invite-emails"
            onChange={(e) => setEmailsText(e.target.value)}
            placeholder={
              "alice@busha.co\nbob@busha.co\ncharlie@busha.co"
            }
            ref={textareaRef}
            rows={6}
            value={emailsText}
          />
        </label>

        <div className="invite-footer">
          {parsedEmails.length > 0 ? (
            <span className="invite-count">
              {parsedEmails.length} address{parsedEmails.length !== 1 ? "es" : ""} detected
            </span>
          ) : (
            <span className="invite-count-empty">No valid addresses yet</span>
          )}

          <button
            className="primary-button"
            disabled={parsedEmails.length === 0 || isSending}
            onClick={() => void handleSend()}
            type="button"
          >
            {isSending
              ? "Sending…"
              : `Send ${parsedEmails.length > 0 ? parsedEmails.length : ""} invite${parsedEmails.length !== 1 ? "s" : ""}`}
          </button>
        </div>

        {parsedEmails.length > 0 ? (
          <div className="invite-preview">
            <p className="section-mini">Preview</p>
            <ul>
              {parsedEmails.map((email) => (
                <li key={email}>{email}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
