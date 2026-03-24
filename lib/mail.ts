import { getFromEmail, getResendClient } from "@/lib/resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildLearnerEmail({
  fullName,
  score,
  percentage,
  totalQuestions
}: {
  fullName: string;
  score: number;
  percentage: number;
  totalQuestions: number;
}) {
  const safeName = escapeHtml(fullName);
  const summary =
    score >= 8
      ? "Strong result. You showed a solid understanding of phishing warning signs and safe response steps."
      : score >= 6
        ? "You have a good foundation, with a few areas worth reviewing again."
        : "The course is doing its job. A quick revisit of the modules will help reinforce the patterns attackers use.";

  return `
    <div style="font-family:Arial,sans-serif;background:#081220;color:#e8eef8;padding:32px;">
      <div style="max-width:640px;margin:0 auto;background:#101c2f;border:1px solid #223757;border-radius:20px;overflow:hidden;">
        <div style="padding:28px 28px 10px;">
          <p style="margin:0 0 12px;color:#f46c5d;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;">Busha security training</p>
          <h1 style="margin:0 0 12px;font-size:30px;line-height:1.1;color:#ffffff;">Your phishing quiz result</h1>
          <p style="margin:0;color:#9fb1cb;line-height:1.7;">Hi ${safeName}, thanks for completing the phishing awareness assessment.</p>
        </div>
        <div style="padding:24px 28px 28px;">
          <div style="display:inline-block;padding:20px 22px;border-radius:18px;background:#0c1728;border:1px solid #223757;margin-bottom:20px;">
            <div style="font-size:42px;font-weight:800;color:#f7b347;line-height:1;">${score}/${totalQuestions}</div>
            <div style="margin-top:6px;color:#9fb1cb;font-size:14px;">${percentage}% score</div>
          </div>
          <p style="margin:0 0 16px;color:#d7e1ef;line-height:1.7;">${summary}</p>
          <p style="margin:0;color:#9fb1cb;line-height:1.7;">Keep verifying unusual requests through trusted channels, especially anything involving credentials, wallet access, approval requests, or urgent payments.</p>
        </div>
      </div>
    </div>
  `;
}

function buildAdminEmail({
  fullName,
  email,
  score,
  percentage,
  totalQuestions
}: {
  fullName: string;
  email: string;
  score: number;
  percentage: number;
  totalQuestions: number;
}) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f5f7fb;color:#0b1220;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dde5f0;border-radius:16px;padding:24px;">
        <p style="margin:0 0 12px;color:#f46c5d;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;">Assessment completed</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.15;">A learner finished the phishing test</h1>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#5b6b84;">Name</td><td style="padding:8px 0;font-weight:700;">${escapeHtml(fullName)}</td></tr>
          <tr><td style="padding:8px 0;color:#5b6b84;">Email</td><td style="padding:8px 0;font-weight:700;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:8px 0;color:#5b6b84;">Score</td><td style="padding:8px 0;font-weight:700;">${score}/${totalQuestions} (${percentage}%)</td></tr>
        </table>
      </div>
    </div>
  `;
}

function buildRetakeEmail({
  fullName,
  liveCourseUrl
}: {
  fullName: string;
  liveCourseUrl: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;background:#081220;color:#e8eef8;padding:32px;">
      <div style="max-width:640px;margin:0 auto;background:#101c2f;border:1px solid #223757;border-radius:20px;overflow:hidden;">
        <div style="padding:28px 28px 10px;">
          <p style="margin:0 0 12px;color:#f46c5d;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;">Busha phishing test</p>
          <h1 style="margin:0 0 12px;font-size:30px;line-height:1.1;color:#ffffff;">You have been invited to retake the assessment</h1>
          <p style="margin:0;color:#9fb1cb;line-height:1.7;">Hi ${escapeHtml(fullName)}, you can retake the Busha phishing awareness test using the secure link below.</p>
        </div>
        <div style="padding:24px 28px 28px;">
          <a href="${escapeHtml(liveCourseUrl)}" style="display:inline-block;padding:14px 20px;border-radius:999px;background:#f7b347;color:#081220;text-decoration:none;font-weight:700;">Start retake</a>
          <p style="margin:18px 0 0;color:#9fb1cb;line-height:1.7;">If the button does not open, use this link:</p>
          <p style="margin:8px 0 0;word-break:break-all;"><a href="${escapeHtml(liveCourseUrl)}" style="color:#d8e7ff;">${escapeHtml(liveCourseUrl)}</a></p>
        </div>
      </div>
    </div>
  `;
}

export async function sendSubmissionEmails({
  fullName,
  email,
  score,
  percentage,
  totalQuestions
}: {
  fullName: string;
  email: string;
  score: number;
  percentage: number;
  totalQuestions: number;
}) {
  const resend = getResendClient();
  const from = getFromEmail();

  if (!resend || !from) {
    return;
  }

  await resend.emails.send({
    from,
    to: [email],
    subject: `Your phishing training score: ${score}/${totalQuestions}`,
    html: buildLearnerEmail({ fullName, score, percentage, totalQuestions })
  });

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!adminEmail) {
    return;
  }

  await resend.emails.send({
    from,
    to: [adminEmail],
    subject: `${fullName} completed the phishing test`,
    html: buildAdminEmail({
      fullName,
      email,
      score,
      percentage,
      totalQuestions
    })
  });
}

export async function sendRetakeAssessmentEmail({
  fullName,
  email,
  liveCourseUrl
}: {
  fullName: string;
  email: string;
  liveCourseUrl: string;
}) {
  const resend = getResendClient();
  const from = getFromEmail();

  if (!resend || !from) {
    throw new Error("Resend is not configured.");
  }

  await resend.emails.send({
    from,
    to: [email],
    subject: "Retake your Busha phishing test",
    html: buildRetakeEmail({ fullName, liveCourseUrl })
  });
}
