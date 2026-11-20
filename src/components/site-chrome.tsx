import Link from "next/link";
import { Brand } from "@/components/brand";
import type { Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { brandLogo } from "@/lib/brand";
import { contacts, SCHOOL_NAME } from "@/lib/site";
import { LanguageSwitch } from "./language-switch";
import { ThemeToggle } from "./theme-toggle";
import { NavLinks } from "./nav-links";

type Props = { locale: Locale; t: Dictionary };

const pages = [
  { path: "/courses", key: "courses" },
  { path: "/schedule", key: "schedule" },
  { path: "/teachers", key: "teachers" },
] as const;

// The school's name (and its logo, once the school has supplied one), the page links as plain text, the language, and
// the one action that matters. A hairline underneath; sticky. On a phone the links stay in a row you can swipe,
// so there is no menu to open.
export function SiteHeader({ locale, t }: Props) {
  const logo = brandLogo();
  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-[75rem] flex-wrap items-center gap-x-3 px-5 sm:gap-x-6 sm:px-8 lg:px-12">
        <Link href={localePath(locale, "/")} className="site-name mr-auto flex min-h-12 items-center gap-2.5">
          {/* The logo is decorative: the name is written next to it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo && <img src={logo} alt="" height={32} className="brand-mark h-8 w-auto" />}
          <Brand name={SCHOOL_NAME} />
        </Link>
        <div className="flex items-center gap-1 md:order-3">
          <LanguageSwitch locale={locale} label={t.nav.language} />
          <ThemeToggle labels={{ theme: t.nav.theme, dark: t.nav.themeDark }} />
          <Link href={localePath(locale, "/apply")} className="btn ml-2">
            {t.nav.apply}
          </Link>
        </div>
        <nav aria-label={t.nav.main} className="scroll-hint -mx-1 w-full overflow-x-auto [--scroll-cover:var(--bg)] md:order-2 md:mx-0 md:w-auto">
          <NavLinks locale={locale} items={[...pages.map(({ path, key }) => ({ path, label: t.nav[key] })), { path: "/faq", label: t.footer.faq }]} />
        </nav>
      </div>
    </header>
  );
}

// The same three columns on every page: who we are, how to reach us, where to go.
export function SiteFooter({ locale, t }: Props) {
  const c = contacts();
  return (
    <footer id="contact" className="site-footer">
      <div className="mx-auto grid max-w-[75rem] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[minmax(0,3fr)_minmax(0,5fr)_minmax(0,4fr)] md:py-16 lg:px-12">
        <div>
          <p className="site-name">
            <Brand name={SCHOOL_NAME} />
          </p>
          <p className="mt-2 max-w-xs text-[0.9375rem] text-muted">{t.footer.online}</p>
        </div>
        <div>
          <p className="footer-col-title">{t.footer.contact}</p>
          <ul className="footer-links mt-2">
            <li>
              <a href={c.phoneHref} className="num link">
                {c.phone}
              </a>
            </li>
            {c.whatsappHref && (
              <li>
                <a href={c.whatsappHref} rel="noopener" className="link">
                  {t.footer.whatsapp}
                </a>
              </li>
            )}
            <li>
              <a href={`mailto:${c.email}`} className="link">
                {c.email}
              </a>
            </li>
          </ul>
          {c.isPlaceholder && <p className="footer-note mt-2">{t.footer.placeholder}</p>}
        </div>
        <ul className="footer-links">
          {pages.map(({ path, key }) => (
            <li key={path}>
              <Link href={localePath(locale, path)} className="link">
                {t.nav[key]}
              </Link>
            </li>
          ))}
          <li>
            <Link href={localePath(locale, "/faq")} className="link">
              {t.footer.faq}
            </Link>
          </li>
          <li>
            <Link href={localePath(locale, "/privacy")} className="link">
              {t.footer.privacy}
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
