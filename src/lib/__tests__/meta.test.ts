import { describe, expect, it } from "vitest";
import { defaultLocale, locales } from "@/i18n/config";
import { az } from "@/i18n/dictionaries/az";
import { en } from "@/i18n/dictionaries/en";
import { ru } from "@/i18n/dictionaries/ru";
import { ogLocale, pageMeta } from "../meta";

const dictionaries = { az, en, ru };

describe("pageMeta", () => {
  it("names the same page in every language, and says which one to use when the visitor's language is unknown", () => {
    const meta = pageMeta("ru", "/courses");
    expect(meta.alternates?.canonical).toBe("/ru/courses");
    expect(meta.alternates?.languages).toEqual({
      az: "/az/courses",
      en: "/en/courses",
      ru: "/ru/courses",
      "x-default": `/${defaultLocale}/courses`,
    });
    for (const locale of locales) expect(Object.keys(pageMeta(locale, "/").alternates?.languages ?? {})).toContain("x-default");
  });

  it("gives the share preview real locale codes, not just the language", () => {
    expect(locales.map(ogLocale)).toEqual(locales.map((l) => ({ az: "az_AZ", en: "en_US", ru: "ru_RU" })[l]));
    const og = pageMeta("az", "/teachers").openGraph;
    expect(og).toMatchObject({ type: "website", url: "/az/teachers", locale: "az_AZ" });
    expect((og as { alternateLocale?: string[] }).alternateLocale).toEqual(["en_US", "ru_RU"]);
  });

  it("titles the preview after the page, and the school alone on the home page", () => {
    const page = pageMeta("en", "/courses", "Courses", "All our courses.").openGraph as { title?: string; description?: string };
    expect(page.title).toContain("Courses");
    expect(page.description).toBe("All our courses.");
    const home = pageMeta("en", "/").openGraph as { title?: string };
    expect(home.title).toBeTruthy();
    expect(home.title).not.toContain("|");
  });

  it("falls back to the site description when a page has none, so the preview never loses it", () => {
    for (const locale of locales) {
      const og = pageMeta(locale, "/groups/x", "Math, M-1").openGraph as { description?: string };
      expect(og.description).toBe(dictionaries[locale].meta.description);
    }
    const og = pageMeta("en", "/teachers/x", "Aysel", null).openGraph as { description?: string };
    expect(og.description).toBe(en.meta.description);
  });

  it("keeps a long description to 200 characters, as before", () => {
    const meta = pageMeta("en", "/courses/x", "Long", "x".repeat(500));
    expect(meta.description).toHaveLength(200);
    expect((meta.openGraph as { description?: string }).description).toHaveLength(200);
  });
});
