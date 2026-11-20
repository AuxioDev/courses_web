import Link from "next/link";
import { plural, type Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { hueOf } from "@/lib/schedule";
import { ArrowRight } from "./icons";

export type CourseRow = { id: string; title: string; level?: string | null; description?: string | null; count: number };

// The courses as a grid of cards: the name, the level, a line about it and how many groups are open. The whole card is the link.
// `level` is the heading level of each course name: h3 under a section heading (home), h2 under the page title.
export function CourseIndex({ items, locale, t, level: Heading = "h3" }: { items: CourseRow[]; locale: Locale; t: Dictionary; level?: "h2" | "h3" }) {
  return (
    <ul className="course-grid">
      {items.map((course) => (
        <li key={course.id} data-hue={hueOf(course.id)} className="reveal">
          <Link href={localePath(locale, `/courses/${course.id}`)} className="course-card">
            <Heading className="course-title">{course.title}</Heading>
            {course.level && <span className="chip">{course.level}</span>}
            {course.description && <span className="course-desc line-clamp-3">{course.description}</span>}
            <span className="course-count">
              {course.count > 0 ? plural(locale, t.courses.openGroups, course.count) : t.teachers.noGroups}
              <ArrowRight width={18} height={18} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
