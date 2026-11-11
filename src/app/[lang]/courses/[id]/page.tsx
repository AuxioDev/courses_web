import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getI18n } from "@/i18n";
import { localePath } from "@/i18n/config";
import { getCourse } from "@/lib/public-data";
import { jsonLd, pageMeta } from "@/lib/meta";
import { SCHOOL_NAME } from "@/lib/site";
import { Empty } from "@/components/ui";
import { GroupList } from "@/components/group-list";
import { BackLink, PageHead, Prose } from "@/components/page-head";

type Props = PageProps<"/[lang]/courses/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ locale }, { id }] = await Promise.all([getI18n(), params]);
  const course = await getCourse(id);
  return course ? pageMeta(locale, `/courses/${id}`, course.title, course.description) : {};
}

// The address decides the content, so the page waits for it on the server.
export const instant = false;

export default async function CoursePage({ params }: Props) {
  const [{ locale, t }, { id }] = await Promise.all([getI18n(), params]);
  const course = await getCourse(id);
  if (!course) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Course",
            name: course.title,
            description: course.description ?? course.title,
            provider: { "@type": "EducationalOrganization", name: SCHOOL_NAME },
          }),
        }}
      />
      <BackLink href={localePath(locale, "/courses")}>{t.courses.title}</BackLink>
      <PageHead title={course.title} lead={course.level} />
      {course.description && (
        <section className="mb-10" aria-label={t.courses.about}>
          <Prose text={course.description} />
        </section>
      )}
      <section aria-labelledby="groups">
        <h2 id="groups" className="mb-3">
          {t.courses.groupsTitle}
        </h2>
        {course.groups.length === 0 ? (
          <Empty>{t.courses.noOpenGroups}</Empty>
        ) : (
          <GroupList groups={course.groups} locale={locale} t={t.group} showCourse={false} />
        )}
      </section>
    </>
  );
}
