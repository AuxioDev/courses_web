import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import type { PublicGroup } from "@/lib/public-data";
import { buildWeek, hueOf } from "@/lib/schedule";
import { weekdayName } from "@/lib/school-time";

// The school's week: one column for each day that has lessons, and in it the lessons in time order, each with its
// hours, its course and its group. Lessons at the same hour simply follow one another, so a busy day stays readable
// on any width; on a phone the days stack. Every lesson opens its group.
// `level` is the heading level of each weekday: h3 under a section heading, h2 straight under the page title.
export function Timetable({ groups, locale, level: Heading = "h3" }: { groups: PublicGroup[]; locale: Locale; level?: "h2" | "h3" }) {
  const days = buildWeek(groups).days.filter((day) => day.slots.length > 0);

  return (
    <div className="week">
      {days.map(({ weekday, slots }) => (
        <section key={weekday} className="week-day">
          <Heading>{weekdayName(weekday, locale)}</Heading>
          <ul>
            {slots.map((slot) => (
              <li key={`${slot.group.id}-${slot.startTime}`}>
                <Link href={localePath(locale, `/groups/${slot.group.id}`)} data-hue={hueOf(slot.group.course.id)} className="lesson">
                  <span className="lesson-time num">
                    {slot.startTime}–{slot.endTime}
                  </span>
                  <span className="lesson-course">{slot.group.course.title}</span>
                  <span className="lesson-by">{[slot.group.name, slot.group.teacher?.name].filter(Boolean).join(", ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
