import "server-only";
import { db } from "./db";
import { sendEmail, emailLayout } from "./email";
import { fmt, getDictionary } from "@/i18n";
import { defaultLocale, localePath, type Locale } from "@/i18n/config";
import { SCHOOL_NAME, siteUrl } from "./site";

// After an application is saved: a confirmation to the applicant in their language, and a
// notice to the school office. The notice carries the name and the group only; the contact
// details stay in the Admin Panel.
export async function sendApplicationEmails(application: { name: string; email: string; groupId: string; locale: Locale }) {
  const group = await db.group.findUnique({
    where: { id: application.groupId },
    select: { name: true, course: { select: { title: true } } },
  });
  if (!group) return;
  const groupName = `${group.course.title}, ${group.name}`;
  const groupUrl = `${siteUrl()}${localePath(application.locale, `/groups/${application.groupId}`)}`;

  const t = getDictionary(application.locale).email;
  await sendEmail({
    to: application.email,
    subject: fmt(t.subject, { school: SCHOOL_NAME }),
    ...emailLayout({
      lang: application.locale,
      greeting: fmt(t.greeting, { name: application.name }),
      title: t.title,
      body: fmt(t.body, { group: groupName }),
      buttonLabel: t.button,
      buttonUrl: groupUrl,
      footer: fmt(t.footer, { school: SCHOOL_NAME }),
    }),
  });

  const office = process.env.ADMIN_NOTIFY_EMAIL;
  if (!office) return;
  const a = getDictionary(defaultLocale).email;
  await sendEmail({
    to: office,
    subject: fmt(a.adminSubject, { group: groupName }),
    ...emailLayout({
      lang: defaultLocale,
      greeting: a.adminGreeting,
      title: fmt(a.adminTitle, { name: application.name, group: groupName }),
      body: a.adminBody,
      buttonLabel: a.adminButton,
      buttonUrl: siteUrl(),
      footer: a.adminFooter,
    }),
  });
}
