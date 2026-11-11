import "server-only";
import { cacheLife } from "next/cache";
import { db } from "./db";
import { dateOfDayKey, dayKey } from "./school-time";
import { schoolTimezone } from "./site";

// EVERYTHING the public website reads from the database goes through this file.
//
// Rules, checked by src/lib/__tests__/public-data.test.ts and public-data.int.test.ts:
//  - every query lists its columns with `select`, so a new column is never public by accident;
//  - nothing here selects an email, a password hash, a meeting link, a phone number, a student's
//    name, a mark or attendance;
//  - only rows the admin flagged for the website are returned;
//  - seats are a number, never a list of people.
//
// Results are cached for about a minute. Seats on the group and apply pages use
// getSeatsLeft(), which is never cached.

const NEXT_LESSONS = 4;

const activeEnrolments = { enrollments: { where: { status: "active" as const, student: { active: true } } } };

// A group is public when it is open for applications, its course is shown on the website and
// not archived, and its term is neither locked nor over.
function publicGroupWhere() {
  const today = dateOfDayKey(dayKey(new Date(), schoolTimezone()));
  return {
    enrollmentOpen: true,
    course: { showOnWebsite: true, archived: false },
    term: { locked: false, endDate: { gte: today } },
  };
}

const publicTeacherWhere = { role: "teacher" as const, active: true, showOnWebsite: true };

const groupSelect = {
  id: true,
  name: true,
  capacity: true,
  monthlyPrice: true,
  course: { select: { id: true, title: true, level: true } },
  teacher: { select: { id: true, name: true, showOnWebsite: true, active: true } },
  term: { select: { name: true, startDate: true, endDate: true } },
  scheduleRules: { select: { weekday: true, startTime: true, endTime: true } },
  _count: { select: activeEnrolments },
} as const;

type GroupRow = {
  id: string;
  name: string;
  capacity: number | null;
  monthlyPrice: number | null;
  course: { id: string; title: string; level: string | null };
  teacher: { id: string; name: string; showOnWebsite: boolean; active: boolean };
  term: { name: string; startDate: Date; endDate: Date };
  scheduleRules: { weekday: number; startTime: string; endTime: string }[];
  _count: { enrollments: number };
};

const seats = (capacity: number | null, enrolled: number) => (capacity === null ? null : Math.max(0, capacity - enrolled));

// Monday first, then by start time.
const byWeekOrder = (a: { weekday: number; startTime: string }, b: { weekday: number; startTime: string }) =>
  ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) || a.startTime.localeCompare(b.startTime);

function toPublicGroup(row: GroupRow) {
  return {
    id: row.id,
    name: row.name,
    monthlyPrice: row.monthlyPrice,
    // null = the group has no seat limit.
    seatsLeft: seats(row.capacity, row._count.enrollments),
    course: row.course,
    // A teacher who is not shown on the website is not named on it either.
    teacher: row.teacher.showOnWebsite && row.teacher.active ? { id: row.teacher.id, name: row.teacher.name } : null,
    term: {
      name: row.term.name,
      start: row.term.startDate.toISOString().slice(0, 10),
      end: row.term.endDate.toISOString().slice(0, 10),
    },
    schedule: [...row.scheduleRules].sort(byWeekOrder),
  };
}

export type PublicGroup = ReturnType<typeof toPublicGroup>;

const byCourseThenName = (a: PublicGroup, b: PublicGroup) =>
  a.course.title.localeCompare(b.course.title) || a.name.localeCompare(b.name);

export async function getOpenGroups(): Promise<PublicGroup[]> {
  "use cache";
  cacheLife("minutes");
  const rows = await db.group.findMany({ where: publicGroupWhere(), select: groupSelect });
  return rows.map(toPublicGroup).sort(byCourseThenName);
}

export async function getGroup(id: string) {
  "use cache";
  cacheLife("minutes");
  const row = await db.group.findFirst({ where: { id, ...publicGroupWhere() }, select: groupSelect });
  if (!row) return null;
  // Date and time only: the topic, the materials and the meeting link belong to the class.
  const lessons = await db.lesson.findMany({
    where: { groupId: id, startsAt: { gte: new Date() }, status: { in: ["scheduled", "moved"] } },
    orderBy: { startsAt: "asc" },
    take: NEXT_LESSONS,
    select: { id: true, startsAt: true, endsAt: true },
  });
  return { ...toPublicGroup(row), nextLessons: lessons };
}

// Never cached: the Apply button and the form must not offer a seat that has just gone.
// Returns undefined when the group is not public (any more).
export async function getSeatsLeft(groupId: string): Promise<number | null | undefined> {
  const row = await db.group.findFirst({
    where: { id: groupId, ...publicGroupWhere() },
    select: { capacity: true, _count: { select: activeEnrolments } },
  });
  return row ? seats(row.capacity, row._count.enrollments) : undefined;
}

export async function getCourses() {
  "use cache";
  cacheLife("minutes");
  const [courses, groups] = await Promise.all([
    db.course.findMany({
      where: { showOnWebsite: true, archived: false },
      orderBy: { title: "asc" },
      select: { id: true, title: true, description: true, level: true },
    }),
    db.group.findMany({ where: publicGroupWhere(), select: groupSelect }),
  ]);
  const open = groups.map(toPublicGroup).sort(byCourseThenName);
  return courses.map((course) => ({ ...course, groups: open.filter((g) => g.course.id === course.id) }));
}

export type PublicCourse = Awaited<ReturnType<typeof getCourses>>[number];

export async function getCourse(id: string) {
  "use cache";
  cacheLife("minutes");
  const course = await db.course.findFirst({
    where: { id, showOnWebsite: true, archived: false },
    select: { id: true, title: true, description: true, level: true },
  });
  if (!course) return null;
  const groups = await db.group.findMany({ where: { courseId: id, ...publicGroupWhere() }, select: groupSelect });
  return { ...course, groups: groups.map(toPublicGroup).sort(byCourseThenName) };
}

export async function getTeachers() {
  "use cache";
  cacheLife("minutes");
  const [teachers, groups] = await Promise.all([
    db.user.findMany({ where: publicTeacherWhere, orderBy: { name: "asc" }, select: { id: true, name: true, bio: true } }),
    db.group.findMany({ where: publicGroupWhere(), select: groupSelect }),
  ]);
  const open = groups.map(toPublicGroup).sort(byCourseThenName);
  return teachers.map((teacher) => ({ ...teacher, groups: open.filter((g) => g.teacher?.id === teacher.id) }));
}

export type PublicTeacher = Awaited<ReturnType<typeof getTeachers>>[number];

export async function getTeacher(id: string) {
  "use cache";
  cacheLife("minutes");
  const teacher = await db.user.findFirst({ where: { id, ...publicTeacherWhere }, select: { id: true, name: true, bio: true } });
  if (!teacher) return null;
  const groups = await db.group.findMany({ where: { teacherId: id, ...publicGroupWhere() }, select: groupSelect });
  return { ...teacher, groups: groups.map(toPublicGroup).sort(byCourseThenName) };
}

// For the sitemap: the addresses of everything public.
export async function getPublicIds() {
  "use cache";
  cacheLife("hours");
  const [courses, groups, teachers] = await Promise.all([
    db.course.findMany({ where: { showOnWebsite: true, archived: false }, select: { id: true } }),
    db.group.findMany({ where: publicGroupWhere(), select: { id: true } }),
    db.user.findMany({ where: publicTeacherWhere, select: { id: true } }),
  ]);
  return { courses: courses.map((c) => c.id), groups: groups.map((g) => g.id), teachers: teachers.map((t) => t.id) };
}
