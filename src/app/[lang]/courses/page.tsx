import type { Metadata } from "next";
import { getI18n } from "@/i18n";
import { getCourses } from "@/lib/public-data";
import { pageMeta } from "@/lib/meta";
import { Empty } from "@/components/ui";
import { CourseIndex } from "@/components/course-index";
import { PageHead } from "@/components/page-head";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return pageMeta(locale, "/courses", t.courses.title, t.courses.lead);
}

export default async function CoursesPage() {
  const [{ locale, t }, courses] = await Promise.all([getI18n(), getCourses()]);
  return (
    <>
      <PageHead title={t.courses.title} lead={t.courses.lead} />
      {courses.length === 0 ? (
        <Empty>{t.courses.none}</Empty>
      ) : (
        <CourseIndex items={courses.map((c) => ({ id: c.id, title: c.title, level: c.level, description: c.description, count: c.groups.length }))} locale={locale} t={t} level="h2" />
      )}
    </>
  );
}
