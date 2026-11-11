// Dates and times as the school sees them. Lesson times on the site are always the school's
// local time, whoever is looking. Safe for client components.
import { intlLocale, type Locale } from "@/i18n/config";

export type DayKey = string; // "YYYY-MM-DD"

export function dayKey(date: Date, timeZone: string): DayKey {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

// Term dates are calendar days stored at midnight UTC.
export const dateOfDayKey = (key: DayKey) => new Date(`${key}T00:00:00Z`);

export function formatDay(key: DayKey, locale: Locale, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) {
  return new Intl.DateTimeFormat(intlLocale[locale], { timeZone: "UTC", ...options }).format(dateOfDayKey(key));
}

export function formatLessonDay(date: Date, timeZone: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale[locale], { timeZone, weekday: "long", day: "numeric", month: "long" }).format(date);
}

export function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(date);
}

// Weekdays in school order, Monday first. Values are the database's numbers (0 = Sunday).
export const WEEK = [1, 2, 3, 4, 5, 6, 0] as const;

export function weekdayName(weekday: number, locale: Locale, width: "long" | "short" = "long") {
  // 2024-01-07 was a Sunday.
  const date = new Date(Date.UTC(2024, 0, 7 + weekday));
  const name = new Intl.DateTimeFormat(intlLocale[locale], { timeZone: "UTC", weekday: width }).format(date);
  return name.charAt(0).toLocaleUpperCase(intlLocale[locale]) + name.slice(1);
}

// "18:00" -> 1080
export function minutesOf(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
