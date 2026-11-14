import Link from "next/link";
import { plural, type Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { hueOf } from "@/lib/schedule";

export type CourseRow = { id: string; title: string; level?: string | null; description?: string | null; count: number };

// The courses as a ruled index: the name, how many groups are open, and a line about it. The whole row is the link.
// `level` is the heading level of each course name: h3 under a section heading (home), h2 under the page title.
export function CourseIndex({ items, locale, t, level: Heading = "h3" }: { items: CourseRow[]; locale: Locale; t: Dictionary; level?: "h2" | "h3" }) {
  return (
    <ul className="rows index">
      {items.map((course) => (
        <li key={course.id} data-hue={hueOf(course.id)} className="reveal">
          <Link href={localePath(locale, `/courses/${course.id}`)}>
            <Heading className="index-title">
              <span className="link">{course.title}</span>
            </Heading>
            <span className="index-count">{course.count > 0 ? plural(locale, t.courses.openGroups, course.count) : t.teachers.noGroups}</span>
            {course.level && <span className="index-meta">{course.level}</span>}
            {course.description && <span className="index-meta line-clamp-2">{course.description}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
