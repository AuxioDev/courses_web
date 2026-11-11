import Link from "next/link";
import type { Metadata } from "next";
import { getI18n } from "@/i18n";
import { localePath } from "@/i18n/config";
import { getOpenGroups } from "@/lib/public-data";
import { pageMeta } from "@/lib/meta";
import { hueOf } from "@/lib/schedule";
import { Empty } from "@/components/ui";
import { PageHead } from "@/components/page-head";
import { Timetable } from "@/components/timetable";

type Props = PageProps<"/[lang]/schedule">;

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return pageMeta(locale, "/schedule", t.schedule.title, t.schedule.lead);
}

// The chosen course is in the address, so the page waits for it on the server.
export const instant = false;

export default async function SchedulePage({ searchParams }: Props) {
  const [{ locale, t }, query, groups] = await Promise.all([getI18n(), searchParams, getOpenGroups()]);
  const courses = [...new Map(groups.map((g) => [g.course.id, g.course])).values()];
  const chosen = typeof query.course === "string" && courses.some((c) => c.id === query.course) ? query.course : null;
  const shown = chosen ? groups.filter((g) => g.course.id === chosen) : groups;
  const chip = "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium";

  return (
    <>
      <PageHead title={t.schedule.title} lead={t.schedule.lead} />
      {groups.length === 0 ? (
        <Empty>{t.schedule.none}</Empty>
      ) : (
        <>
          {courses.length > 1 && (
            <nav aria-label={t.schedule.filter} className="mb-4">
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Link
                    href={localePath(locale, "/schedule")}
                    aria-current={chosen ? undefined : "true"}
                    className={`${chip} ${chosen ? "border-line bg-surface text-muted" : "border-ink bg-ink text-bg"}`}
                  >
                    {t.schedule.allCourses}
                  </Link>
                </li>
                {courses.map((course) => (
                  <li key={course.id} data-hue={hueOf(course.id)}>
                    <Link
                      href={localePath(locale, `/schedule?course=${course.id}`)}
                      aria-current={chosen === course.id ? "true" : undefined}
                      className={`${chip} ${chosen === course.id ? "border-ink bg-ink text-bg" : "border-line bg-surface"}`}
                    >
                      <span aria-hidden className="mr-2 h-2.5 w-2.5 rounded-full" style={{ background: "var(--hue)" }} />
                      {course.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <Timetable groups={shown} locale={locale} />
        </>
      )}
    </>
  );
}
