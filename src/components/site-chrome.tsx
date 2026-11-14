import Link from "next/link";
import type { Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { contacts, SCHOOL_NAME } from "@/lib/site";
import { Mark } from "./icons";
import { LanguageSwitch } from "./language-switch";
import { NavLinks } from "./nav-links";

type Props = { locale: Locale; t: Dictionary };

const pages = [
  { path: "/courses", key: "courses" },
  { path: "/schedule", key: "schedule" },
  { path: "/teachers", key: "teachers" },
] as const;

// The near-black bar: the school's name on the left, the page links as pills, the language and the main action on
// the right. The bar keeps its palette in both colour modes (site-theme.css).
export function SiteHeader({ locale, t }: Props) {
  return (
    <header className="site-header on-dark">
      <div className="mx-auto flex max-w-[81rem] flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 sm:px-6 md:py-3 lg:px-[3.25rem]">
        <Link href={localePath(locale, "/")} className="display mr-auto flex items-center gap-2.5 text-base font-bold text-ink">
          <Mark />
          {SCHOOL_NAME}
        </Link>
        <div className="flex items-center gap-2 md:order-3">
          <LanguageSwitch locale={locale} label={t.nav.language} />
          <Link href={localePath(locale, "/apply")} className="btn h-11 py-0 md:h-9">
            {t.nav.apply}
          </Link>
        </div>
        <nav aria-label={t.nav.main} className="scroll-hint -mx-1 w-full overflow-x-auto [--scroll-cover:var(--bg)] md:order-2 md:mx-0 md:w-auto">
          <NavLinks locale={locale} items={pages.map(({ path, key }) => ({ path, label: t.nav[key] }))} />
        </nav>
      </div>
    </header>
  );
}

// Darker still, in columns: who we are, the pages, how to reach us.
export function SiteFooter({ locale, t }: Props) {
  const c = contacts();
  return (
    <footer id="contact" className="site-footer on-dark">
      <div className="mx-auto grid max-w-[81rem] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] md:py-16 lg:px-[3.25rem]">
        <div>
          <p className="display flex items-center gap-2.5 text-base font-bold">
            <Mark />
            {SCHOOL_NAME}
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">{t.footer.online}</p>
        </div>
        <div>
          <h2 className="!text-base">{t.footer.contact}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={c.phoneHref} className="num font-medium underline-offset-4 hover:underline">
                {c.phone}
              </a>
            </li>
            {c.whatsappHref && (
              <li>
                <a href={c.whatsappHref} rel="noopener" className="font-medium underline-offset-4 hover:underline">
                  {t.footer.whatsapp}
                </a>
              </li>
            )}
            <li>
              <a href={`mailto:${c.email}`} className="font-medium underline-offset-4 hover:underline">
                {c.email}
              </a>
            </li>
          </ul>
          {c.isPlaceholder && <p className="mt-3 text-xs text-warn-on-dark">{t.footer.placeholder}</p>}
        </div>
        <ul className="space-y-2 text-sm">
          {pages.map(({ path, key }) => (
            <li key={path}>
              <Link href={localePath(locale, path)} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline md:min-h-6">
                {t.nav[key]}
              </Link>
            </li>
          ))}
          <li>
            <Link href={localePath(locale, "/privacy")} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline md:min-h-6">
              {t.footer.privacy}
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
