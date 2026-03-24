# Busha phishing training site

Single-page Next.js phishing awareness course with:

- interactive lesson flow
- scored quiz submission
- database-backed submission storage
- Resend emails to the learner and admin
- simple `/admin` dashboard protected with basic auth

## Setup

1. Install dependencies with `pnpm install`
2. Copy `.env.example` to `.env.local`
3. Fill in:
   - `DATABASE_URL`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (the verified sender email; the app will send as `Busha Phishing Test <that-email>`)
   - `LIVE_COURSE_URL`
   - `ADMIN_NOTIFICATION_EMAIL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
4. Add your company logo at `public/busha.svg`
5. Start with `pnpm dev`

## Routes

- `/` main course page
- `/admin` recent test takers dashboard
