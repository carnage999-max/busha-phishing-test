import { getAssessmentQuizQuestions } from "@/lib/db";
import { CourseExperience } from "@/components/course-experience";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const questions = await getAssessmentQuizQuestions();

  return <CourseExperience questions={questions} />;
}
