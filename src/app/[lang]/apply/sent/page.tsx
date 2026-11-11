import Link from "next/link";
import type { Metadata } from "next";
import { getI18n } from "@/i18n";
import { localePath } from "@/i18n/config";
import { contacts } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.sent.title, robots: { index: false } };
}

export default async function SentPage() {
  const { locale, t } = await getI18n();
  const s = t.sent;
  const c = contacts();
  const steps = [
    [s.callTitle, s.callBody],
    [s.loginTitle, s.loginBody],
    [s.startTitle, s.startBody],
  ];
  return (
    <div className="max-w-2xl">
      <h1>{s.title}</h1>
      <p className="mt-3 text-muted">{s.body}</p>
      <ol className="mt-8 space-y-5">
        {steps.map(([title, body], i) => (
          <li key={title} className="flex gap-3">
            <span className="marked display num flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold" aria-hidden>
              {i + 1}
            </span>
            <div>
              <h2 className="!text-base">{title}</h2>
              <p className="mt-0.5 text-sm text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href={localePath(locale, "/")} className="btn">
          {s.back}
        </Link>
        <a href={c.phoneHref} className="btn-ghost num">
          {c.phone}
        </a>
      </div>
    </div>
  );
}
