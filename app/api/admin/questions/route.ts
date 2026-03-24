import { NextResponse } from "next/server";
import { getNextQuestionDisplayOrder, getSql, ensureSchema } from "@/lib/db";

type QuestionRow = {
  id: number;
  question: string;
  options: string[] | string;
  correct_index: number;
  explanation: string;
};

function parseQuestionFormData(formData: FormData) {
  const question = String(formData.get("question") || "").trim();
  const explanation = String(formData.get("explanation") || "").trim();
  const correctIndex = Number(formData.get("correctIndex"));
  const options = [
    String(formData.get("option0") || "").trim(),
    String(formData.get("option1") || "").trim(),
    String(formData.get("option2") || "").trim(),
    String(formData.get("option3") || "").trim()
  ];

  if (!question) {
    throw new Error("Question text is required.");
  }

  if (options.some((option) => !option)) {
    throw new Error("All four options are required.");
  }

  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    throw new Error("A valid correct answer is required.");
  }

  if (!explanation) {
    throw new Error("Explanation is required.");
  }

  return {
    question,
    options,
    correctIndex,
    explanation
  };
}

function normalizeQuestion(row: QuestionRow) {
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

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const sql = getSql();
    const formData = await request.formData();
    const intent = String(formData.get("intent") || "");

    if (intent === "create") {
      const { question, options, correctIndex, explanation } =
        parseQuestionFormData(formData);
      const displayOrder = await getNextQuestionDisplayOrder();

      const rows = (await sql`
        INSERT INTO quiz_questions (
          question,
          options,
          correct_index,
          explanation,
          display_order
        )
        VALUES (
          ${question},
          ${JSON.stringify(options)}::jsonb,
          ${correctIndex},
          ${explanation},
          ${displayOrder}
        )
        RETURNING id, question, options, correct_index, explanation;
      `) as QuestionRow[];

      return NextResponse.json({
        ok: true,
        question: normalizeQuestion(rows[0]),
        message: "Question added."
      });
    }

    if (intent === "update") {
      const id = Number(formData.get("id"));

      if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Question ID is missing.");
      }

      const { question, options, correctIndex, explanation } =
        parseQuestionFormData(formData);

      const rows = (await sql`
        UPDATE quiz_questions
        SET
          question = ${question},
          options = ${JSON.stringify(options)}::jsonb,
          correct_index = ${correctIndex},
          explanation = ${explanation},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, question, options, correct_index, explanation;
      `) as QuestionRow[];

      if (!rows[0]) {
        throw new Error("Question not found.");
      }

      return NextResponse.json({
        ok: true,
        question: normalizeQuestion(rows[0]),
        message: "Question saved."
      });
    }

    if (intent === "delete") {
      const id = Number(formData.get("id"));

      if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Question ID is missing.");
      }

      const rows = (await sql`
        DELETE FROM quiz_questions
        WHERE id = ${id}
        RETURNING id;
      `) as Array<{ id: number }>;

      if (!rows[0]) {
        throw new Error("Question not found.");
      }

      return NextResponse.json({
        ok: true,
        deletedId: rows[0].id,
        message: "Question deleted."
      });
    }

    return NextResponse.json(
      { ok: false, message: "Unknown question action." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process question.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
