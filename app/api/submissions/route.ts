import { NextResponse } from "next/server";
import { ensureSchema, getQuizQuestions, getSql } from "@/lib/db";
import { sendSubmissionEmails } from "@/lib/mail";

type SubmittedAnswer = {
  questionId: number;
  selectedIndex: number;
};

type SubmissionPayload = {
  fullName: string;
  email: string;
  answers: SubmittedAnswer[];
};

function validatePayload(payload: SubmissionPayload) {
  const fullName = payload.fullName?.trim();
  const email = payload.email?.trim().toLowerCase();
  const answers = Array.isArray(payload.answers) ? payload.answers : [];

  if (!fullName || !email) {
    throw new Error("Full name and email are required.");
  }

  return {
    fullName,
    email,
    answers
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SubmissionPayload;
    const { fullName, email, answers } = validatePayload(payload);

    await ensureSchema();
    const questions = await getQuizQuestions();

    if (!questions.length) {
      throw new Error("Quiz questions are not configured.");
    }

    if (!answers.length) {
      throw new Error("Quiz answers are incomplete.");
    }

    const questionMap = new Map(questions.map((question) => [question.id, question]));
    const submittedQuestionIds = new Set<number>();
    const normalizedAnswers = answers.map((answer) => {
      if (submittedQuestionIds.has(answer.questionId)) {
        throw new Error("Duplicate quiz answers were submitted.");
      }

      const question = questionMap.get(answer.questionId);

      if (!question) {
        throw new Error("One or more submitted questions are invalid.");
      }

      if (
        !Number.isInteger(answer.selectedIndex) ||
        answer.selectedIndex < 0 ||
        answer.selectedIndex >= question.options.length
      ) {
        throw new Error("One or more selected answers are invalid.");
      }

      submittedQuestionIds.add(question.id);

      return {
        questionId: question.id,
        selectedIndex: answer.selectedIndex,
        correctIndex: question.answer,
        isCorrect: answer.selectedIndex === question.answer
      };
    });

    const score = normalizedAnswers.reduce((total, answer) => {
      return total + (answer.isCorrect ? 1 : 0);
    }, 0);
    const totalQuestions = normalizedAnswers.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const sql = getSql();

    await sql`
      INSERT INTO quiz_submissions (
        full_name,
        email,
        score,
        total_questions,
        percentage,
        answers
      )
      VALUES (
        ${fullName},
        ${email},
        ${score},
        ${totalQuestions},
        ${percentage},
        ${JSON.stringify(normalizedAnswers)}::jsonb
      );
    `;

    try {
      await sendSubmissionEmails({
        fullName,
        email,
        score,
        percentage,
        totalQuestions
      });
    } catch (emailError) {
      console.error("Email send failed", emailError);
    }

    return NextResponse.json({
      ok: true,
      score,
      totalQuestions,
      percentage
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save submission.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
