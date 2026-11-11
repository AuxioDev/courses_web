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

export type GroupOption = { id: string; label: string; detail: string; full: boolean };

type Props = { locale: Locale; groups: GroupOption[]; chosen: string | null; labels: Dictionary["apply"] };

export function ApplyForm({ locale, groups, chosen, labels }: Props) {
  const [state, action, pending] = useActionState(apply, undefined);
  const [groupId, setGroupId] = useState(chosen ?? "");
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
  const group = groups.find((g) => g.id === groupId);
  const hasErrors = !!state && (Object.keys(errors).length > 0 || !!state.formError);

  const describe = (field: ApplyField, hint?: boolean) =>
    [errors[field] ? `${field}-error` : null, hint ? `${field}-hint` : null].filter(Boolean).join(" ") || undefined;
  const problem = (field: ApplyField) =>
    errors[field] ? (
      <span id={`${field}-error`} className="mt-1 block text-sm font-medium text-bad">
        {labels.errors[field]}
      </span>
    ) : null;
  const field = (name: ApplyField) => `field ${errors[name] ? "border-bad" : ""}`;

  return (
    // Not <form action>: React resets the form after an action, which would wipe what the
    // person typed whenever a field is rejected.
    <form
      noValidate
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        data.set("elapsed", String(Date.now() - openedAt.current));
        startTransition(() => action(data));
      }}
    >
      <div>
        <label htmlFor="group" className="mb-1 block text-sm font-medium">
          {labels.chosenGroup}
        </label>
        <select
          id="group"
          name="group"
          required
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          aria-invalid={errors.group ? true : undefined}
          aria-describedby={describe("group")}
          className={field("group")}
        >
          <option value="" disabled>
            {labels.chooseGroup}
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id} disabled={g.full}>
              {g.label}
            </option>
          ))}
        </select>
        {group && <p className="num mt-1 text-sm text-muted">{group.detail}</p>}
        {problem("group")}
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          {labels.name}
        </label>
        <input id="name" name="name" required maxLength={100} autoComplete="name" aria-invalid={errors.name ? true : undefined} aria-describedby={describe("name")} className={field("name")} />
        {problem("name")}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            {labels.phone}
          </label>
          <input id="phone" name="phone" type="tel" inputMode="tel" required maxLength={40} autoComplete="tel" aria-invalid={errors.phone ? true : undefined} aria-describedby={describe("phone", true)} className={field("phone")} />
          <span id="phone-hint" className="mt-1 block text-xs text-muted">
            {labels.phoneHint}
          </span>
          {problem("phone")}
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            {labels.email}
          </label>
          <input id="email" name="email" type="email" inputMode="email" required maxLength={254} autoComplete="email" aria-invalid={errors.email ? true : undefined} aria-describedby={describe("email", true)} className={field("email")} />
          <span id="email-hint" className="mt-1 block text-xs text-muted">
            {labels.emailHint}
          </span>
          {problem("email")}
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" name="isMinor" checked={isMinor} onChange={(event) => setIsMinor(event.target.checked)} className="h-5 w-5 shrink-0 accent-[var(--accent)]" />
        {labels.minor}
      </label>
      {isMinor && (
        <div className="grid gap-5 rounded-xl border border-line p-4 sm:grid-cols-2">
          <div>
            <label htmlFor="guardianName" className="mb-1 block text-sm font-medium">
              {labels.guardianName}
            </label>
            <input id="guardianName" name="guardianName" required maxLength={100} aria-invalid={errors.guardianName ? true : undefined} aria-describedby={describe("guardianName")} className={field("guardianName")} />
            {problem("guardianName")}
          </div>
          <div>
            <label htmlFor="guardianPhone" className="mb-1 block text-sm font-medium">
              {labels.guardianPhone}
            </label>
            <input id="guardianPhone" name="guardianPhone" type="tel" inputMode="tel" required maxLength={40} aria-invalid={errors.guardianPhone ? true : undefined} aria-describedby={describe("guardianPhone")} className={field("guardianPhone")} />
            {problem("guardianPhone")}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="note" className="mb-1 block text-sm font-medium">
          {labels.note}
        </label>
        <textarea id="note" name="note" rows={3} maxLength={1000} aria-invalid={errors.note ? true : undefined} aria-describedby={describe("note", true)} className={field("note")} />
        <span id="note-hint" className="mt-1 block text-xs text-muted">
          {labels.noteHint}
        </span>
        {problem("note")}
      </div>

      <div className="hp" aria-hidden>
        <label>
          {labels.honeypot}
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <div className="flex items-start gap-3 text-sm">
          <input id="privacy" type="checkbox" name="privacy" required aria-invalid={errors.privacy ? true : undefined} aria-describedby={describe("privacy")} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]" />
          <label htmlFor="privacy">
            {labels.privacyBefore}{" "}
            <Link href={localePath(locale, "/privacy")} target="_blank" className="font-medium text-accent underline underline-offset-4">
              {labels.privacyLink}
            </Link>{" "}
            {labels.privacyAfter}
          </label>
        </div>
        {problem("privacy")}
      </div>

      {hasErrors && (
        <p ref={summary} tabIndex={-1} role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
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
      <button type="submit" disabled={pending} className="btn w-full px-5 py-3 text-[15px] sm:w-auto">
        {pending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
