"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { localePath, type Locale } from "@/i18n/config";
import { apply } from "@/app/actions";
import type { ApplyField } from "@/lib/apply";

// Cloudflare Turnstile (src/lib/turnstile.ts). Without a site key there is no widget and nothing changes.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

export type SlotOption = { id: string; name: string; hours: string[]; teacher: string | null; price: string; seats: string; starts: string; full: boolean };
export type CourseOption = { id: string; title: string; level: string | null; groups: SlotOption[] };

type Props = { locale: Locale; courses: CourseOption[]; chosen: string | null; trial: boolean; labels: Dictionary["apply"] };

export function ApplyForm({ locale, courses, chosen, trial, labels }: Props) {
  const [state, action, pending] = useActionState(apply, undefined);
  const [courseId, setCourseId] = useState(() => courses.find((c) => c.groups.some((g) => g.id === chosen))?.id ?? (courses.length === 1 ? courses[0].id : ""));
  const course = courses.find((c) => c.id === courseId);
  const [isMinor, setIsMinor] = useState(false);
  // How long the form was open: a person needs more than a few seconds. See src/lib/apply.ts.
  const openedAt = useRef(0);
  const summary = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (!state) return;
    summary.current?.focus();
    // A Turnstile token works once, whatever the answer: a corrected form needs a fresh one.
    window.turnstile?.reset();
  }, [state]);

  const errors = state?.fieldErrors ?? {};
  const hasErrors = !!state && (Object.keys(errors).length > 0 || !!state.formError);

  const describe = (field: ApplyField, hint?: boolean) =>
    [errors[field] ? `${field}-error` : null, hint ? `${field}-hint` : null].filter(Boolean).join(" ") || undefined;
  const problem = (field: ApplyField) =>
    errors[field] ? (
      <span id={`${field}-error`} className="form-error">
        {labels.errors[field]}
      </span>
    ) : null;
  const field = (name: ApplyField) => `field ${errors[name] ? "border-bad" : ""}`;

  return (
    // Not <form action>: React resets the form after an action, which would wipe what the
    // person typed whenever a field is rejected.
    <form
      noValidate
      className="apply-form space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        data.set("elapsed", String(Date.now() - openedAt.current));
        startTransition(() => action(data));
      }}
    >
      <div>
        <label htmlFor="course" className="form-label">
          {labels.course}
        </label>
        <select id="course" required value={courseId} onChange={(event) => setCourseId(event.target.value)} className="field">
          <option value="" disabled>
            {labels.chooseCourse}
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.level ? `${c.title}, ${c.level}` : c.title}
            </option>
          ))}
        </select>
      </div>

      <fieldset aria-describedby={describe("group")}>
        <legend className="form-label">{labels.time}</legend>
        {!course ? (
          <p className="form-hint !mt-0">{labels.chooseCourseFirst}</p>
        ) : course.groups.length === 0 ? (
          <p className="form-hint !mt-0">{labels.noTimes}</p>
        ) : (
          // key: choosing another course starts with nothing chosen.
          <div className="slots" key={course.id}>
            {course.groups.map((g) => (
              <label key={g.id} className={`slot ${g.full ? "slot-full" : ""}`}>
                <input type="radio" name="group" value={g.id} required disabled={g.full} defaultChecked={g.id === chosen} />
                <span className="slot-hours num">{g.hours.length > 0 ? g.hours.join(", ") : g.name}</span>
                <span className="slot-meta">{[g.name, g.teacher].filter(Boolean).join(", ")}</span>
                <span className="slot-meta num">{[g.starts, g.price, g.seats].join(" / ")}</span>
              </label>
            ))}
          </div>
        )}
        {problem("group")}
      </fieldset>

      <div>
        <label htmlFor="name" className="form-label">
          {labels.name}
        </label>
        <input id="name" name="name" required maxLength={100} autoComplete="name" aria-invalid={errors.name ? true : undefined} aria-describedby={describe("name")} className={field("name")} />
        {problem("name")}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="form-label">
            {labels.phone}
          </label>
          <input id="phone" name="phone" type="tel" inputMode="tel" required maxLength={40} autoComplete="tel" aria-invalid={errors.phone ? true : undefined} aria-describedby={describe("phone", true)} className={field("phone")} />
          <span id="phone-hint" className="form-hint">
            {labels.phoneHint}
          </span>
          {problem("phone")}
        </div>
        <div>
          <label htmlFor="email" className="form-label">
            {labels.email}
          </label>
          <input id="email" name="email" type="email" inputMode="email" required maxLength={254} autoComplete="email" aria-invalid={errors.email ? true : undefined} aria-describedby={describe("email", true)} className={field("email")} />
          <span id="email-hint" className="form-hint">
            {labels.emailHint}
          </span>
          {problem("email")}
        </div>
      </div>

      <label className="check-label">
        <input type="checkbox" name="isMinor" checked={isMinor} onChange={(event) => setIsMinor(event.target.checked)} className="h-6 w-6 shrink-0 accent-[var(--accent)]" />
        {labels.minor}
      </label>
      {isMinor && (
        <div className="grid gap-5 rounded-xl border border-line bg-surface-2 p-4 sm:grid-cols-2">
          <div>
            <label htmlFor="guardianName" className="form-label">
              {labels.guardianName}
            </label>
            <input id="guardianName" name="guardianName" required maxLength={100} aria-invalid={errors.guardianName ? true : undefined} aria-describedby={describe("guardianName")} className={field("guardianName")} />
            {problem("guardianName")}
          </div>
          <div>
            <label htmlFor="guardianPhone" className="form-label">
              {labels.guardianPhone}
            </label>
            <input id="guardianPhone" name="guardianPhone" type="tel" inputMode="tel" required maxLength={40} aria-invalid={errors.guardianPhone ? true : undefined} aria-describedby={describe("guardianPhone")} className={field("guardianPhone")} />
            {problem("guardianPhone")}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="note" className="form-label">
          {labels.note}
        </label>
        <textarea id="note" name="note" rows={3} maxLength={1000} aria-invalid={errors.note ? true : undefined} aria-describedby={describe("note", true)} className={field("note")} />
        <span id="note-hint" className="form-hint">
          {labels.noteHint}
        </span>
        {problem("note")}
      </div>

      <div>
        <label className="check-label">
          <input type="checkbox" name="trial" defaultChecked={trial} aria-describedby="trial-hint" className="h-6 w-6 shrink-0 accent-[var(--accent)]" />
          {labels.trial}
        </label>
        <span id="trial-hint" className="form-hint">
          {labels.trialHint}
        </span>
      </div>

      <div className="hp" aria-hidden>
        <label>
          {labels.honeypot}
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <div className="flex items-start gap-3 text-[0.9375rem]">
          <input id="privacy" type="checkbox" name="privacy" required aria-invalid={errors.privacy ? true : undefined} aria-describedby={describe("privacy")} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--accent)]" />
          <label htmlFor="privacy">
            {labels.privacyBefore}{" "}
            <Link href={localePath(locale, "/privacy")} target="_blank" className="link font-semibold">
              {labels.privacyLink}
            </Link>{" "}
            {labels.privacyAfter}
          </label>
        </div>
        {problem("privacy")}
      </div>

      {hasErrors && (
        <p ref={summary} tabIndex={-1} role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
          {state?.formError ? labels.errors[state.formError] : labels.errors.summary}
        </p>
      )}
      {TURNSTILE_SITE_KEY && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          {/* The script finds this element, renders the check into it and adds the token to the form as cf-turnstile-response. */}
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-theme="auto" data-language={locale} />
        </>
      )}
      <button type="submit" disabled={pending} className="btn btn-lg w-full sm:w-auto">
        {pending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
