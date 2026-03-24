"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  lessons,
  type QuizQuestion,
  type LessonSection
} from "@/lib/course-data";

type View = "welcome" | "assessment" | "results" | `lesson-${number}`;

type Participant = {
  fullName: string;
  email: string;
};

type AnswerRecord = {
  questionId: number;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
};

type SubmissionResult = {
  score: number;
  totalQuestions: number;
  percentage: number;
};

function getViewLabel(view: View) {
  if (view === "welcome") return "Overview";
  if (view === "assessment") return "Assessment";
  if (view === "results") return "Results";
  const lessonNumber = Number(view.replace("lesson-", ""));
  return `Module ${String(lessonNumber).padStart(2, "0")}`;
}

function getProgress(
  view: View,
  quizIndex: number,
  quizStarted: boolean,
  totalQuestions: number
) {
  if (view === "welcome") return 5;
  if (view.startsWith("lesson-")) {
    const lessonNumber = Number(view.replace("lesson-", ""));
    return 12 + lessonNumber * 13;
  }
  if (view === "assessment") {
    return quizStarted
      ? 80 + Math.round(((quizIndex + 1) / totalQuestions) * 18)
      : 80;
  }
  return 100;
}

function getResultCopy(score: number, totalQuestions: number) {
  if (score === totalQuestions) {
    return {
      title: "Perfect score",
      message:
        "You caught every prompt correctly. That is the kind of pattern recognition that stops phishing attempts before they spread."
    };
  }

  if (score >= 8) {
    return {
      title: "Excellent work",
      message:
        "You have a strong grasp of phishing red flags and the right escalation steps. Keep reinforcing the habit of slow verification."
    };
  }

  if (score >= 6) {
    return {
      title: "Good foundation",
      message:
        "You are on the right track, with a few signals still worth reinforcing. A quick second pass through the modules should tighten those instincts."
    };
  }

  return {
    title: "Worth another pass",
    message:
      "Phishing works because it looks routine. Revisiting the examples and scenarios will make the warning signs easier to spot next time."
  };
}

function renderSection(section: LessonSection) {
  if (section.kind === "definition") {
    return (
      <article
        className={`definition-block definition-${section.tone ?? "default"}`}
      >
        {section.title ? <p className="section-mini">{section.title}</p> : null}
        <p>{section.content}</p>
      </article>
    );
  }

  if (section.kind === "stats") {
    return (
      <div className="stats-grid">
        {section.items.map((item) => (
          <article className="metric-card" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    );
  }

  if (section.kind === "cards") {
    return (
      <div className={`insight-grid columns-${section.columns ?? 3}`}>
        {section.items.map((item) => (
          <article
            className={`insight-card accent-${item.accent ?? "blue"}`}
            key={item.title}
          >
            <span className="insight-icon">{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    );
  }

  if (section.kind === "example") {
    return (
      <div className="example-grid">
        <article className="email-card">
          <div className="email-topline">{section.email.from}</div>
          <div className="email-subject">{section.email.subject}</div>
          <div className="email-body">
            {section.email.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="email-cta">{section.email.cta}</div>
          <div className="email-link">{section.email.link}</div>
          <div className="email-footer">
            {section.email.footer.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </article>

        <div className="callout-list">
          {section.callouts.map((callout) => (
            <article className="callout-card" key={callout.title}>
              <h3>{callout.title}</h3>
              <p>{callout.body}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (section.kind === "scenarios") {
    return (
      <div className="scenario-stack">
        {section.items.map((item) => (
          <article className="scenario-card" key={item.title}>
            <div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
            <div className="scenario-flags">
              <p className="section-mini">Red flags</p>
              <ul>
                {item.flags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="checklist-grid">
      <article className="checklist-card checklist-do">
        <p className="section-mini">Do this</p>
        <ul>
          {section.doItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
      <article className="checklist-card checklist-dont">
        <p className="section-mini">Avoid this</p>
        <ul>
          {section.dontItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}

export function CourseExperience({
  questions
}: {
  questions: QuizQuestion[];
}) {
  const [view, setView] = useState<View>("welcome");
  const [logoError, setLogoError] = useState(false);
  const [participant, setParticipant] = useState<Participant>({
    fullName: "",
    email: ""
  });
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [checkedAnswer, setCheckedAnswer] = useState(false);
  const [answerLog, setAnswerLog] = useState<AnswerRecord[]>([]);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const searchParams = useSearchParams();

  const totalQuestions = questions.length;
  const currentQuestion = questions[quizIndex] ?? null;
  const progress = getProgress(view, quizIndex, quizStarted, totalQuestions);
  const liveScore = answerLog.filter((answer) => answer.isCorrect).length;
  const lessonIndex =
    view.startsWith("lesson-") ? Number(view.replace("lesson-", "")) - 1 : -1;
  const activeLesson = lessonIndex >= 0 ? lessons[lessonIndex] : null;

  useEffect(() => {
    if (view !== "assessment") {
      setSubmissionError("");
    }
  }, [view]);

  useEffect(() => {
    if (searchParams.get("start") === "assessment") {
      setView("assessment");
    }
  }, [searchParams]);

  function resetQuizState() {
    setQuizStarted(false);
    setQuizIndex(0);
    setSelectedIndex(null);
    setCheckedAnswer(false);
    setAnswerLog([]);
    setSubmissionResult(null);
    setIsSubmitting(false);
    setSubmissionError("");
  }

  function openLesson(lessonId: number) {
    setView(`lesson-${lessonId}`);
  }

  function handleParticipantChange(
    field: keyof Participant,
    value: Participant[keyof Participant]
  ) {
    setParticipant((current) => ({
      ...current,
      [field]: value
    }));
  }

  function beginAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!totalQuestions) {
      setSubmissionError("No quiz questions are configured yet.");
      return;
    }

    setQuizStarted(true);
    setQuizIndex(0);
    setSelectedIndex(null);
    setCheckedAnswer(false);
    setAnswerLog([]);
    setSubmissionError("");
  }

  function checkAnswer() {
    if (selectedIndex === null || checkedAnswer || !currentQuestion) {
      return;
    }

    const isCorrect = selectedIndex === currentQuestion.answer;
    const nextAnswer: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedIndex,
      correctIndex: currentQuestion.answer,
      isCorrect
    };

    setCheckedAnswer(true);
    setAnswerLog((current) => [...current, nextAnswer]);
  }

  async function submitAssessment(finalAnswers: AnswerRecord[]) {
    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: participant.fullName,
          email: participant.email,
          answers: finalAnswers.map((answer) => ({
            questionId: answer.questionId,
            selectedIndex: answer.selectedIndex
          }))
        })
      });

      const data = (await response.json()) as
        | ({ ok: true } & SubmissionResult)
        | { ok: false; message?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.ok ? "Unable to save submission." : data.message);
      }

      setSubmissionResult({
        score: data.score,
        totalQuestions: data.totalQuestions,
        percentage: data.percentage
      });
      setView("results");
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "We could not save your result."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function nextQuestion() {
    if (!checkedAnswer) {
      return;
    }

    const finalAnswers = answerLog;

    if (quizIndex === totalQuestions - 1) {
      void submitAssessment(finalAnswers);
      return;
    }

    setQuizIndex((current) => current + 1);
    setSelectedIndex(null);
    setCheckedAnswer(false);
  }

  function restartCourse() {
    resetQuizState();
    setView("welcome");
  }

  function retakeAssessment() {
    setView("assessment");
    setQuizStarted(false);
    setQuizIndex(0);
    setSelectedIndex(null);
    setCheckedAnswer(false);
    setAnswerLog([]);
    setSubmissionResult(null);
    setIsSubmitting(false);
    setSubmissionError("");
  }

  const resultSummary = getResultCopy(
    submissionResult?.score ?? liveScore,
    totalQuestions
  );

  return (
    <main className="course-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <Link
        aria-label="Open admin dashboard"
        className="floating-admin-link"
        href="/admin"
        prefetch={false}
      >
        Admin
      </Link>

      <header className="course-header">
        <div className="brand-lockup">
          {!logoError ? (
            <img
              alt="Busha"
              className="brand-logo"
              onError={() => setLogoError(true)}
              src="/busha.svg"
            />
          ) : null}
          <div className="brand-copy">
            <span className="eyebrow">Busha security training</span>
            <strong>Phishing awareness course</strong>
          </div>
        </div>

        <div className="header-progress">
          <span>{getViewLabel(view)}</span>
          <div className="progress-rail">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <section className="course-stage">
        {view === "welcome" ? (
          <div className="screen-welcome">
            <div className="hero-copy">
              <p className="eyebrow">Interactive anti-phishing course</p>
              <h1>
                Teach your team to pause,
                <br />
                verify, and never take the bait.
              </h1>
              <p className="hero-text">
                A single-page Busha training experience with five short modules,
                an interactive assessment, email score delivery, and a simple
                admin review flow.
              </p>

              <div className="hero-actions">
                <button className="primary-button" onClick={() => openLesson(1)}>
                  Start training
                </button>
                <button
                  className="ghost-button"
                  onClick={() => setView("assessment")}
                >
                  Jump to assessment
                </button>
              </div>
            </div>

            <div className="hero-panel">
              <div className="hero-stats">
                <article>
                  <strong>5</strong>
                  <span>Short modules</span>
                </article>
                <article>
                  <strong>{totalQuestions}</strong>
                  <span>Scored questions</span>
                </article>
                <article>
                  <strong>1</strong>
                  <span>Admin overview</span>
                </article>
              </div>

              <div className="module-preview-list">
                {lessons.map((lesson) => (
                  <button
                    className="module-preview"
                    key={lesson.id}
                    onClick={() => openLesson(lesson.id)}
                    type="button"
                  >
                    <span>{String(lesson.id).padStart(2, "0")}</span>
                    <div>
                      <strong>{lesson.title}</strong>
                      <p>{lesson.intro}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeLesson ? (
          <div className="lesson-screen">
            <aside className="lesson-rail">
              {lessons.map((lesson) => (
                <button
                  className={`rail-chip ${
                    lesson.id === activeLesson.id ? "rail-chip-active" : ""
                  }`}
                  key={lesson.id}
                  onClick={() => openLesson(lesson.id)}
                  type="button"
                >
                  {String(lesson.id).padStart(2, "0")}
                </button>
              ))}
            </aside>

            <div className="lesson-main">
              <p className="eyebrow">{activeLesson.kicker}</p>
              <h2>{activeLesson.title}</h2>
              <p className="lesson-intro">{activeLesson.intro}</p>

              <div className="lesson-stack">
                {activeLesson.sections.map((section, index) => (
                  <div key={`${activeLesson.id}-${index}`}>
                    {renderSection(section)}
                  </div>
                ))}
              </div>

              <div className="lesson-nav">
                <button
                  className="ghost-button"
                  onClick={() =>
                    activeLesson.id === 1
                      ? setView("welcome")
                      : openLesson(activeLesson.id - 1)
                  }
                >
                  {activeLesson.id === 1 ? "Back to overview" : "Previous module"}
                </button>

                <button
                  className="primary-button"
                  onClick={() =>
                    activeLesson.id === lessons.length
                      ? setView("assessment")
                      : openLesson(activeLesson.id + 1)
                  }
                >
                  {activeLesson.id === lessons.length
                    ? "Continue to assessment"
                    : "Next module"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {view === "assessment" ? (
          <div className="assessment-shell">
            <div className="assessment-intro">
              <p className="eyebrow">Assessment</p>
              <h2>Score the training and send the result automatically.</h2>
              <p>
                Learners enter their details once, complete the quiz, and then
                receive their score by email while the admin inbox gets a simple
                completion notification.
              </p>
            </div>

            {!quizStarted ? (
              <form className="participant-card" onSubmit={beginAssessment}>
                <div className="form-grid">
                  <label>
                    Full name
                    <input
                      onChange={(event) =>
                        handleParticipantChange("fullName", event.target.value)
                      }
                      required
                      type="text"
                      value={participant.fullName}
                    />
                  </label>
                  <label>
                    Email address
                    <input
                      onChange={(event) =>
                        handleParticipantChange("email", event.target.value)
                      }
                      required
                      type="email"
                      value={participant.email}
                    />
                  </label>
                </div>

                <div className="participant-footer">
                  <p>
                    The result will be stored in the database and used for the
                    learner score email plus the admin notification.
                  </p>
                  <button className="primary-button" type="submit">
                    Start quiz
                  </button>
                </div>
                {!totalQuestions ? (
                  <p className="error-text">
                    No quiz questions are available yet. Add them from the admin
                    dashboard.
                  </p>
                ) : null}
              </form>
            ) : currentQuestion ? (
              <div className="quiz-shell">
                <div className="quiz-topbar">
                  <div>
                    <p className="section-mini">
                      Question {quizIndex + 1} of {totalQuestions}
                    </p>
                    <h3>{currentQuestion.question}</h3>
                  </div>
                  <div className="score-badge">Score {liveScore}/{totalQuestions}</div>
                </div>

                <div className="progress-rail progress-rail-large">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${((quizIndex + 1) / totalQuestions) * 100}%`
                    }}
                  />
                </div>

                <div className="answers-grid">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const isSelected = selectedIndex === optionIndex;
                    const isCorrect = currentQuestion.answer === optionIndex;
                    const showCorrect = checkedAnswer && isCorrect;
                    const showWrong =
                      checkedAnswer && isSelected && !isCorrect;

                    return (
                      <button
                        className={`answer-card ${
                          isSelected ? "answer-selected" : ""
                        } ${showCorrect ? "answer-correct" : ""} ${
                          showWrong ? "answer-wrong" : ""
                        }`}
                        disabled={checkedAnswer}
                        key={option}
                        onClick={() => setSelectedIndex(optionIndex)}
                        type="button"
                      >
                        <span>{String.fromCharCode(65 + optionIndex)}</span>
                        <p>{option}</p>
                      </button>
                    );
                  })}
                </div>

                <article
                  className={`feedback-panel ${checkedAnswer ? "feedback-show" : ""}`}
                >
                  <p className="section-mini">
                    {selectedIndex === currentQuestion.answer
                      ? "Correct"
                      : "Review"}
                  </p>
                  <p>{currentQuestion.explanation}</p>
                </article>

                {submissionError ? (
                  <p className="error-text">{submissionError}</p>
                ) : null}

                <div className="quiz-actions">
                  {!checkedAnswer ? (
                    <button
                      className="ghost-button"
                      disabled={selectedIndex === null}
                      onClick={checkAnswer}
                      type="button"
                    >
                      Check answer
                    </button>
                  ) : (
                    <button
                      className="primary-button"
                      disabled={isSubmitting}
                      onClick={nextQuestion}
                      type="button"
                    >
                      {isSubmitting
                        ? "Saving result..."
                        : quizIndex === totalQuestions - 1
                          ? "Finish and send result"
                          : "Next question"}
                    </button>
                  )}

                  <button className="text-button" onClick={restartCourse} type="button">
                    Restart course
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {view === "results" && submissionResult ? (
          <div className="results-shell">
            <p className="eyebrow">Assessment complete</p>
            <div className="result-orb">
              <strong>{submissionResult.score}</strong>
              <span>/ {submissionResult.totalQuestions}</span>
            </div>
            <h2>{resultSummary.title}</h2>
            <p className="results-copy">{resultSummary.message}</p>

            <div className="results-grid">
              <article>
                <span>Percentage</span>
                <strong>{submissionResult.percentage}%</strong>
              </article>
              <article>
                <span>Learner email</span>
                <strong>{participant.email}</strong>
              </article>
              <article>
                <span>Admin notified</span>
                <strong>Configured inbox</strong>
              </article>
            </div>

            <div className="hero-actions">
              <button className="primary-button" onClick={retakeAssessment}>
                Retake assessment
              </button>
              <button className="ghost-button" onClick={restartCourse}>
                Restart training
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
