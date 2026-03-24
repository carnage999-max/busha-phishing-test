"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type LoginResponse =
  | { ok: true; message?: string }
  | { ok: false; message?: string };

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("loading");
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.ok ? "Unable to log in." : data.message);
      }

      router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to log in."
      );
      setSubmitState("idle");
    }
  }

  return (
    <form className="admin-login-form" onSubmit={(event) => void handleSubmit(event)}>
      <label className="admin-label">
        Username
        <input
          autoComplete="username"
          onChange={(event) => setUsername(event.target.value)}
          type="text"
          value={username}
        />
      </label>

      <label className="admin-label">
        Password
        <input
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="admin-inline-error">{error}</p> : null}

      <button
        className="primary-button"
        disabled={submitState !== "idle"}
        type="submit"
      >
        {submitState === "loading" ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
