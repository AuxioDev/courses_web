import { dateOfDayKey, dayKey } from "./school-time";
import { schoolTimezone } from "./site";

// WHAT counts as public. One definition, used by the pages (public-data.ts) and by the proxy's existence check
// (public-exists.ts), so a page the proxy lets through can never turn out to be missing, and the reverse.

// A group is public when it is open for applications, its course is shown on the website and
// not archived, and its term is neither locked nor over.
export function publicGroupWhere() {
  const today = dateOfDayKey(dayKey(new Date(), schoolTimezone()));
  return {
    enrollmentOpen: true,
    course: { showOnWebsite: true, archived: false },
    term: { locked: false, endDate: { gte: today } },
  };
}

export const publicTeacherWhere = { role: "teacher" as const, active: true, showOnWebsite: true };

export const publicCourseWhere = { showOnWebsite: true, archived: false };

// A group that has not started yet: no lesson has taken place (or is under way) so far. People may only apply to these,
// because a group that is already running cannot take a new student at the first lesson.
export function notStartedWhere(now = new Date()) {
  return { lessons: { none: { startsAt: { lte: now }, status: { not: "cancelled" as const } } } };
}
