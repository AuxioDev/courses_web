import type { Metadata } from "next";
import { defaultLocale, locales, localePath, type Locale } from "@/i18n/config";
import { az } from "@/i18n/dictionaries/az";
import { en } from "@/i18n/dictionaries/en";
import { ru } from "@/i18n/dictionaries/ru";
import { SCHOOL_NAME } from "@/lib/site";

// Open Graph wants language_TERRITORY ("az_AZ"), not the bare language the site uses in its addresses.
const OG_LOCALE: Record<Locale, string> = { az: "az_AZ", en: "en_US", ru: "ru_RU" };
export const ogLocale = (locale: Locale) => OG_LOCALE[locale];

// Imported directly, not through @/i18n, which needs Next's request context and so cannot load in a test.
const SITE_DESCRIPTION: Record<Locale, string> = { az: az.meta.description, en: en.meta.description, ru: ru.meta.description };

// Title, description and the same page's address in each language, for search engines, plus what a link to the
// page looks like when it is shared. A page's `openGraph` replaces the layout's wholesale (Next does not merge it),
// so everything the preview needs is here, and a page with no description of its own gets the site's.
export function pageMeta(locale: Locale, path: string, title?: string, description?: string | null): Metadata {
  const text = description ? description.slice(0, 200) : SITE_DESCRIPTION[locale];
  return {
    ...(title ? { title } : {}),
    ...(description ? { description: description.slice(0, 200) } : {}),
    alternates: {
      canonical: localePath(locale, path),
      // "x-default" is the page for a visitor whose language is none of these.
      languages: { ...Object.fromEntries(locales.map((l) => [l, localePath(l, path)])), "x-default": localePath(defaultLocale, path) },
    },
    openGraph: {
      type: "website",
      siteName: SCHOOL_NAME,
      url: localePath(locale, path),
      locale: ogLocale(locale),
      alternateLocale: locales.filter((l) => l !== locale).map(ogLocale),
      title: title ? `${title} | ${SCHOOL_NAME}` : SCHOOL_NAME,
      description: text,
    },
  };
}

// For <script type="application/ld+json">: "<" must not be able to close the tag.
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
