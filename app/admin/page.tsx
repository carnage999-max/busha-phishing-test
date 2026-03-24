import { AdminQuestionManager } from "@/components/admin-question-manager";
import { AdminSubmissionManager } from "@/components/admin-submission-manager";
import { getQuizQuestions, getRecentSubmissions } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [submissions, questions] = await Promise.all([
    getRecentSubmissions(30),
    getQuizQuestions()
  ]);

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <p className="eyebrow">Protected admin</p>
        <h1>Recent phishing test takers</h1>
        <p>
          Review recent submissions, resend retake links, and manage the live
          quiz questions used on the public course page.
        </p>
      </section>

      <AdminSubmissionManager submissions={submissions} />

      <section className="admin-question-section">
        <div className="admin-section-copy">
          <p className="eyebrow">Quiz manager</p>
          <h2>Questions, options, and answers</h2>
          <p>
            The question bank is seeded into the database automatically. The
            public course pulls 10 questions per attempt, and any edits you
            save here become part of the live bank used by new learners.
          </p>
        </div>

        <AdminQuestionManager questions={questions} />
      </section>
    </main>
  );
}
