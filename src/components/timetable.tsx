import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import type { PublicGroup } from "@/lib/public-data";
import { buildWeek, hueOf } from "@/lib/schedule";
import { weekdayName } from "@/lib/school-time";

// The school's week. On a wide screen it is a real timetable with hours down the side; on a
// phone the same lessons are listed day by day. Every lesson opens its group.
export function Timetable({ groups, locale }: { groups: PublicGroup[]; locale: Locale }) {
  const week = buildWeek(groups);
  const hours = Array.from({ length: week.lastHour - week.firstHour }, (_, i) => week.firstHour + i);
  const top = (minutes: number) => `calc(var(--hour) * ${(minutes - week.firstHour * 60) / 60})`;

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
        <div className="grid border-b border-line" style={{ gridTemplateColumns: `3.5rem repeat(${week.days.length}, minmax(0, 1fr))` }}>
          <span />
          {week.days.map(({ weekday }) => (
            <p key={weekday} className="border-l border-line px-2 py-2 text-sm font-semibold">
              {weekdayName(weekday, locale)}
            </p>
          ))}
        </div>
        <div className="sheet grid" style={{ gridTemplateColumns: `3.5rem repeat(${week.days.length}, minmax(0, 1fr))`, height: `calc(var(--hour) * ${hours.length})` }}>
          <div className="relative" aria-hidden>
            {hours.map((hour, i) => (
              <span key={hour} className="num absolute right-2 text-xs text-muted" style={{ top: `calc(var(--hour) * ${i} + 0.25rem)` }}>
                {String(hour).padStart(2, "0")}:00
              </span>
            ))}
          </div>
          {week.days.map(({ weekday, slots }) => (
            <ul key={weekday} aria-label={weekdayName(weekday, locale)} className="relative border-l border-line">
              {slots.map((slot) => (
                <li
                  key={`${slot.group.id}-${slot.startTime}`}
                  className="absolute p-0.5"
                  style={{
                    top: top(slot.start),
                    height: `calc(var(--hour) * ${(slot.end - slot.start) / 60})`,
                    left: `${(slot.lane / slot.lanes) * 100}%`,
                    width: `${100 / slot.lanes}%`,
                  }}
                >
                  <Link
                    href={localePath(locale, `/groups/${slot.group.id}`)}
                    data-hue={hueOf(slot.group.course.id)}
                    className={`slot flex h-full flex-col overflow-hidden rounded-lg py-1 text-xs leading-tight ${slot.lanes > 1 ? "px-1.5" : "px-2"}`}
                  >
                    <span className={`num whitespace-nowrap text-muted ${slot.lanes > 1 ? "text-[0.6875rem]" : ""}`}>
                      {slot.startTime}–{slot.endTime}
                    </span>
                    <span className={`mt-0.5 font-semibold [overflow-wrap:anywhere] ${slot.lanes > 1 ? "text-[0.71875rem]" : "text-[0.8125rem]"}`}>
                      {slot.group.course.title}
                    </span>
                    <span className="truncate text-muted">
                      {slot.group.name}
                      {/* Side by side with another lesson there is no room for the name. */}
                      {slot.group.teacher && slot.lanes === 1 ? `, ${slot.group.teacher.name}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {week.days
          .filter((day) => day.slots.length > 0)
          .map(({ weekday, slots }) => (
            <section key={weekday}>
              <h3 className="mb-1.5 text-sm font-semibold text-muted">{weekdayName(weekday, locale)}</h3>
              <ul className="space-y-1.5">
                {slots.map((slot) => (
                  <li key={`${slot.group.id}-${slot.startTime}`}>
                    <Link
                      href={localePath(locale, `/groups/${slot.group.id}`)}
                      data-hue={hueOf(slot.group.course.id)}
                      className="slot flex items-baseline gap-3 rounded-lg px-3 py-2.5"
                    >
                      <span className="num w-24 shrink-0 text-sm text-muted">
                        {slot.startTime}–{slot.endTime}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">{slot.group.course.title}</span>
                        <span className="block truncate text-sm text-muted">
                          {slot.group.name}
                          {slot.group.teacher ? `, ${slot.group.teacher.name}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </>
  );
}
