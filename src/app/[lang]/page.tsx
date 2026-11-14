import Link from "next/link";
import type { Metadata } from "next";
import { getI18n, plural, type Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { getOpenGroups, getTeachers, type PublicGroup } from "@/lib/public-data";
import { jsonLd, pageMeta } from "@/lib/meta";
import { hueOf } from "@/lib/schedule";
import { contacts, SCHOOL_NAME, siteUrl } from "@/lib/site";
import { GroupList, Seats, WeeklyHours } from "@/components/group-list";
import { ArrowRight } from "@/components/icons";
import { TeacherList } from "@/components/teacher-list";
import { Timetable } from "@/components/timetable";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return pageMeta(locale, "/");
}

// One entry per course that has an open group, with how many.
function courseTiles(groups: PublicGroup[]) {
  const byCourse = new Map<string, { id: string; title: string; count: number }>();
  for (const g of groups) {
    const entry = byCourse.get(g.course.id) ?? { id: g.course.id, title: g.course.title, count: 0 };
    entry.count += 1;
    byCourse.set(g.course.id, entry);
  }
  return [...byCourse.values()];
}

function HeroPanel({ groups, locale, t }: { groups: PublicGroup[]; locale: Locale; t: Dictionary }) {
  const c = contacts();
  if (groups.length === 0) {
    return (
      <div className="hero-panel">
        <h2>{t.home.noGroupsTitle}</h2>
        <p className="mt-2 text-muted">{t.home.noGroupsBody}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={c.phoneHref} className="btn num">
            {c.phone}
          </a>
          <a href={`mailto:${c.email}`} className="btn-ghost">
            {c.email}
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="hero-panel">
      <h2 className="mb-2">{t.home.groupsTitle}</h2>
      <ul>
        {[...groups].sort((a, b) => Number(a.seatsLeft === 0) - Number(b.seatsLeft === 0)).slice(0, 3).map((g) => (
          <li key={g.id} data-hue={hueOf(g.course.id)} className="pen-edge -ml-px flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-4 pl-4">
            <div className="min-w-0">
              <Link href={localePath(locale, `/groups/${g.id}`)} className="display font-semibold underline-offset-4 hover:underline">
                {g.course.title}
              </Link>
              <p className="mt-0.5 text-sm text-muted">{[g.name, g.teacher?.name].filter(Boolean).join(", ")}</p>
              <div className="mt-2">
                <WeeklyHours group={g} locale={locale} t={t.group} />
              </div>
            </div>
            <Seats seatsLeft={g.seatsLeft} locale={locale} t={t.group} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function HomePage() {
  const [{ locale, t }, groups, teachers] = await Promise.all([getI18n(), getOpenGroups(), getTeachers()]);
  const h = t.home;
  const c = contacts();
  const tiles = courseTiles(groups);
  const lessons = [
    [h.lessons.liveTitle, h.lessons.liveBody],
    [h.lessons.diaryTitle, h.lessons.diaryBody],
    [h.lessons.groupTitle, h.lessons.groupBody],
  ];
  const steps = [
    [h.steps.chooseTitle, h.steps.chooseBody],
    [h.steps.applyTitle, h.steps.applyBody],
    [h.steps.callTitle, h.steps.callBody],
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: SCHOOL_NAME,
            url: `${siteUrl()}${localePath(locale, "/")}`,
            description: t.meta.description,
            ...(c.isPlaceholder ? {} : { telephone: c.phone, email: c.email }),
          }),
        }}
      />

      <section className="hero-band bleed">
        <div className="hero">
          <div>
            <h1 className="hero-title">{h.title}</h1>
            <p className="hero-lead">{h.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {groups.length > 0 ? (
                <>
                  <a href="#groups" className="btn btn-lg">
                    {h.seeGroups}
                  </a>
                  <Link href={localePath(locale, "/apply")} className="btn-ghost btn-lg">
                    {t.nav.apply}
                  </Link>
                </>
              ) : (
                <a href={c.phoneHref} className="btn btn-lg num">
                  {c.phone}
                </a>
              )}
            </div>
          </div>
          <HeroPanel groups={groups} locale={locale} t={t} />
        </div>
      </section>

      {tiles.length > 0 && (
        <>
          {/* The names of the courses, passing by. Decorative: the tiles below say the same in words. */}
          <div className="marquee on-dark bleed" aria-hidden="true">
            <div className="marquee-track">
              {[...tiles, ...tiles].map((tile, i) => (
                <span key={`${tile.id}-${i}`} className="marquee-item" data-dup={i >= tiles.length ? "" : undefined}>
                  {tile.title}
                </span>
              ))}
            </div>
          </div>

          <section className="section on-dark bleed" aria-labelledby="courses">
            <h2 id="courses" className="section-title mb-10 md:mb-14">
              {h.coursesTitle}
            </h2>
            <ul className="tile-grid">
              {tiles.map((tile) => (
                <li key={tile.id} data-hue={hueOf(tile.id)} className="reveal">
                  <Link href={localePath(locale, `/courses/${tile.id}`)} className="tile">
                    <span className="tile-name">{tile.title}</span>
                    <span className="tile-count">
                      {plural(locale, h.groupCount, tile.count)}
                      <ArrowRight className="tile-arrow" width={22} height={22} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {groups.length > 0 && (
        <section id="groups" className="section scroll-mt-20" aria-labelledby="open">
          <h2 id="open" className="section-title mb-8 md:mb-12">
            {h.groupsTitle}
          </h2>
          <GroupList groups={groups} locale={locale} t={t.group} />
          <div className="mt-14 md:mt-20" aria-labelledby="week" role="group">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
              <h2 id="week">{h.timetableTitle}</h2>
              <p className="text-sm text-muted">{h.timetableLead}</p>
            </div>
            <Timetable groups={groups} locale={locale} />
          </div>
        </section>
      )}

      <section className="section bleed bleed-soft" aria-labelledby="join">
        <h2 id="join" className="section-title mb-8 md:mb-12">
          {h.howTitle}
        </h2>
        <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
          {steps.map(([title, body], i) => (
            <li key={title} className="card">
              <span className="step-number num" aria-hidden>
                {i + 1}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="lessons">
        <h2 id="lessons" className="section-title mb-8 md:mb-12">
          {h.lessonsTitle}
        </h2>
        <dl className="grid gap-8 border-t border-line pt-8 md:grid-cols-3 md:gap-10">
          {lessons.map(([title, body]) => (
            <div key={title}>
              <dt className="text-xl font-semibold">{title}</dt>
              <dd className="mt-2 leading-relaxed text-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section-tight on-dark bleed" aria-labelledby="help">
        <div className="help-band">
          <div>
            <h2 id="help" className="section-title">
              {h.helpTitle}
            </h2>
            <p className="mt-4 max-w-[46ch] text-lg text-muted">{h.helpBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={c.phoneHref} className="btn btn-lg num">
              {c.phone}
            </a>
            <a href={`mailto:${c.email}`} className="btn-ghost btn-lg">
              {t.footer.email}
            </a>
          </div>
        </div>
      </section>

      {teachers.length > 0 && (
        <section className="section" aria-labelledby="teachers">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-12">
            <h2 id="teachers" className="section-title">
              {h.teachersTitle}
            </h2>
            <Link href={localePath(locale, "/teachers")} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-accent underline-offset-4 hover:underline sm:min-h-6">
              {h.allTeachers}
              <ArrowRight width={18} height={18} />
            </Link>
          </div>
          <TeacherList teachers={teachers.slice(0, 6)} locale={locale} t={t} />
        </section>
      )}
    </>
  );
}
