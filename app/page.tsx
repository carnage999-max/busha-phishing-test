import { getAssessmentQuizQuestions, validateAccessToken } from "@/lib/db";
import { CourseExperience } from "@/components/course-experience";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  if (!token) {
    return <AccessGate reason="no_token" />;
  }

  const { valid, status, tokenRecord } = await validateAccessToken(token);

  if (!valid || !tokenRecord) {
    return (
      <AccessGate
        reason={status as "used" | "expired" | "not_found"}
      />
    );
  }

  const questions = await getAssessmentQuizQuestions();

  return (
    <CourseExperience
      questions={questions}
      token={token}
      tokenEmail={tokenRecord.email}
    />
  );
}

function AccessGate({
  reason
}: {
  reason: "no_token" | "used" | "expired" | "not_found";
}) {
  const isUsed = reason === "used";
  const isExpired = reason === "expired";

  const title = isUsed
    ? "Link already used"
    : isExpired
      ? "Link expired"
      : "Access by invitation only";

  const body = isUsed
    ? "This training link has already been used. Each link is single-use. If you need to retake the assessment, contact your administrator."
    : isExpired
      ? "This training link has expired — links are valid for 24 hours. Please contact your administrator to request a new one."
      : "This phishing awareness course is available by invitation only. Check your inbox for a training invite from your administrator.";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px"
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center"
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: isUsed
              ? "rgba(247,179,71,0.12)"
              : isExpired
                ? "rgba(244,108,93,0.12)"
                : "rgba(100,149,237,0.12)",
            border: isUsed
              ? "1px solid rgba(247,179,71,0.3)"
              : isExpired
                ? "1px solid rgba(244,108,93,0.3)"
                : "1px solid rgba(100,149,237,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "28px"
          }}
        >
          {isUsed ? "✓" : isExpired ? "⏱" : "🔒"}
        </div>

        <p
          style={{
            margin: "0 0 10px",
            color: "var(--accent)",
            fontSize: "12px",
            letterSpacing: "1.6px",
            textTransform: "uppercase",
            fontWeight: 700
          }}
        >
          Busha security training
        </p>

        <h1
          style={{
            margin: "0 0 16px",
            fontSize: "26px",
            lineHeight: 1.2,
            color: "var(--text-primary)"
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: 0,
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            fontSize: "15px"
          }}
        >
          {body}
        </p>
      </div>
    </main>
  );
}
