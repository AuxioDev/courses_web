import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { fmt, getI18n, type Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { getCourse, getGroup, getSeatsLeft } from "@/lib/public-data";
import { pageMeta } from "@/lib/meta";
import { hueOf } from "@/lib/schedule";
import { formatDay, formatLessonDay, formatTime } from "@/lib/school-time";
import { schoolTimezone } from "@/lib/site";
import { GroupList, Seats, WeeklyHours } from "@/components/group-list";
import { BackLink, PageHead } from "@/components/page-head";

type Props = PageProps<"/[lang]/groups/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ locale }, { id }] = await Promise.all([getI18n(), params]);
  const group = await getGroup(id);
  return group ? pageMeta(locale, `/groups/${id}`, `${group.course.title}, ${group.name}`) : {};
}

// The address decides the content, so the page waits for it on the server.
export const instant = false;

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

type Text = { locale: Locale; t: Dictionary["group"] };

function SeatsAndApply({ groupId, seatsLeft, locale, t }: Text & { groupId: string; seatsLeft: number | null }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {seatsLeft === 0 ? (
        <p className="text-sm text-muted">{t.fullBody}</p>
      ) : (
        <Link href={localePath(locale, `/apply?group=${groupId}`)} className="btn px-5 py-3 text-[0.9375rem]">
          {t.apply}
        </Link>
      )}
      <Seats seatsLeft={seatsLeft} locale={locale} t={t} />
    </div>
  );
}

// Counted at the moment of the request: the page around it may be a minute old.
async function FreshSeats({ groupId, ...text }: Text & { groupId: string }) {
  await connection();
  const seatsLeft = await getSeatsLeft(groupId);
  // Closed a moment ago: the way in is gone, the rest of the page still explains the group.
  if (seatsLeft === undefined) return null;
  return <SeatsAndApply groupId={groupId} seatsLeft={seatsLeft} {...text} />;
}

export default async function GroupPage({ params }: Props) {
  const [{ locale, t }, { id }] = await Promise.all([getI18n(), params]);
  const group = await getGroup(id);
  if (!group) notFound();
  const g = t.group;
  const timeZone = schoolTimezone();
  const others = group.seatsLeft === 0 ? ((await getCourse(group.course.id))?.groups.filter((o) => o.id !== group.id && o.seatsLeft !== 0) ?? []) : [];

  return (
    <div data-hue={hueOf(group.course.id)}>
      <BackLink href={localePath(locale, `/courses/${group.course.id}`)}>{group.course.title}</BackLink>
      <PageHead title={group.course.title} lead={group.name} />
      <div className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <dl className="divide-y divide-line border-y border-line">
            <Fact label={g.scheduleLabel}>
              <WeeklyHours group={group} locale={locale} t={g} />
              <p className="mt-1 text-xs text-muted">{g.timesNote}</p>
            </Fact>
            {group.teacher && (
              <Fact label={g.teacher}>
                <Link href={localePath(locale, `/teachers/${group.teacher.id}`)} className="font-medium text-accent underline-offset-4 hover:underline">
                  {group.teacher.name}
                </Link>
              </Fact>
            )}
            {group.course.level && <Fact label={g.level}>{group.course.level}</Fact>}
            <Fact label={g.termLabel}>
              {fmt(g.term, {
                start: formatDay(group.term.start, locale),
                end: formatDay(group.term.end, locale, { day: "numeric", month: "long", year: "numeric" }),
              })}
            </Fact>
            <Fact label={g.priceLabel}>
              <span className="num font-semibold">{group.monthlyPrice === null ? g.priceOnRequest : fmt(g.price, { n: group.monthlyPrice })}</span>
            </Fact>
          </dl>
          <div className="mt-6">
            <Suspense fallback={<SeatsAndApply groupId={group.id} seatsLeft={group.seatsLeft} locale={locale} t={g} />}>
              <FreshSeats groupId={group.id} locale={locale} t={g} />
            </Suspense>
          </div>
        </div>
        <section aria-labelledby="next" className="pen-edge rounded-2xl border border-line bg-surface p-4">
          <h2 id="next" className="!text-base">
            {g.nextLessons}
          </h2>
          {group.nextLessons.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{g.noLessonsYet}</p>
          ) : (
            <ol className="mt-2 divide-y divide-line">
              {group.nextLessons.map((lesson) => (
                <li key={lesson.id} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                  <span className="first-letter:uppercase">{formatLessonDay(lesson.startsAt, timeZone, locale)}</span>
                  <span className="num font-semibold">
                    {formatTime(lesson.startsAt, timeZone)}–{formatTime(lesson.endsAt, timeZone)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
      {others.length > 0 && (
        <section className="mt-12" aria-labelledby="others">
          <h2 id="others" className="mb-3">
            {g.otherGroups}
          </h2>
          <GroupList groups={others} locale={locale} t={g} showCourse={false} />
        </section>
      )}
    </div>
  );
}
