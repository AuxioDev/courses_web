import Link from "next/link";
import type { Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import type { PublicTeacher } from "@/lib/public-data";

// The first letters of the first and last name: there are no photographs yet.
export function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return [words[0], words.length > 1 ? words[words.length - 1] : ""].map((w) => w.charAt(0).toUpperCase()).join("");
}

export function Initials({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`display flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent ${large ? "h-20 w-20 text-2xl" : "h-12 w-12 text-sm"}`}
    >
      {initials(name)}
    </span>
  );
}

// `level` is the heading level of each name: h3 under a section heading (the home page), h2 straight under the page title.
export function TeacherList({
  teachers,
  locale,
  t,
  level: Heading = "h3",
}: {
  teachers: PublicTeacher[];
  locale: Locale;
  t: Dictionary;
  level?: "h2" | "h3";
}) {
  return (
    <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {teachers.map((teacher) => {
        const courses = [...new Set(teacher.groups.map((g) => g.course.title))];
        return (
          <li key={teacher.id} className="flex gap-3">
            <Initials name={teacher.name} />
            <div className="min-w-0">
              <Heading className="font-semibold">
                <Link href={localePath(locale, `/teachers/${teacher.id}`)} className="underline-offset-4 hover:underline">
                  {teacher.name}
                </Link>
              </Heading>
              <p className="text-sm text-muted">{courses.length > 0 ? courses.join(", ") : t.teachers.noGroups}</p>
              {teacher.bio && <p className="mt-1 line-clamp-3 text-sm leading-relaxed">{teacher.bio}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
