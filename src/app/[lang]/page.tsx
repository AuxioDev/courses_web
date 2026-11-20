import Link from "next/link";
import type { Metadata } from "next";
import { getI18n, type Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { diaryShots } from "@/lib/brand";
import { getOpenGroups, getTeachers, type PublicGroup } from "@/lib/public-data";
import { jsonLd, pageMeta } from "@/lib/meta";
import { hueOf } from "@/lib/schedule";
import { contacts, SCHOOL_NAME, siteUrl } from "@/lib/site";
import { CourseIndex } from "@/components/course-index";
import { Seats, WeeklyHours } from "@/components/group-list";
import { ArrowRight, Notebook, People, Video } from "@/components/icons";
import { Section } from "@/components/section";
import { TeacherList } from "@/components/teacher-list";
import { Timetable } from "@/components/timetable";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return pageMeta(locale, "/");
}

// One entry per course that has an open group, with how many.
function courseRows(groups: PublicGroup[]) {
  const byCourse = new Map<string, { id: string; title: string; level: string | null; count: number }>();
  for (const g of groups) {
    const row = byCourse.get(g.course.id) ?? { id: g.course.id, title: g.course.title, level: g.course.level ?? null, count: 0 };
    row.count += 1;
    byCourse.set(g.course.id, row);
  }
  return [...byCourse.values()];
}

function ContactRows({ t, withWhatsapp = true }: { t: Dictionary; withWhatsapp?: boolean }) {
  const c = contacts();
  return (
    <ul className="contact-list max-w-xl">
      <li>
        <span className="contact-label">{t.footer.phone}</span>
        <a href={c.phoneHref} className="num link w-fit font-semibold">
          {c.phone}
        </a>
      </li>
      {withWhatsapp && c.whatsappHref && (
        <li>
          <span className="contact-label">WhatsApp</span>
          <a href={c.whatsappHref} rel="noopener" className="link w-fit font-semibold">
            {t.footer.whatsapp}
          </a>
        </li>
      )}
      <li>
        <span className="contact-label">{t.footer.email}</span>
        <a href={`mailto:${c.email}`} className="link w-fit font-semibold">
          {c.email}
        </a>
      </li>
    </ul>
  );
}

// What is open right now: the groups with seats first, a few lines, each with its days, hours and seats.
function OpenNow({ groups, locale, t }: { groups: PublicGroup[]; locale: Locale; t: Dictionary }) {
  if (groups.length === 0) {
    return (
      <div className="open-now open-now-empty">
        <h2>{t.home.noGroupsTitle}</h2>
        <p className="mt-3 text-muted">{t.home.noGroupsBody}</p>
        <div className="mt-5">
          <ContactRows t={t} withWhatsapp={false} />
        </div>
      </div>
    );
  }
  const shown = [...groups].sort((a, b) => Number(a.seatsLeft === 0) - Number(b.seatsLeft === 0)).slice(0, 4);
  return (
    <div className="open-now">
      <h2>{t.home.groupsTitle}</h2>
      <ul className="rows mt-3">
        {shown.map((g) => (
          <li key={g.id} data-hue={hueOf(g.course.id)} className="pen-edge reveal flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-4 pl-4">
            <div className="min-w-0">
              <Link href={localePath(locale, `/groups/${g.id}`)} className="display link tap text-lg font-semibold">
                {g.course.title}
              </Link>
              <p className="mt-0.5 text-[0.9375rem] text-muted">{[g.name, g.teacher?.name].filter(Boolean).join(", ")}</p>
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
  const rows = courseRows(groups);
  const shots = diaryShots();
  const features = [
    [Video, h.lessons.liveTitle, h.lessons.liveBody],
    [Notebook, h.lessons.diaryTitle, h.lessons.diaryBody],
    [People, h.lessons.groupTitle, h.lessons.groupBody],
  ] as const;
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

      <section className="hero">
        <div>
          <h1>{h.title}</h1>
          <p className="hero-lead">{h.lead}</p>
          <div className="hero-actions">
            {/* With nothing open the way to reach the school is the main action, so Apply steps back to a quiet button. */}
            <Link href={localePath(locale, "/apply")} className={groups.length > 0 ? "btn btn-lg" : "btn-ghost"}>
              {t.group.apply}
            </Link>
            {groups.length > 0 && (
              <Link href={localePath(locale, "/apply?trial=1")} className="btn-ghost">
                {t.group.trial}
              </Link>
            )}
            {groups.length > 0 && (
              <a href="#courses" className="btn-link">
                {h.seeGroups}
                <ArrowRight width={18} height={18} />
              </a>
            )}
          </div>
        </div>
        <OpenNow groups={groups} locale={locale} t={t} />
      </section>

      <Section id="lessons" title={h.lessonsTitle}>
        <ul className="features">
          {features.map(([Icon, title, body]) => (
            <li key={title}>
              <span className="feature-icon" aria-hidden>
                <Icon />
              </span>
              <h3>{title}</h3>
              <p className="mt-1 text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="join" title={h.howTitle}>
        <ol className="steps">
          {steps.map(([title, body], i) => (
            <li key={title}>
              <span className="step-number num" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3>{title}</h3>
                <p className="mt-1 max-w-[52ch] text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {rows.length > 0 && (
        <Section id="courses" title={h.coursesTitle}>
          <CourseIndex items={rows} locale={locale} t={t} />
        </Section>
      )}

      {groups.length > 0 && (
        <Section id="week" title={h.timetableTitle} lead={h.timetableLead} wide>
          <Timetable groups={groups} locale={locale} />
        </Section>
      )}

      {teachers.length > 0 && (
        <Section id="teachers" title={h.teachersTitle}>
          <TeacherList teachers={teachers.slice(0, 6)} locale={locale} t={t} />
          <Link href={localePath(locale, "/teachers")} className="btn-ghost mt-4">
            {h.allTeachers}
            <ArrowRight width={18} height={18} />
          </Link>
        </Section>
      )}

      {/* Only when the school has put real screenshots in public/brand/diary. */}
      {shots.length > 0 && (
        <Section id="diary" title={h.diaryTitle} lead={h.diaryLead}>
          <div className="shots">
            {shots.map((shot) => (
              <figure key={shot.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.src} alt={shot.caption} loading="lazy" />
                {shot.caption && <figcaption>{shot.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </Section>
      )}

      <Section id="apply" title={h.helpTitle} lead={h.helpBody}>
        <Link href={localePath(locale, "/apply")} className="btn btn-lg">
          {t.group.apply}
        </Link>
        <div className="mt-8">
          <ContactRows t={t} />
        </div>
        {c.isPlaceholder && <p className="footer-note mt-3">{t.footer.placeholder}</p>}
      </Section>
    </>
  );
}
