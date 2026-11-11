import type { Metadata } from "next";
import { fmt, getI18n } from "@/i18n";
import { pageMeta } from "@/lib/meta";
import { contacts } from "@/lib/site";
import { PageHead } from "@/components/page-head";

// The same periods as the clean-up job in the Student Diary (src/lib/retention.ts there).
const RETENTION_DAYS = { rejected: 90, open: 180, approved: 365 };

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return pageMeta(locale, "/privacy", t.privacy.title, t.privacy.intro);
}

export default async function PrivacyPage() {
  const { t } = await getI18n();
  const p = t.privacy;
  const contact = process.env.PRIVACY_CONTACT_EMAIL || contacts().email;
  const sections = [
    [p.whatTitle, p.whatBody],
    [p.whyTitle, p.whyBody],
    [p.whoTitle, p.whoBody],
    [p.whereTitle, p.whereBody],
    [p.keepTitle, fmt(p.keepBody, RETENTION_DAYS)],
    [p.cookiesTitle, p.cookiesBody],
    [p.rightsTitle, p.rightsBody],
    [p.contactTitle, fmt(p.contactBody, { contact })],
  ];
  return (
    <>
      <PageHead title={p.title} lead={p.intro} />
      <div className="max-w-[68ch] space-y-6">
        {sections.map(([title, body]) => (
          <section key={title}>
            <h2 className="!text-base">{title}</h2>
            <p className="mt-1 leading-relaxed">{body}</p>
          </section>
        ))}
      </div>
    </>
  );
}
