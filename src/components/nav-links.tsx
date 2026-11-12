"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath, type Locale } from "@/i18n/config";
import { LinkPending } from "./link-pending";

type Item = { path: string; label: string };

// The header's page links. The page you are on is marked (aria-current and a tint), and each link is 44 px tall on a
// phone, where the row also scrolls sideways when it does not fit.
function List({ locale, items, current }: { locale: Locale; items: Item[]; current: string | null }) {
  return (
    <ul className="flex gap-1 text-sm font-medium">
      {items.map(({ path, label }) => {
        const active = current !== null && (current === path || current.startsWith(`${path}/`));
        return (
          <li key={path}>
            <Link
              href={localePath(locale, path)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-lg px-2 md:min-h-9 ${active ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
            >
              {label}
              <LinkPending />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Current(props: { locale: Locale; items: Item[] }) {
  // Without the /az, /ru or /en prefix.
  const path = usePathname().replace(/^\/[^/]+/, "") || "/";
  return <List {...props} current={path} />;
}

// The address is only known in the browser on dynamic pages, so the static shell shows the links unmarked and the
// marked version streams in (the same arrangement as the language switch).
export function NavLinks(props: { locale: Locale; items: Item[] }) {
  return (
    <Suspense fallback={<List {...props} current={null} />}>
      <Current {...props} />
    </Suspense>
  );
}
