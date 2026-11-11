// The website's only write, against a real database.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

import { db } from "@/lib/db";
import { resetDatabase } from "../../../test/db";
import { hashIp, readApplyForm, submitApplication } from "../apply";

const IP = "203.0.113.7";

async function world(capacity: number | null = 2) {
  const teacher = await db.user.create({ data: { name: "T", email: "t@t.local", passwordHash: "x", role: "teacher" } });
  const term = await db.term.create({ data: { name: "T", startDate: new Date(Date.now() - 864e5), endDate: new Date(Date.now() + 60 * 864e5) } });
  const course = await db.course.create({ data: { title: "Math", showOnWebsite: true } });
  const group = await db.group.create({
    data: { name: "M-1", courseId: course.id, teacherId: teacher.id, termId: term.id, capacity, enrollmentOpen: true },
  });
  return { teacher, group };
}

const fields = (groupId: string, extra: Record<string, string> = {}) => {
  const f = new FormData();
  const all = { group: groupId, name: "Aysel Mammadova", email: " Aysel@Example.org ", phone: "+994 (50) 123-45-67", privacy: "on", elapsed: "9000", locale: "ru", ...extra };
  for (const [k, v] of Object.entries(all)) if (v !== "") f.set(k, v);
  return readApplyForm(f);
};
const send = (groupId: string, extra: Record<string, string> = {}, ip = IP) => submitApplication(fields(groupId, extra), ip);

beforeEach(resetDatabase);
afterAll(() => db.$disconnect());

describe("applying for a place", () => {
  it("saves a tidy application, with a hash instead of the address", async () => {
    const { group } = await world();
    const result = await send(group.id, { note: "  Evenings are best.  " });
    expect(result).toMatchObject({ ok: true, created: { name: "Aysel Mammadova", email: "aysel@example.org", locale: "ru" } });
    const row = await db.application.findFirstOrThrow();
    expect(row).toMatchObject({
      groupId: group.id,
      email: "aysel@example.org",
      phone: "+994501234567",
      note: "Evenings are best.",
      status: "new",
      isMinor: false,
      guardianName: null,
      locale: "ru",
      ipHash: hashIp(IP),
    });
    expect(JSON.stringify(row)).not.toContain(IP);
    expect(row.privacyAcceptedAt).toBeInstanceOf(Date);
  });

  it("says which fields are wrong and saves nothing", async () => {
    const { group } = await world();
    const result = await send(group.id, { name: "A", email: "nope", phone: "12", privacy: "", note: "x".repeat(1001) });
    expect(result).toEqual({ ok: false, fieldErrors: { name: true, email: true, phone: true, privacy: true, note: true } });
    expect(await send("", {})).toMatchObject({ ok: false, fieldErrors: { group: true } });
    expect(await db.application.count()).toBe(0);
  });

  it("asks for a parent's name and phone only when the student is under 18", async () => {
    const { group } = await world();
    expect(await send(group.id, { isMinor: "on" })).toEqual({ ok: false, fieldErrors: { guardianName: true, guardianPhone: true } });
    expect(await send(group.id, { isMinor: "on", guardianName: "Rena Mammadova", guardianPhone: "050 765 43 21" })).toMatchObject({ ok: true });
    expect(await db.application.findFirstOrThrow()).toMatchObject({ isMinor: true, guardianName: "Rena Mammadova", guardianPhone: "0507654321" });
    // An adult's application keeps no guardian, whatever was typed before the box was unticked.
    await send(group.id, { email: "adult@example.org", guardianName: "Someone" });
    expect(await db.application.findFirstOrThrow({ where: { email: "adult@example.org" } })).toMatchObject({ guardianName: null });
  });

  it("answers a script like a person and saves nothing", async () => {
    const { group } = await world();
    expect(await send(group.id, { website: "http://spam.example" })).toEqual({ ok: true, created: null });
    expect(await send(group.id, { elapsed: "400" })).toEqual({ ok: true, created: null });
    expect(await send(group.id, { elapsed: "" })).toEqual({ ok: true, created: null });
    expect(await db.application.count()).toBe(0);
  });

  it("answers the same way for a repeat and for an address that already has an account", async () => {
    const { group, teacher } = await world();
    const first = await send(group.id);
    const again = await send(group.id);
    expect(first.ok && again.ok).toBe(true);
    expect(again).toEqual({ ok: true, created: null });
    expect(await db.application.count()).toBe(1);

    const known = await send(group.id, { email: teacher.email });
    const unknown = await send(group.id, { email: "new@example.org" });
    expect({ ...known, created: null }).toEqual({ ...unknown, created: null });

    // Once the school has decided, the person may apply again.
    await db.application.updateMany({ where: { email: "aysel@example.org" }, data: { status: "rejected" } });
    expect(await send(group.id)).toMatchObject({ ok: true, created: { email: "aysel@example.org" } });
  });

  it("refuses a group that is full, closed or unknown", async () => {
    const { group } = await world(1);
    const student = await db.user.create({ data: { name: "S", email: "s@t.local", passwordHash: "x", role: "student" } });
    await db.enrollment.create({ data: { groupId: group.id, studentId: student.id } });
    expect(await send(group.id)).toEqual({ ok: false, fieldErrors: {}, formError: "groupFull" });
    await db.group.update({ where: { id: group.id }, data: { capacity: 5, enrollmentOpen: false } });
    expect(await send(group.id)).toEqual({ ok: false, fieldErrors: {}, formError: "groupClosed" });
    expect(await send("no-such-group")).toEqual({ ok: false, fieldErrors: {}, formError: "groupClosed" });
    expect(await db.application.count()).toBe(0);
  });

  it("stops a flood from one address or to one email, and lets other people through", async () => {
    const { group } = await world(null);
    for (let i = 0; i < 5; i++) expect(await send(group.id, { email: `p${i}@example.org` })).toMatchObject({ ok: true });
    expect(await send(group.id, { email: "p6@example.org" })).toEqual({ ok: false, fieldErrors: {}, formError: "tooMany" });
    expect(await send(group.id, { email: "p6@example.org" }, "198.51.100.9")).toMatchObject({ ok: true });

    await db.application.updateMany({ where: { email: "p0@example.org" }, data: { status: "rejected" } });
    for (let i = 0; i < 4; i++) await db.application.create({ data: { groupId: group.id, name: "X", email: "p0@example.org", phone: "1", locale: "az", ipHash: `h${i}`, privacyAcceptedAt: new Date(), status: "rejected" } });
    expect(await send(group.id, { email: "p0@example.org" }, "192.0.2.1")).toEqual({ ok: false, fieldErrors: {}, formError: "tooMany" });
  });
});

describe("bot check (Turnstile)", () => {
  const cloudflare = (success: boolean) => vi.fn(async () => ({ ok: true, json: async () => ({ success }) }) as Response);

  beforeEach(() => vi.stubEnv("TURNSTILE_SECRET_KEY", "s3cret"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("saves nothing without a token, and tells the visitor to try again", async () => {
    const { group } = await world();
    vi.stubGlobal("fetch", cloudflare(true));
    expect(await send(group.id)).toEqual({ ok: false, fieldErrors: {}, formError: "captcha" });
    expect(await db.application.count()).toBe(0);
  });

  it("saves nothing when Cloudflare rejects the token", async () => {
    const { group } = await world();
    vi.stubGlobal("fetch", cloudflare(false));
    expect(await send(group.id, { "cf-turnstile-response": "forged" })).toMatchObject({ ok: false, formError: "captcha" });
    expect(await db.application.count()).toBe(0);
  });

  it("saves the application when Cloudflare approves the token", async () => {
    const { group } = await world();
    const fetchMock = cloudflare(true);
    vi.stubGlobal("fetch", fetchMock);
    expect(await send(group.id, { "cf-turnstile-response": "good" })).toMatchObject({ ok: true, created: { email: "aysel@example.org" } });
    expect(await db.application.count()).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not spend the one-time token on a form with mistakes, or on a script's honeypot", async () => {
    const { group } = await world();
    const fetchMock = cloudflare(true);
    vi.stubGlobal("fetch", fetchMock);
    await send(group.id, { name: "A", "cf-turnstile-response": "good" });
    expect(await send(group.id, { website: "http://spam", "cf-turnstile-response": "good" })).toMatchObject({ ok: true, created: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is skipped entirely when no secret is configured", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const { group } = await world();
    const fetchMock = cloudflare(false);
    vi.stubGlobal("fetch", fetchMock);
    expect(await send(group.id)).toMatchObject({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
