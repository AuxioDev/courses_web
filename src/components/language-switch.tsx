"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { localePath, type Locale } from "@/i18n/config";

const ORDER: Locale[] = ["az", "ru", "en"];

function Links({ locale, label, path }: { locale: Locale; label: string; path: string }) {
  return (
    <ul aria-label={label} className="flex items-center rounded-lg border border-line bg-surface text-xs font-semibold">
      {ORDER.map((l) => (
        <li key={l}>
          <Link
            href={localePath(l, path)}
            hrefLang={l}
            lang={l}
            aria-current={l === locale ? "true" : undefined}
            className={`flex h-11 min-w-11 items-center justify-center rounded-lg px-2 md:h-9 md:min-w-9 ${l === locale ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
          >
            {l.toUpperCase()}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CurrentPage(props: { locale: Locale; label: string }) {
  // Strip the /az, /ru or /en prefix: the same page opens in the chosen language.
  const path = usePathname().replace(/^\/[^/]+/, "") || "/";
  const query = useSearchParams().toString();
  return <Links {...props} path={query ? `${path}?${query}` : path} />;
}

// The path is only known in the browser on dynamic pages, so the static shell links to the
// home page and the exact page streams in.
export function LanguageSwitch(props: { locale: Locale; label: string }) {
  return (
    <Suspense fallback={<Links {...props} path="/" />}>
      <CurrentPage {...props} />
    </Suspense>
  );
}
