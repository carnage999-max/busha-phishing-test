import { AdminInviteSender } from "@/components/admin-invite-sender";
import { AdminQuestionManager } from "@/components/admin-question-manager";
import { AdminSubmissionManager } from "@/components/admin-submission-manager";
import { getQuizQuestions, getRecentSubmissions } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [submissions, questions] = await Promise.all([
    getRecentSubmissions(50),
    getQuizQuestions()
  ]);

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <p className="eyebrow">Protected admin</p>
        <h1>Phishing training dashboard</h1>
        <p>
          Send batch training invitations, review submissions, send retake links,
          and manage the live quiz question bank.
        </p>
      </section>

      <AdminInviteSender />

      <section className="admin-submissions-section">
        <div className="admin-section-copy">
          <p className="eyebrow">Submissions</p>
          <h2>Recent test takers</h2>
          <p>
            Select one or more rows, then send personalised retake links with an
            optional message. Each link is valid for 24 hours and single-use.
          </p>
        </div>

        <AdminSubmissionManager submissions={submissions} />
      </section>

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
