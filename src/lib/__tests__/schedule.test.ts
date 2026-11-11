import { describe, expect, it } from "vitest";
import type { PublicGroup } from "../public-data";
import { buildWeek, hueOf, summarize } from "../schedule";

const group = (id: string, rules: [number, string, string][]): PublicGroup => ({
  id,
  name: id,
  monthlyPrice: null,
  seatsLeft: null,
  course: { id: `course-${id}`, title: id, level: null },
  teacher: null,
  term: { name: "T", start: "2026-09-01", end: "2026-12-31" },
  schedule: rules.map(([weekday, startTime, endTime]) => ({ weekday, startTime, endTime })),
});

describe("summarize", () => {
  it("says shared hours once and keeps different hours apart", () => {
    const g = group("a", [[1, "18:00", "19:30"], [3, "18:00", "19:30"], [6, "11:00", "12:00"]]);
    expect(summarize(g.schedule)).toEqual([
      { startTime: "18:00", endTime: "19:30", weekdays: [1, 3] },
      { startTime: "11:00", endTime: "12:00", weekdays: [6] },
    ]);
  });
});

describe("buildWeek", () => {
  it("always shows Monday to Friday, and the weekend only when a lesson falls on it", () => {
    expect(buildWeek([group("a", [[1, "18:00", "19:30"]])]).days.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5]);
    expect(buildWeek([group("a", [[0, "10:00", "11:00"]])]).days.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 0]);
  });

  it("covers whole hours around the earliest start and the latest end", () => {
    const week = buildWeek([group("a", [[1, "17:30", "19:00"]]), group("b", [[2, "09:15", "10:45"]])]);
    expect([week.firstHour, week.lastHour]).toEqual([9, 19]);
  });

  it("puts overlapping lessons side by side and gives a lesson alone the full width", () => {
    const week = buildWeek([
      group("a", [[1, "18:00", "19:30"], [1, "10:00", "11:00"]]),
      group("b", [[1, "18:30", "20:00"]]),
      group("c", [[1, "19:30", "20:30"]]),
    ]);
    const monday = week.days[0].slots.map((s) => [s.group.id, s.lane, s.lanes]);
    expect(monday).toEqual([
      ["a", 0, 1],
      ["a", 0, 2],
      ["b", 1, 2],
      // Starts as "a" ends, so it takes a's place beside "b".
      ["c", 0, 2],
    ]);
  });

  it("ignores a rule that ends before it starts, and reports an empty week", () => {
    const week = buildWeek([group("a", [[1, "19:00", "18:00"]])]);
    expect(week.empty).toBe(true);
  });
});

describe("hueOf", () => {
  it("is stable and stays within the four pens", () => {
    expect(hueOf("cmabc123")).toBe(hueOf("cmabc123"));
    for (const id of ["a", "bb", "cmf0x9", "zzzzzzzzzzzzzzzzzzzzzzzz"]) expect([0, 1, 2, 3]).toContain(hueOf(id));
  });
});
