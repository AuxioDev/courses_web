import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, LOCALE_COOKIE, localePath, matchLocale } from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Every page lives under /az, /en or /ru; add the prefix when it's missing. The site has no
// login: the only cookie is the chosen language, which Server Actions read.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (!hasLocale(first)) {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = hasLocale(saved) ? saved : (matchLocale(request.headers.get("accept-language")) ?? defaultLocale);
    return NextResponse.redirect(new URL(`${localePath(locale, pathname)}${search}`, request.url));
  }

  const response = NextResponse.next();
  if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
    response.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Files with an extension (icon.svg, sitemap.xml, robots.txt) are served as they are.
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
