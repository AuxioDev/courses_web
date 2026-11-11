// Proves docs/least-privilege-role.sql: the website's real code works as that role, and the role cannot do more.
// Needs two connections to a throwaway database whose name ends in _test, with the migrations applied:
//   OWNER_DATABASE_URL      the owner (seeds the data and applies the grants)
//   TEST_DATABASE_URL       the restricted role courses_web_app (what the website itself would use)
// Skipped otherwise, so the normal suites are unaffected.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

import { db } from "@/lib/db";
import { readApplyForm, submitApplication } from "../apply";
import { getCourses, getGroup, getOpenGroups, getPublicIds, getSeatsLeft, getTeachers } from "../public-data";

const ownerUrl = process.env.OWNER_DATABASE_URL;
const owner = ownerUrl ? new PrismaClient({ adapter: new PrismaPg({ connectionString: ownerUrl }) }) : null;

describe.skipIf(!ownerUrl || !/courses_web_app/.test(process.env.DATABASE_URL ?? ""))("the website as courses_web_app", () => {
  let groupId = "";

  beforeAll(async () => {
    const name = new URL(ownerUrl!).pathname.replace(/^\//, "");
    if (!/_test$/.test(name)) throw new Error(`Refusing to run on "${name}": the name must end in _test.`);
    // Apply the grants exactly as shipped (the role is created by the caller; the script's CREATE ROLE is skipped).
    const sql = readFileSync(fileURLToPath(new URL("../../../docs/least-privilege-role.sql", import.meta.url)), "utf8")
      .split("\n")
      .filter((line) => !line.startsWith("--") && !/^CREATE ROLE/.test(line) && line.trim() !== "")
      .join("\n")
      .replace(/GRANT CONNECT ON DATABASE \w+/, `GRANT CONNECT ON DATABASE ${name}`);
    for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) await owner!.$executeRawUnsafe(statement);

    await owner!.$executeRawUnsafe(
      `TRUNCATE ${(
        await owner!.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
      )
        .map((t) => `"${t.tablename}"`)
        .join(", ")} RESTART IDENTITY CASCADE`,
    );
    const teacher = await owner!.user.create({
      data: { name: "Aysel T", email: "secret.teacher@t.local", passwordHash: "SECRET-HASH", role: "teacher", bio: "Maths", showOnWebsite: true },
    });
    const term = await owner!.term.create({ data: { name: "T", startDate: new Date(Date.now() - 864e5), endDate: new Date(Date.now() + 60 * 864e5) } });
    const course = await owner!.course.create({ data: { title: "Math", showOnWebsite: true } });
    const group = await owner!.group.create({
      data: { name: "M-1", courseId: course.id, teacherId: teacher.id, termId: term.id, capacity: 3, enrollmentOpen: true },
    });
    await owner!.scheduleRule.create({ data: { groupId: group.id, weekday: 2, startTime: "18:00", endTime: "19:30" } });
    await owner!.lesson.create({
      data: { groupId: group.id, teacherId: teacher.id, startsAt: new Date(Date.now() + 864e5), endsAt: new Date(Date.now() + 864e5 + 36e5) },
    });
    const student = await owner!.user.create({ data: { name: "S", email: "s@t.local", passwordHash: "x", role: "student" } });
    await owner!.enrollment.create({ data: { groupId: group.id, studentId: student.id } });
    groupId = group.id;
  });
  afterAll(async () => {
    await db.$disconnect();
    await owner?.$disconnect();
  });

  it("serves every public page's data", async () => {
    const [groups, courses, teachers, ids, detail, seats] = await Promise.all([
      getOpenGroups(),
      getCourses(),
      getTeachers(),
      getPublicIds(),
      getGroup(groupId),
      getSeatsLeft(groupId),
    ]);
    expect(groups).toHaveLength(1);
    expect(courses).toHaveLength(1);
    expect(teachers).toMatchObject([{ name: "Aysel T", bio: "Maths" }]);
    expect(ids.groups).toEqual([groupId]);
    expect(detail?.nextLessons).toHaveLength(1);
    expect(seats).toBe(2);
  });

  it("takes an application, which is the site's only write", async () => {
    const f = new FormData();
    for (const [k, v] of Object.entries({ group: groupId, name: "Nargiz A", email: "n@example.org", phone: "+994501234567", privacy: "on", elapsed: "9000", locale: "en" })) f.set(k, v);
    expect(await submitApplication(readApplyForm(f), "203.0.113.9")).toMatchObject({ ok: true, created: { email: "n@example.org" } });
    expect(await owner!.application.count()).toBe(1);
  });

  it("cannot read emails, password hashes, marks or anything private", async () => {
    await expect(db.user.findMany({ select: { email: true } })).rejects.toThrow(/permission denied/i);
    await expect(db.user.findMany({ select: { passwordHash: true } })).rejects.toThrow(/permission denied/i);
    await expect(db.mark.findMany()).rejects.toThrow(/permission denied/i);
    await expect(db.attendance.findMany()).rejects.toThrow(/permission denied/i);
    await expect(db.submission.findMany()).rejects.toThrow(/permission denied/i);
    await expect(db.finalGrade.findMany()).rejects.toThrow(/permission denied/i);
    await expect(db.loginAttempt.findMany()).rejects.toThrow(/permission denied/i);
  });

  it("cannot change or delete anything", async () => {
    await expect(db.user.create({ data: { name: "x", email: "x@x", passwordHash: "x", role: "admin" } })).rejects.toThrow(/permission denied/i);
    await expect(db.user.updateMany({ data: { active: false } })).rejects.toThrow(/permission denied/i);
    await expect(db.group.updateMany({ data: { name: "pwned" } })).rejects.toThrow(/permission denied/i);
    await expect(db.application.updateMany({ data: { status: "approved" } })).rejects.toThrow(/permission denied/i);
    await expect(db.application.deleteMany()).rejects.toThrow(/permission denied/i);
    await expect(db.course.deleteMany()).rejects.toThrow(/permission denied/i);
  });
});
