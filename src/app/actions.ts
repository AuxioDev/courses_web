"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getRequestLocale } from "@/i18n";
import { localePath } from "@/i18n/config";
import { readApplyForm, submitApplication, type ApplyError, type ApplyField } from "@/lib/apply";
import { sendApplicationEmails } from "@/lib/apply-email";
import { pickClientIp } from "@/lib/client-ip";

export type ApplyState = { fieldErrors: Partial<Record<ApplyField, true>>; formError?: Exclude<ApplyError, ApplyField> } | undefined;

async function clientIp() {
  const h = await headers();
  return pickClientIp((name) => h.get(name), !!process.env.VERCEL);
}

// The site's only write. Whatever happened to the application (saved, a repeat, or a script's
// attempt that was dropped), a success looks the same: the "sent" page.
export async function apply(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const locale = await getRequestLocale();
  const result = await submitApplication({ ...readApplyForm(formData), locale }, await clientIp());
  if (!result.ok) return { fieldErrors: result.fieldErrors, formError: result.formError };

  const { created } = result;
  if (created) {
    after(async () => {
      try {
        await sendApplicationEmails(created);
      } catch (error) {
        // The application is saved; a failed email must not turn into an error page.
        console.error(`[apply] email failed: ${error instanceof Error ? error.name : "unknown"}`);
      }
    });
  }
  redirect(localePath(locale, "/apply/sent"));
}
