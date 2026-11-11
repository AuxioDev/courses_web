import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "../../../test/db";
import { forgetPublicExists, publicExists } from "../public-exists";

async function world() {
  const teacher = await db.user.create({ data: { name: "T", email: "t@t.local", passwordHash: "x", role: "teacher", showOnWebsite: true } });
  const hiddenTeacher = await db.user.create({ data: { name: "H", email: "h@t.local", passwordHash: "x", role: "teacher" } });
  const term = await db.term.create({ data: { name: "T", startDate: new Date(Date.now() - 864e5), endDate: new Date(Date.now() + 60 * 864e5) } });
  const course = await db.course.create({ data: { title: "Math", showOnWebsite: true } });
  const hiddenCourse = await db.course.create({ data: { title: "Hidden" } });
  const group = await db.group.create({
    data: { name: "M-1", courseId: course.id, teacherId: teacher.id, termId: term.id, enrollmentOpen: true },
  });
  const closedGroup = await db.group.create({ data: { name: "M-2", courseId: course.id, teacherId: teacher.id, termId: term.id } });
  return { teacher, hiddenTeacher, course, hiddenCourse, group, closedGroup, term };
}

beforeEach(async () => {
  await resetDatabase();
  forgetPublicExists();
});
afterAll(() => db.$disconnect());

describe("publicExists (real database)", () => {
  it("says yes only for what the website would show, and no for everything else", async () => {
    const w = await world();
    expect(await publicExists("groups", w.group.id)).toBe(true);
    expect(await publicExists("courses", w.course.id)).toBe(true);
    expect(await publicExists("teachers", w.teacher.id)).toBe(true);

    expect(await publicExists("groups", w.closedGroup.id)).toBe(false); // not open for applications
    expect(await publicExists("courses", w.hiddenCourse.id)).toBe(false); // not shown on the website
    expect(await publicExists("teachers", w.hiddenTeacher.id)).toBe(false); // not shown on the website
    expect(await publicExists("teachers", w.course.id)).toBe(false); // a course id is not a teacher
    expect(await publicExists("groups", "nope")).toBe(false);
  });

  it("follows the same rules as the pages: a locked or finished term hides the group", async () => {
    const w = await world();
    await db.term.update({ where: { id: w.term.id }, data: { locked: true } });
    expect(await publicExists("groups", w.group.id, Date.now() + 60_000)).toBe(false);
  });

  it("does not query for an id that cannot exist", async () => {
    // Anything but letters, digits, dash and underscore never reaches the database.
    for (const id of ["", "a b", "../x", "x'; drop table users;--", "a".repeat(65), "é"]) {
      expect(await publicExists("groups", id)).toBe(false);
    }
  });

  it("remembers a yes for 30 seconds, then asks again", async () => {
    const w = await world();
    const t0 = Date.now();
    expect(await publicExists("groups", w.group.id, t0)).toBe(true);
    await db.group.update({ where: { id: w.group.id }, data: { enrollmentOpen: false } });
    expect(await publicExists("groups", w.group.id, t0 + 29_000)).toBe(true); // still remembered
    expect(await publicExists("groups", w.group.id, t0 + 31_000)).toBe(false); // asked again
  });

  it("never remembers a no: a group published a moment later is reachable at once", async () => {
    const w = await world();
    expect(await publicExists("groups", w.closedGroup.id)).toBe(false);
    await db.group.update({ where: { id: w.closedGroup.id }, data: { enrollmentOpen: true } });
    expect(await publicExists("groups", w.closedGroup.id)).toBe(true);
  });
});
