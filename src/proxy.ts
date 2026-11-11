import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, LOCALE_COOKIE, localePath, matchLocale } from "@/i18n/config";
import { publicExists, type PublicKind } from "@/lib/public-exists";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Every page lives under /az, /en or /ru; add the prefix when it's missing. The site has no
// login: the only cookie is the chosen language, which Server Actions read.
//
// Detail pages (/en/groups/<id>, /en/courses/<id>, /en/teachers/<id>) are checked here too. A page that has to
// wait for its data has already started streaming, which fixes the status at 200 even when it then renders "not
// found" (a soft 404 that crawlers report). A missing address is rewritten to the catch-all route instead, which
// answers a real 404 with the same translated page.
const DETAIL: Record<string, PublicKind> = { groups: "groups", courses: "courses", teachers: "teachers" };

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (!hasLocale(first)) {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = hasLocale(saved) ? saved : (matchLocale(request.headers.get("accept-language")) ?? defaultLocale);
    return NextResponse.redirect(new URL(`${localePath(locale, pathname)}${search}`, request.url));
  }

  const [, , section, id, ...more] = pathname.split("/");
  const kind = DETAIL[section];
  const missing = kind !== undefined && !!id && more.every((part) => part === "") && !(await publicExists(kind, id));

  const response = missing ? NextResponse.rewrite(new URL(`/${first}/not-found`, request.url)) : NextResponse.next();
  if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
    response.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Files with an extension (icon.svg, sitemap.xml, robots.txt) are served as they are.
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
