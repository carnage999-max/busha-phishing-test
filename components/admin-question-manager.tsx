"use client";

import { useEffect, useState } from "react";
import type { QuizQuestion } from "@/lib/course-data";

type SubmitState = "idle" | "saving" | "deleting" | "creating";
type ToastState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type QuestionMutationResponse =
  | {
      ok: true;
      question?: QuizQuestion;
      deletedId?: number;
      message?: string;
    }
  | { ok: false; message?: string };

function QuestionEditor({
  question,
  order,
  onUpdated,
  onDeleted,
  onSuccess,
  onError
}: {
  question: QuizQuestion;
  order: number;
  onUpdated: (question: QuizQuestion) => void;
  onDeleted: (id: number) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  async function submitUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitState("saving");

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("intent", "update");
      formData.set("id", String(question.id));

      const response = await fetch("/api/admin/questions", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as QuestionMutationResponse;

      if (!response.ok || !data.ok || !data.question) {
        throw new Error(data.ok ? "Unable to update question." : data.message);
      }

      onUpdated(data.question);
      onSuccess(data.message || "Question saved.");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to update question.";
      setError(message);
      onError(message);
    } finally {
      setSubmitState("idle");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this question? This cannot be undone.")) {
      return;
    }

    setError("");
    setSubmitState("deleting");

    try {
      const formData = new FormData();
      formData.set("intent", "delete");
      formData.set("id", String(question.id));

      const response = await fetch("/api/admin/questions", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as QuestionMutationResponse;

      if (!response.ok || !data.ok || data.deletedId === undefined) {
        throw new Error(data.ok ? "Unable to delete question." : data.message);
      }

      onDeleted(data.deletedId);
      onSuccess(data.message || "Question deleted.");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to delete question.";
      setError(message);
      onError(message);
    } finally {
      setSubmitState("idle");
    }
  }

  return (
    <details className="question-editor" open={order === 1}>
      <summary className="question-editor-summary">
        <div>
          <p className="section-mini">Question {order}</p>
          <h3>{question.question}</h3>
        </div>
        <span className="question-editor-toggle">Open</span>
      </summary>

      <form className="question-editor-body" onSubmit={(event) => void submitUpdate(event)}>
        <div className="question-editor-head">
          <p className="section-mini">Edit question</p>
          <div className="question-editor-actions">
            <button
              className="ghost-button"
              disabled={submitState !== "idle"}
              type="submit"
            >
              {submitState === "saving" ? "Saving..." : "Save changes"}
            </button>
            <button
              className="danger-button"
              disabled={submitState !== "idle"}
              onClick={() => void handleDelete()}
              type="button"
            >
              {submitState === "deleting" ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <label className="admin-label">
          Question
          <textarea
            className="admin-textarea"
            defaultValue={question.question}
            name="question"
            rows={3}
          />
        </label>

        <div className="admin-form-grid">
          {question.options.map((option, index) => (
            <label className="admin-label" key={`${question.id}-option-${index}`}>
              Option {String.fromCharCode(65 + index)}
              <input defaultValue={option} name={`option${index}`} type="text" />
            </label>
          ))}
        </div>

        <div className="admin-form-grid admin-form-grid-tight">
          <label className="admin-label">
            Correct answer
            <select defaultValue={String(question.answer)} name="correctIndex">
              <option value="0">Option A</option>
              <option value="1">Option B</option>
              <option value="2">Option C</option>
              <option value="3">Option D</option>
            </select>
          </label>

          <label className="admin-label admin-span-all">
            Explanation
            <textarea
              className="admin-textarea"
              defaultValue={question.explanation}
              name="explanation"
              rows={4}
            />
          </label>
        </div>

        {error ? <p className="admin-inline-error">{error}</p> : null}
      </form>
    </details>
  );
}

function NewQuestionEditor({
  onCreated,
  onSuccess,
  onError
}: {
  onCreated: (question: QuizQuestion) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitState("creating");
    const form = event.currentTarget;

    try {
      const formData = new FormData(form);
      formData.set("intent", "create");

      const response = await fetch("/api/admin/questions", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as QuestionMutationResponse;

      if (!response.ok || !data.ok || !data.question) {
        throw new Error(data.ok ? "Unable to create question." : data.message);
      }

      form.reset();
      onCreated(data.question);
      onSuccess(data.message || "Question added.");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create question.";
      setError(message);
      onError(message);
    } finally {
      setSubmitState("idle");
    }
  }

  return (
    <details className="question-editor">
      <summary className="question-editor-summary">
        <div>
          <p className="section-mini">Quiz manager</p>
          <h3>Add a new question</h3>
        </div>
        <span className="question-editor-toggle">Open</span>
      </summary>

      <form className="question-editor-body" onSubmit={(event) => void handleCreate(event)}>
        <div className="question-editor-head">
          <p className="section-mini">Add question</p>
        </div>

        <label className="admin-label">
          Question
          <textarea className="admin-textarea" name="question" rows={3} />
        </label>

        <div className="admin-form-grid">
          <label className="admin-label">
            Option A
            <input name="option0" type="text" />
          </label>
          <label className="admin-label">
            Option B
            <input name="option1" type="text" />
          </label>
          <label className="admin-label">
            Option C
            <input name="option2" type="text" />
          </label>
          <label className="admin-label">
            Option D
            <input name="option3" type="text" />
          </label>
        </div>

        <div className="admin-form-grid admin-form-grid-tight">
          <label className="admin-label">
            Correct answer
            <select defaultValue="0" name="correctIndex">
              <option value="0">Option A</option>
              <option value="1">Option B</option>
              <option value="2">Option C</option>
              <option value="3">Option D</option>
            </select>
          </label>

          <label className="admin-label admin-span-all">
            Explanation
            <textarea className="admin-textarea" name="explanation" rows={4} />
          </label>
        </div>

        <div className="question-editor-actions question-editor-actions-end">
          <button
            className="primary-button"
            disabled={submitState !== "idle"}
            type="submit"
          >
            {submitState === "creating" ? "Adding..." : "Add question"}
          </button>
        </div>

        {error ? <p className="admin-inline-error">{error}</p> : null}
      </form>
    </details>
  );
}

export function AdminQuestionManager({
  questions
}: {
  questions: QuizQuestion[];
}) {
  const [items, setItems] = useState<QuizQuestion[]>(questions);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function handleCreated(question: QuizQuestion) {
    setItems((current) => [...current, question]);
  }

  function handleUpdated(updatedQuestion: QuizQuestion) {
    setItems((current) =>
      current.map((question) =>
        question.id === updatedQuestion.id ? updatedQuestion : question
      )
    );
  }

  function handleDeleted(deletedId: number) {
    setItems((current) =>
      current.filter((question) => question.id !== deletedId)
    );
  }

  function showSuccess(message: string) {
    setToast({ kind: "success", message });
  }

  function showError(message: string) {
    setToast({ kind: "error", message });
  }

  return (
    <>
      {toast ? (
        <div
          aria-live="polite"
          className={`admin-toast admin-toast-${toast.kind}`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}

      <div className="question-editor-list">
        {items.map((question, index) => (
          <QuestionEditor
            key={question.id}
            onDeleted={handleDeleted}
            onError={showError}
            onSuccess={showSuccess}
            onUpdated={handleUpdated}
            order={index + 1}
            question={question}
          />
        ))}
      </div>

      <NewQuestionEditor
        onCreated={handleCreated}
        onError={showError}
        onSuccess={showSuccess}
      />
    </>
  );
}
