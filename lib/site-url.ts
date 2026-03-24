export function getLiveCourseUrlFromEnv() {
  const rawUrl = process.env.LIVE_COURSE_URL?.trim();

  if (!rawUrl) {
    throw new Error("Missing LIVE_COURSE_URL");
  }

  let liveCourseUrl: URL;

  try {
    liveCourseUrl = new URL(rawUrl);
  } catch {
    throw new Error("LIVE_COURSE_URL must be a valid absolute URL.");
  }

  if (!["http:", "https:"].includes(liveCourseUrl.protocol)) {
    throw new Error("LIVE_COURSE_URL must start with http:// or https://");
  }

  return liveCourseUrl;
}
