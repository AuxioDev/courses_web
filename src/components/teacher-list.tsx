import Link from "next/link";
import type { Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { teacherPhoto } from "@/lib/brand";
import type { PublicTeacher } from "@/lib/public-data";

// The first letters of the first two words of a name, for the picture a teacher has not supplied.
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0].toUpperCase())
    .join("");
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
    <ul className="teacher-grid">
      {teachers.map((teacher) => {
        const courses = [...new Set(teacher.groups.map((g) => g.course.title))];
        const photo = teacherPhoto(teacher.id);
        const initials = initialsOf(teacher.name);
        return (
          <li key={teacher.id} className={`person ${photo || initials ? "has-avatar" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photo ? <img src={photo} alt="" width={64} height={64} className="photo" /> : initials && <span className="avatar" aria-hidden>{initials}</span>}
            <div className="min-w-0">
              <Heading>
                <Link href={localePath(locale, `/teachers/${teacher.id}`)} className="link tap">
                  {teacher.name}
                </Link>
              </Heading>
              <p className="text-[0.9375rem] text-muted">{courses.length > 0 ? courses.join(", ") : t.teachers.noGroups}</p>
              {teacher.bio && <p className="mt-1 line-clamp-3 text-[0.9375rem] leading-relaxed">{teacher.bio}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
