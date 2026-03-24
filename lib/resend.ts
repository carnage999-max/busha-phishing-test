import { Resend } from "resend";

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

export function getFromEmail() {
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!fromEmail) {
    return null;
  }

  if (fromEmail.includes("<") && fromEmail.includes(">")) {
    return fromEmail;
  }

  return `Busha Phishing Test <${fromEmail}>`;
}
