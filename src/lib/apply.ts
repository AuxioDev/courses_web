import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { hasLocale, type Locale } from "@/i18n/config";
import { getSeatsLeft } from "./public-data";
import { verifyTurnstile } from "./turnstile";

// The only place the public website writes to the database: one row in `applications`.

export const APPLY_FIELDS = ["name", "email", "phone", "guardianName", "guardianPhone", "note", "privacy", "group"] as const;
export type ApplyField = (typeof APPLY_FIELDS)[number];
// Keys into the dictionary's apply.errors, so the form shows them in the visitor's language.
export type ApplyError = ApplyField | "groupClosed" | "groupFull" | "tooMany" | "captcha";

export type ApplyResult =
  | { ok: true; created: { id: string; name: string; email: string; groupId: string; locale: Locale } | null }
  | { ok: false; fieldErrors: Partial<Record<ApplyField, true>>; formError?: Exclude<ApplyError, ApplyField> };

const HOUR_MS = 60 * 60 * 1000;
const MAX_PER_IP_PER_HOUR = 5;
const MAX_PER_EMAIL_PER_DAY = 5;
// A person needs longer than this to fill the form in; a script usually doesn't wait.
const MIN_FILL_MS = 3000;

// Spaces, dashes and brackets are how people write numbers; the office needs digits.
const phone = z
  .string()
  .transform((v) => v.replace(/[\s\-().]/g, ""))
  .pipe(z.string().regex(/^\+?\d{7,15}$/));

const schema = z
  .object({
    group: z.string().min(1).max(60),
    name: z.string().trim().min(2).max(100),
    // The same rule as the apps' login, so an approved address can always sign in.
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
    phone,
    isMinor: z.boolean(),
    guardianName: z.string().trim().max(100),
    guardianPhone: z.string().trim().max(40),
    note: z.string().trim().max(1000),
    privacy: z.literal(true),
  })
  .superRefine((value, ctx) => {
    if (!value.isMinor) return;
    if (value.guardianName.length < 2) ctx.addIssue({ code: "custom", path: ["guardianName"], message: "required" });
    if (!phone.safeParse(value.guardianPhone).success) ctx.addIssue({ code: "custom", path: ["guardianPhone"], message: "required" });
  });

// Only ever stored and compared as a hash: the address itself is never kept.
export function hashIp(ip: string) {
  const salt = process.env.APPLY_SALT;
  if (!salt && process.env.VERCEL) throw new Error("APPLY_SALT is not set.");
  return createHash("sha256").update(`${salt ?? "development-salt"}:${ip}`).digest("hex");
}

export function readApplyForm(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");
  return {
    group: text("group"),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    isMinor: formData.get("isMinor") === "on",
    guardianName: text("guardianName"),
    guardianPhone: text("guardianPhone"),
    note: text("note"),
    privacy: formData.get("privacy") === "on",
    // Hidden from people; anything typed here came from a script.
    honeypot: text("website"),
    elapsedMs: Number(formData.get("elapsed") ?? Number.NaN),
    // Put in the form by the Turnstile widget (see src/lib/turnstile.ts).
    turnstile: text("cf-turnstile-response"),
    locale: text("locale"),
  };
}

export type ApplyInput = ReturnType<typeof readApplyForm>;

export async function submitApplication(input: ApplyInput, ip: string, now = new Date()): Promise<ApplyResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ApplyField, true>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((APPLY_FIELDS as readonly unknown[]).includes(field)) fieldErrors[field as ApplyField] = true;
    }
    return { ok: false, fieldErrors };
  }
  const data = parsed.data;

  // A script gets the same "sent" page as a person, and nothing is saved.
  if (input.honeypot !== "" || !(input.elapsedMs >= MIN_FILL_MS)) return { ok: true, created: null };

  // After the field checks, so a typo does not spend the one-time token; before anything is counted or saved.
  if (!(await verifyTurnstile(input.turnstile, ip))) return { ok: false, fieldErrors: {}, formError: "captcha" };

  const ipHash = hashIp(ip);
  const [fromIp, fromEmail] = await Promise.all([
    db.application.count({ where: { ipHash, createdAt: { gte: new Date(now.getTime() - HOUR_MS) } } }),
    db.application.count({ where: { email: data.email, createdAt: { gte: new Date(now.getTime() - 24 * HOUR_MS) } } }),
  ]);
  if (fromIp >= MAX_PER_IP_PER_HOUR || fromEmail >= MAX_PER_EMAIL_PER_DAY) {
    return { ok: false, fieldErrors: {}, formError: "tooMany" };
  }

  // The page may have been open for an hour: check the group again, uncached.
  const seatsLeft = await getSeatsLeft(data.group);
  if (seatsLeft === undefined) return { ok: false, fieldErrors: {}, formError: "groupClosed" };
  if (seatsLeft === 0) return { ok: false, fieldErrors: {}, formError: "groupFull" };

  // Applying twice changes nothing and is answered the same way, as is applying with an address
  // that already has an account: the form never says who has applied or who is a student.
  const waiting = await db.application.findFirst({
    where: { email: data.email, groupId: data.group, status: { in: ["new", "contacted"] } },
    select: { id: true },
  });
  if (waiting) return { ok: true, created: null };

  const locale = hasLocale(input.locale) ? input.locale : "az";
  const created = await db.application.create({
    data: {
      groupId: data.group,
      name: data.name,
      email: data.email,
      phone: data.phone,
      isMinor: data.isMinor,
      guardianName: data.isMinor ? data.guardianName : null,
      guardianPhone: data.isMinor ? phone.parse(data.guardianPhone) : null,
      note: data.note || null,
      locale,
      ipHash,
      privacyAcceptedAt: now,
    },
    select: { id: true, name: true, email: true, groupId: true },
  });
  return { ok: true, created: { ...created, locale } };
}
