import type { MetadataRoute } from "next";
import { locales, localePath } from "@/i18n/config";
import { getPublicIds } from "@/lib/public-data";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ids = await getPublicIds();
  const paths = [
    "/",
    "/courses",
    "/schedule",
    "/teachers",
    "/privacy",
    ...ids.courses.map((id) => `/courses/${id}`),
    ...ids.groups.map((id) => `/groups/${id}`),
    ...ids.teachers.map((id) => `/teachers/${id}`),
  ];
  const base = siteUrl();
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${base}${localePath(locale, path)}`,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${base}${localePath(l, path)}`])) },
    })),
  );
}
