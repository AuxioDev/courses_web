import Link from "next/link";
import type { Metadata } from "next";
import { getI18n, plural } from "@/i18n";
import { localePath } from "@/i18n/config";
import { getCourses } from "@/lib/public-data";
import { pageMeta } from "@/lib/meta";
import { hueOf } from "@/lib/schedule";
import { Empty } from "@/components/ui";
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
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {courses.map((course) => (
            <li key={course.id} data-hue={hueOf(course.id)} className="pen-edge grid gap-x-8 gap-y-2 px-4 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] md:items-start">
              <div>
                <h2 className="!text-lg">
                  <Link href={localePath(locale, `/courses/${course.id}`)} className="underline-offset-4 hover:underline">
                    {course.title}
                  </Link>
                </h2>
                {course.level && <p className="mt-0.5 text-sm text-muted">{course.level}</p>}
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted">{course.description}</p>
              <p className={`text-sm font-semibold ${course.groups.length > 0 ? "pen" : "text-muted"}`}>
                {course.groups.length > 0 ? plural(locale, t.courses.openGroups, course.groups.length) : t.teachers.noGroups}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
