import type { Metadata } from "next";
import { locales, localePath, type Locale } from "@/i18n/config";

// Title, description and the same page's address in each language, for search engines.
export function pageMeta(locale: Locale, path: string, title?: string, description?: string | null): Metadata {
  return {
    ...(title ? { title } : {}),
    ...(description ? { description: description.slice(0, 200) } : {}),
    alternates: {
      canonical: localePath(locale, path),
      languages: Object.fromEntries(locales.map((l) => [l, localePath(l, path)])),
    },
  };
}

// For <script type="application/ld+json">: "<" must not be able to close the tag.
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
