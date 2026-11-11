// Shaping a group's weekly rules for display. Pure functions, safe anywhere.
import type { PublicGroup } from "./public-data";
import { minutesOf, WEEK } from "./school-time";

// One of four pen colours per course, the same on every page.
export function hueOf(courseId: string) {
  let sum = 0;
  for (const char of courseId) sum = (sum * 31 + char.charCodeAt(0)) % 9973;
  return sum % 4;
}

// "Monday and Wednesday, 18:00–19:30": rules that share their hours are said once.
export function summarize(schedule: PublicGroup["schedule"]) {
  const byHours = new Map<string, { startTime: string; endTime: string; weekdays: number[] }>();
  for (const rule of schedule) {
    const key = `${rule.startTime}-${rule.endTime}`;
    const entry = byHours.get(key) ?? { startTime: rule.startTime, endTime: rule.endTime, weekdays: [] };
    if (!entry.weekdays.includes(rule.weekday)) entry.weekdays.push(rule.weekday);
    byHours.set(key, entry);
  }
  return [...byHours.values()];
}

export type Slot = { group: PublicGroup; start: number; end: number; startTime: string; endTime: string; lane: number; lanes: number };

// The whole week as columns of slots. Lessons that overlap in a day sit side by side.
export function buildWeek(groups: PublicGroup[]) {
  const days = new Map<number, Slot[]>();
  for (const group of groups) {
    for (const rule of group.schedule) {
      const start = minutesOf(rule.startTime);
      const end = minutesOf(rule.endTime);
      if (!(end > start)) continue;
      const slots = days.get(rule.weekday) ?? [];
      slots.push({ group, start, end, startTime: rule.startTime, endTime: rule.endTime, lane: 0, lanes: 1 });
      days.set(rule.weekday, slots);
    }
  }
  for (const slots of days.values()) {
    slots.sort((a, b) => a.start - b.start || a.end - b.end);
    // Each run of overlapping lessons shares the column's width equally.
    let cluster: Slot[] = [];
    let clusterEnd = -1;
    const close = () => {
      const lanes = Math.max(0, ...cluster.map((s) => s.lane)) + 1;
      for (const slot of cluster) slot.lanes = lanes;
    };
    for (const slot of slots) {
      if (slot.start >= clusterEnd) {
        close();
        cluster = [];
      }
      const taken = new Set(cluster.filter((other) => other.end > slot.start).map((other) => other.lane));
      while (taken.has(slot.lane)) slot.lane++;
      cluster.push(slot);
      clusterEnd = Math.max(clusterEnd, slot.end);
    }
    close();
  }
  const all = [...days.values()].flat();
  // Weekdays are always there, like on a printed timetable; the weekend only when used.
  const weekdays = WEEK.filter((day) => (day >= 1 && day <= 5) || days.has(day));
  return {
    days: weekdays.map((weekday) => ({ weekday, slots: days.get(weekday) ?? [] })),
    firstHour: all.length ? Math.floor(Math.min(...all.map((s) => s.start)) / 60) : 9,
    lastHour: all.length ? Math.ceil(Math.max(...all.map((s) => s.end)) / 60) : 18,
    empty: all.length === 0,
  };
}
