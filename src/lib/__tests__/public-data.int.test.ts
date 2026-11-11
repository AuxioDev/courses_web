// The promise of public-data.ts, against real rows: whatever the public functions return, it
// holds no private value and nothing the admin did not put on the website.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

import { db } from "@/lib/db";
import { resetDatabase } from "../../../test/db";
import { getCourse, getCourses, getGroup, getOpenGroups, getPublicIds, getSeatsLeft, getTeacher, getTeachers } from "../public-data";

const DAY = 24 * 60 * 60 * 1000;
const day = (offset: number) => new Date(new Date(Date.now() + offset * DAY).toISOString().slice(0, 10));

// Every private value in the seed carries this word, so one search finds any leak.
const SECRET = "PRIVATE";

async function seed() {
  const user = (name: string, role: "teacher" | "student", extra: Record<string, unknown> = {}) =>
    db.user.create({ data: { name, email: `${SECRET}-${name.replace(/\s/g, "")}@t.local`.toLowerCase(), passwordHash: `${SECRET}-hash`, role, ...extra } });
  const shown = await user("Leyla Aliyeva", "teacher", { showOnWebsite: true, bio: "Teaches algebra." });
  const hidden = await user(`${SECRET} Hidden Teacher`, "teacher", { bio: `${SECRET} bio` });
  const gone = await user(`${SECRET} Former Teacher`, "teacher", { showOnWebsite: true, active: false });
  const students = await Promise.all([1, 2, 3].map((n) => user(`${SECRET} Student ${n}`, "student")));

  const term = await db.term.create({ data: { name: "Autumn", startDate: day(-30), endDate: day(60) } });
  const locked = await db.term.create({ data: { name: "Locked", startDate: day(-30), endDate: day(60), locked: true } });
  const over = await db.term.create({ data: { name: "Over", startDate: day(-200), endDate: day(-1) } });

  const math = await db.course.create({ data: { title: "Math", description: "Algebra and geometry.", level: "Grade 9", showOnWebsite: true } });
  const secret = await db.course.create({ data: { title: `${SECRET} Course`, description: `${SECRET} plan` } });
  const archived = await db.course.create({ data: { title: `${SECRET} Archived`, showOnWebsite: true, archived: true } });

  const group = (name: string, data: Record<string, unknown>) =>
    db.group.create({ data: { name, courseId: math.id, teacherId: shown.id, termId: term.id, enrollmentOpen: true, ...data } as never });
  const open = await group("M-1", { capacity: 5, monthlyPrice: 120 });
  const byHidden = await group("M-2", { teacherId: hidden.id });
  const closed = await group(`${SECRET} closed`, { enrollmentOpen: false });
  const ofSecretCourse = await group(`${SECRET} course hidden`, { courseId: secret.id });
  const ofArchived = await group(`${SECRET} archived`, { courseId: archived.id });
  const inLocked = await group(`${SECRET} locked`, { termId: locked.id });
  const inOver = await group(`${SECRET} over`, { termId: over.id });
  const byGone = await group("M-3", { teacherId: gone.id });

  await db.enrollment.createMany({
    data: [
      { groupId: open.id, studentId: students[0].id },
      { groupId: open.id, studentId: students[1].id },
      // Someone who left does not take a seat.
      { groupId: open.id, studentId: students[2].id, status: "dropped" },
    ],
  });
  await db.scheduleRule.createMany({
    data: [
      { groupId: open.id, weekday: 3, startTime: "18:00", endTime: "19:30" },
      { groupId: open.id, weekday: 1, startTime: "18:00", endTime: "19:30" },
    ],
  });
  const lesson = (offset: number, status: "scheduled" | "cancelled" = "scheduled") => ({
    groupId: open.id,
    teacherId: shown.id,
    startsAt: new Date(Date.now() + offset * DAY),
    endsAt: new Date(Date.now() + offset * DAY + 90 * 60 * 1000),
    topic: `${SECRET} topic`,
    materials: `${SECRET} materials`,
    meetingUrl: `https://meet.example/${SECRET}`,
    status,
  });
  await db.lesson.createMany({ data: [lesson(-2), lesson(1), lesson(2, "cancelled"), lesson(3)] });
  await db.application.create({
    data: { groupId: open.id, name: `${SECRET} Applicant`, email: `${SECRET}@a.local`, phone: `+994${SECRET}`, locale: "az", ipHash: `${SECRET}-ip`, privacyAcceptedAt: new Date() },
  });
  return { shown, hidden, gone, math, secret, open, byHidden, byGone, hiddenGroups: [closed, ofSecretCourse, ofArchived, inLocked, inOver] };
}

beforeEach(resetDatabase);
afterAll(() => db.$disconnect());

describe("public data", () => {
  it("returns nothing private from any function", async () => {
    const w = await seed();
    const everything = await Promise.all([
      getOpenGroups(),
      getCourses(),
      getTeachers(),
      getPublicIds(),
      getGroup(w.open.id),
      getGroup(w.byHidden.id),
      getCourse(w.math.id),
      getTeacher(w.shown.id),
    ]);
    const text = JSON.stringify(everything);
    expect(text).not.toContain(SECRET);
    expect(text.toLowerCase()).not.toContain(SECRET.toLowerCase());
    for (const key of ["email", "passwordHash", "meetingUrl", "topic", "materials", "phone", "capacity", "enrollments"]) {
      expect(text, key).not.toContain(`"${key}"`);
    }
  });

  it("lists only groups that are open, on a shown course, in a term that is neither locked nor over", async () => {
    const w = await seed();
    expect((await getOpenGroups()).map((g) => g.name)).toEqual(["M-1", "M-2", "M-3"]);
    for (const hidden of w.hiddenGroups) {
      expect(await getGroup(hidden.id), hidden.name).toBeNull();
      expect(await getSeatsLeft(hidden.id), hidden.name).toBeUndefined();
    }
    expect(await getCourse(w.secret.id)).toBeNull();
    expect((await getCourses()).map((c) => c.title)).toEqual(["Math"]);
  });

  it("gives the group's hours Monday first, its seats as a number, and only coming lessons", async () => {
    const w = await seed();
    const group = await getGroup(w.open.id);
    expect(group).toMatchObject({ name: "M-1", monthlyPrice: 120, seatsLeft: 3, teacher: { name: "Leyla Aliyeva" }, course: { title: "Math", level: "Grade 9" } });
    expect(group!.schedule.map((r) => r.weekday)).toEqual([1, 3]);
    // The past one and the cancelled one are left out.
    expect(group!.nextLessons).toHaveLength(2);
    expect(Object.keys(group!.nextLessons[0]).sort()).toEqual(["endsAt", "id", "startsAt"]);
    expect(await getSeatsLeft(w.open.id)).toBe(3);
    expect(await getSeatsLeft(w.byHidden.id)).toBeNull();
  });

  it("names a teacher only when the admin put them on the website and they still work here", async () => {
    const w = await seed();
    expect((await getTeachers()).map((t) => t.name)).toEqual(["Leyla Aliyeva"]);
    expect(await getTeacher(w.hidden.id)).toBeNull();
    expect(await getTeacher(w.gone.id)).toBeNull();
    expect((await getGroup(w.byHidden.id))!.teacher).toBeNull();
    expect((await getGroup(w.byGone.id))!.teacher).toBeNull();
    expect((await getTeacher(w.shown.id))!.groups.map((g) => g.name)).toEqual(["M-1"]);
  });
});
