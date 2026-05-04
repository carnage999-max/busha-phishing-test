import { neon } from "@neondatabase/serverless";
import {
  assessmentQuestionLimit,
  seedQuizQuestions,
  type QuizQuestion
} from "@/lib/course-data";

export type SubmissionRecord = {
  id: number;
  full_name: string;
  email: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers: string;
  created_at: string;
};

export type AccessToken = {
  id: number;
  token: string;
  email: string;
  status: "active" | "used" | "expired";
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

type QuizQuestionRow = {
  id: number;
  question: string;
  options: string[] | string;
  correct_index: number;
  explanation: string;
  display_order: number;
};

function mapQuizQuestionRow(row: QuizQuestionRow): QuizQuestion {
  return {
    id: row.id,
    question: row.question,
    options:
      typeof row.options === "string"
        ? (JSON.parse(row.options) as string[])
        : row.options,
    answer: row.correct_index,
    explanation: row.explanation
  };
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  return databaseUrl;
}

export function getSql() {
  return neon(getDatabaseUrl());
}

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) {
    return;
  }

  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_submissions (
      id BIGSERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      answers JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS quiz_submissions_created_at_idx
    ON quiz_submissions (created_at DESC);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id BIGSERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      display_order INTEGER NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS quiz_questions_display_order_idx
    ON quiz_questions (display_order ASC);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS access_tokens (
      id BIGSERIAL PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS access_tokens_token_idx
    ON access_tokens (token);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS access_tokens_email_idx
    ON access_tokens (email);
  `;

  for (const question of seedQuizQuestions) {
    await sql`
      INSERT INTO quiz_questions (
        question,
        options,
        correct_index,
        explanation,
        display_order
      )
      VALUES (
        ${question.question},
        ${JSON.stringify(question.options)}::jsonb,
        ${question.answer},
        ${question.explanation},
        ${question.id}
      )
      ON CONFLICT (display_order) DO NOTHING;
    `;
  }

  schemaReady = true;
}

export async function getRecentSubmissions(limit = 25) {
  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    SELECT
      id,
      full_name,
      email,
      score,
      total_questions,
      percentage,
      answers::text AS answers,
      created_at
    FROM quiz_submissions
    ORDER BY created_at DESC
    LIMIT ${limit};
  `) as SubmissionRecord[];

  return rows;
}

export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    SELECT
      id,
      question,
      options,
      correct_index,
      explanation,
      display_order
    FROM quiz_questions
    ORDER BY display_order ASC, id ASC;
  `) as QuizQuestionRow[];

  return rows.map(mapQuizQuestionRow);
}

export async function getAssessmentQuizQuestions(
  limit = assessmentQuestionLimit
): Promise<QuizQuestion[]> {
  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    SELECT
      id,
      question,
      options,
      correct_index,
      explanation,
      display_order
    FROM quiz_questions
    ORDER BY RANDOM()
    LIMIT ${limit};
  `) as QuizQuestionRow[];

  return rows.map(mapQuizQuestionRow);
}

export async function getQuestionCount() {
  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    SELECT COUNT(*)::int AS count
    FROM quiz_questions;
  `) as Array<{ count: number }>;

  return rows[0]?.count ?? 0;
}

export async function getNextQuestionDisplayOrder() {
  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    SELECT COALESCE(MAX(display_order), 0)::int AS max_order
    FROM quiz_questions;
  `) as Array<{ max_order: number }>;

  return (rows[0]?.max_order ?? 0) + 1;
}

export async function getSubmissionById(id: number) {
  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    SELECT
      id,
      full_name,
      email,
      score,
      total_questions,
      percentage,
      answers::text AS answers,
      created_at
    FROM quiz_submissions
    WHERE id = ${id}
    LIMIT 1;
  `) as SubmissionRecord[];

  return rows[0] ?? null;
}

// ── Access token helpers ──────────────────────────────────────────────────────

function generateToken() {
  const a = crypto.randomUUID().replace(/-/g, "");
  const b = crypto.randomUUID().replace(/-/g, "");
  return `${a}${b}`;
}

export async function createAccessToken(email: string): Promise<AccessToken> {
  await ensureSchema();
  const sql = getSql();
  const token = generateToken();
  const normalizedEmail = email.trim().toLowerCase();

  const rows = (await sql`
    INSERT INTO access_tokens (token, email, expires_at)
    VALUES (
      ${token},
      ${normalizedEmail},
      NOW() + INTERVAL '24 hours'
    )
    RETURNING id, token, email, status, created_at, expires_at, used_at;
  `) as AccessToken[];

  return rows[0];
}

async function expireStaleTokens(sql: ReturnType<typeof getSql>) {
  await sql`
    UPDATE access_tokens
    SET status = 'expired'
    WHERE status = 'active' AND expires_at < NOW();
  `;
}

export async function validateAccessToken(token: string): Promise<{
  valid: boolean;
  status: "active" | "used" | "expired" | "not_found";
  tokenRecord?: AccessToken;
}> {
  await ensureSchema();
  const sql = getSql();

  await expireStaleTokens(sql);

  const rows = (await sql`
    SELECT id, token, email, status, created_at, expires_at, used_at
    FROM access_tokens
    WHERE token = ${token}
    LIMIT 1;
  `) as AccessToken[];

  const record = rows[0];

  if (!record) {
    return { valid: false, status: "not_found" };
  }

  return {
    valid: record.status === "active",
    status: record.status,
    tokenRecord: record
  };
}

export async function markTokenAsUsed(token: string) {
  await ensureSchema();
  const sql = getSql();

  await sql`
    UPDATE access_tokens
    SET status = 'used', used_at = NOW()
    WHERE token = ${token} AND status = 'active';
  `;
}

export async function getRecentTokens(limit = 100): Promise<AccessToken[]> {
  await ensureSchema();
  const sql = getSql();

  await expireStaleTokens(sql);

  const rows = (await sql`
    SELECT id, token, email, status, created_at, expires_at, used_at
    FROM access_tokens
    ORDER BY created_at DESC
    LIMIT ${limit};
  `) as AccessToken[];

  return rows;
}
