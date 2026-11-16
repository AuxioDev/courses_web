import type { Metadata } from "next";
import { connection } from "next/server";
import { fmt, getI18n } from "@/i18n";
import { getOpenGroups, getSeatsLeft } from "@/lib/public-data";
import { pageMeta } from "@/lib/meta";
import { summarize } from "@/lib/schedule";
import { Empty } from "@/components/ui";
import { ApplyForm, type GroupOption } from "@/components/apply-form";
import { dayList, seatsText } from "@/components/group-list";
import { PageHead } from "@/components/page-head";

type Props = PageProps<"/[lang]/apply">;

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    ...pageMeta(locale, "/apply", t.apply.title, t.apply.lead),
    robots: { index: false },
  };
}

// The chosen group is in the address, and its seats are counted for this request.
export const instant = false;

export default async function ApplyPage({ searchParams }: Props) {
  const [{ locale, t }, query] = await Promise.all([getI18n(), searchParams]);
  await connection();
  const groups = await getOpenGroups();
  const asked = typeof query.group === "string" ? query.group : null;
  // The list may be a minute old; the group the person came for is counted now.
  const fresh = asked ? await getSeatsLeft(asked) : undefined;

  const options: GroupOption[] = groups
    .filter((group) => group.id !== asked || fresh !== undefined)
    .map((group) => {
      const seatsLeft =
        group.id === asked && fresh !== undefined ? fresh : group.seatsLeft;
      const hours = summarize(group.schedule).map(
        (line) =>
          `${dayList(line.weekdays, locale)} ${line.startTime}–${line.endTime}`,
      );
      const price =
        group.monthlyPrice === null
          ? t.group.priceOnRequest
          : fmt(t.group.price, { n: group.monthlyPrice });
      return {
        id: group.id,
        label: `${group.course.title}, ${group.name}${seatsLeft === 0 ? ` (${t.group.full})` : ""}`,
        detail: [
          ...hours,
          group.teacher?.name,
          price,
          seatsText(seatsLeft, locale, t.group),
        ]
          .filter(Boolean)
          .join(" / "),
        full: seatsLeft === 0,
      };
    });
  const chosen = options.find((o) => o.id === asked && !o.full)?.id ?? null;

  const next = t.home;
  const steps = [
    [next.steps.chooseTitle, next.steps.chooseBody],
    [next.steps.applyTitle, next.steps.applyBody],
    [next.steps.callTitle, next.steps.callBody],
  ];

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
      <div className="max-w-2xl">
        <PageHead title={t.apply.title} lead={t.apply.lead} />
        {options.every((o) => o.full) ? (
          <Empty>{t.apply.noGroups}</Empty>
        ) : (
          <>
            {asked && !chosen && (
              <p
                role="status"
                className="mb-5 rounded-[3px] bg-warn-soft px-3 py-2 text-sm text-warn"
              >
                {fresh === 0
                  ? t.apply.errors.groupFull
                  : t.apply.errors.groupClosed}
              </p>
            )}
            <ApplyForm
              key={chosen}
              locale={locale}
              groups={options}
              chosen={chosen}
              labels={t.apply}
            />
          </>
        )}
      </div>
      {/* What happens after the form is sent: the same three steps as on the home page. */}
      <aside aria-labelledby="next" className="lg:pt-28">
        <h2 id="next" className="!text-xl">
          {next.howTitle}
        </h2>
        <ol className="steps mt-3">
          {steps.map(([title, body], i) => (
            <li key={title}>
              <span className="step-number num" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3>{title}</h3>
                <p className="mt-1 text-[0.9375rem] text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
