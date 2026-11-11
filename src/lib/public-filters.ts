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
