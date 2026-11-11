import Link from "next/link";
import type { Metadata } from "next";
import { getI18n } from "@/i18n";
import { localePath } from "@/i18n/config";
import { getOpenGroups, getTeachers } from "@/lib/public-data";
import { jsonLd, pageMeta } from "@/lib/meta";
import { contacts, SCHOOL_NAME, siteUrl } from "@/lib/site";
import { GroupList } from "@/components/group-list";
import { TeacherList } from "@/components/teacher-list";
import { Timetable } from "@/components/timetable";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return pageMeta(locale, "/");
}

export default async function HomePage() {
  const [{ locale, t }, groups, teachers] = await Promise.all([getI18n(), getOpenGroups(), getTeachers()]);
  const h = t.home;
  const c = contacts();
  const lessons = [
    [h.lessons.liveTitle, h.lessons.liveBody],
    [h.lessons.diaryTitle, h.lessons.diaryBody],
    [h.lessons.groupTitle, h.lessons.groupBody],
  ];
  const steps = [
    [h.steps.chooseTitle, h.steps.chooseBody],
    [h.steps.applyTitle, h.steps.applyBody],
    [h.steps.callTitle, h.steps.callBody],
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: SCHOOL_NAME,
            url: `${siteUrl()}${localePath(locale, "/")}`,
            description: t.meta.description,
            ...(c.isPlaceholder ? {} : { telephone: c.phone, email: c.email }),
          }),
        }}
      />
      <section className="max-w-3xl">
        <h1>{h.title}</h1>
        <p className="mt-4 max-w-[62ch] text-[1.0625rem] leading-relaxed text-muted">{h.lead}</p>
      </section>

      {groups.length === 0 ? (
        <section className="mt-8 max-w-2xl rounded-2xl border border-line bg-surface p-5">
          <h2>{h.noGroupsTitle}</h2>
          <p className="mt-2 text-muted">{h.noGroupsBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={c.phoneHref} className="btn num">
              {c.phone}
            </a>
            <a href={`mailto:${c.email}`} className="btn-ghost">
              {c.email}
            </a>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-8" aria-labelledby="week">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
              <h2 id="week">{h.timetableTitle}</h2>
              <p className="text-sm text-muted">{h.timetableLead}</p>
            </div>
            <Timetable groups={groups} locale={locale} />
          </section>
          <section id="groups" className="mt-12 scroll-mt-28" aria-labelledby="open">
            <h2 id="open" className="mb-3">
              {h.groupsTitle}
            </h2>
            <GroupList groups={groups} locale={locale} t={t.group} />
          </section>
        </>
      )}

      <section className="mt-14" aria-labelledby="join">
        <h2 id="join" className="mb-4">
          {h.howTitle}
        </h2>
        <ol className="grid gap-x-8 gap-y-5 md:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="marked display num flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-0.5 text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14" aria-labelledby="lessons">
        <h2 id="lessons" className="mb-4">
          {h.lessonsTitle}
        </h2>
        <dl className="grid gap-x-8 gap-y-5 border-t border-line pt-5 md:grid-cols-3">
          {lessons.map(([title, body]) => (
            <div key={title}>
              <dt className="font-semibold">{title}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {teachers.length > 0 && (
        <section className="mt-14" aria-labelledby="teachers">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="teachers">{h.teachersTitle}</h2>
            <Link href={localePath(locale, "/teachers")} className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline-offset-4 hover:underline sm:min-h-6">
              {h.allTeachers}
            </Link>
          </div>
          <TeacherList teachers={teachers.slice(0, 6)} locale={locale} t={t} />
        </section>
      )}
    </>
  );
}
