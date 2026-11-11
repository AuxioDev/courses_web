import Link from "next/link";
import { fmt, plural, type Dictionary } from "@/i18n";
import { intlLocale, localePath, type Locale } from "@/i18n/config";
import type { PublicGroup } from "@/lib/public-data";
import { hueOf, summarize } from "@/lib/schedule";
import { weekdayName } from "@/lib/school-time";

type Text = Dictionary["group"];

// "Monday and Wednesday" in the page's language.
export function dayList(weekdays: number[], locale: Locale) {
  return new Intl.ListFormat(intlLocale[locale], { type: "conjunction" }).format(weekdays.map((d) => weekdayName(d, locale)));
}

export function WeeklyHours({ group, locale, t }: { group: PublicGroup; locale: Locale; t: Text }) {
  const lines = summarize(group.schedule);
  if (lines.length === 0) return <p className="text-sm text-muted">{t.noSchedule}</p>;
  return (
    <ul className="space-y-0.5 text-sm">
      {lines.map((line) => (
        <li key={`${line.startTime}-${line.endTime}`}>
          {dayList(line.weekdays, locale)}
          <span className="num ml-2 whitespace-nowrap font-semibold">
            {line.startTime}–{line.endTime}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function seatsText(seatsLeft: number | null, locale: Locale, t: Text) {
  if (seatsLeft === null) return t.seatsOpen;
  return seatsLeft === 0 ? t.full : plural(locale, t.seatsLeft, seatsLeft);
}

export function Seats({ seatsLeft, locale, t }: { seatsLeft: number | null; locale: Locale; t: Text }) {
  const text = seatsText(seatsLeft, locale, t);
  if (seatsLeft === null) return <span className="text-sm text-muted">{text}</span>;
  if (seatsLeft === 0) return <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-sm font-semibold text-muted">{text}</span>;
  // The marker is for the last few seats, where it changes what a person does.
  return <span className={`num rounded-md px-1.5 py-0.5 text-sm font-semibold ${seatsLeft <= 3 ? "marked" : "bg-surface-2"}`}>{text}</span>;
}

// One line of the board per group: what, when, who, how much, and the way in.
export function GroupList({ groups, locale, t, showCourse = true }: { groups: PublicGroup[]; locale: Locale; t: Text; showCourse?: boolean }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {groups.map((group) => {
        const href = localePath(locale, `/groups/${group.id}`);
        const title = showCourse ? group.course.title : group.name;
        return (
          <li
            key={group.id}
            data-hue={hueOf(group.course.id)}
            className="pen-edge grid gap-x-6 gap-y-3 px-4 py-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_14rem] lg:items-center"
          >
            <div className="min-w-0">
              <h3 className="display text-base font-semibold leading-snug">
                <Link href={href} className="underline-offset-4 hover:underline">
                  {title}
                </Link>
              </h3>
              <p className="mt-0.5 text-sm text-muted">
                {[showCourse ? group.name : null, group.course.level, group.teacher?.name].filter(Boolean).join(", ")}
              </p>
            </div>
            <WeeklyHours group={group} locale={locale} t={t} />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="num text-sm font-semibold">
                {group.monthlyPrice === null ? t.priceOnRequest : fmt(t.price, { n: group.monthlyPrice })}
              </span>
              <Seats seatsLeft={group.seatsLeft} locale={locale} t={t} />
            </div>
            {group.seatsLeft === 0 ? (
              <Link href={href} className="btn-ghost sm:justify-self-start lg:justify-self-end">
                {t.details}
              </Link>
            ) : (
              <Link
                href={localePath(locale, `/apply?group=${group.id}`)}
                aria-label={fmt(t.applyTo, { group: `${group.course.title}, ${group.name}` })}
                className="btn sm:justify-self-start lg:justify-self-end"
              >
                {t.apply}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
