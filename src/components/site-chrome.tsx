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

export function SiteHeader({ locale, t }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 sm:px-6">
        <Link href={localePath(locale, "/")} className="display mr-auto flex items-center gap-2 text-[0.9375rem] font-semibold">
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

export function SiteFooter({ locale, t }: Props) {
  const c = contacts();
  return (
    <footer id="contact" className="mt-16 border-t border-line bg-surface-2 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="display flex items-center gap-2 text-[0.9375rem] font-semibold">
            <Mark />
            {SCHOOL_NAME}
          </p>
          <p className="mt-2 max-w-xs text-sm text-muted">{t.footer.online}</p>
        </div>
        <div>
          <h2 className="!text-sm">{t.footer.contact}</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
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
          {c.isPlaceholder && <p className="mt-2 text-xs text-warn">{t.footer.placeholder}</p>}
        </div>
        <ul className="space-y-1.5 text-sm">
          {pages.map(({ path, key }) => (
            <li key={path}>
              <Link href={localePath(locale, path)} className="underline-offset-4 hover:underline">
                {t.nav[key]}
              </Link>
            </li>
          ))}
          <li>
            <Link href={localePath(locale, "/privacy")} className="underline-offset-4 hover:underline">
              {t.footer.privacy}
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
