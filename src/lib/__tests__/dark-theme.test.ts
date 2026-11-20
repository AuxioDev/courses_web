// The opt-in dark theme (dark-theme.css): the same pairings the light palette is held to in theme.test.ts.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/dark-theme.css", import.meta.url), "utf8");
const block = css.slice(css.indexOf(':root[data-theme="dark"] {'), css.indexOf("}", css.indexOf(':root[data-theme="dark"] {')));
const c = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2].toLowerCase()]));

const channel = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("website dark theme", () => {
  it("is only applied by the data-theme attribute, never by the device setting", () => {
    expect(css).not.toContain("prefers-color-scheme");
    expect(css).toMatch(/color-scheme:\s*dark/);
  });

  it("sets every colour token the light theme sets", () => {
    const light = readFileSync(new URL("../../app/role-theme.css", import.meta.url), "utf8");
    const names = [...light.slice(0, light.indexOf("--radius-md")).matchAll(/--([\w-]+):\s*#[0-9a-fA-F]{6}\s*;/g)].map((m) => m[1]);
    for (const name of names) expect(c[name], `--${name}`).toMatch(/^#[0-9a-f]{6}$/);
  });

  it.each([
    ["ink", "bg"], ["ink", "surface"], ["ink", "surface-2"], ["muted", "bg"], ["muted", "surface"], ["muted", "surface-2"],
    ["body", "bg"], ["body", "surface-2"], ["accent", "bg"], ["accent", "surface"], ["accent", "surface-2"], ["accent", "accent-soft"],
    ["accent-ink", "accent"], ["accent-ink", "accent-hover"], ["accent-chip", "accent-soft"], ["accent-chip", "surface"],
    ["accent-chip", "surface-2"], ["good", "good-soft"], ["warn", "warn-soft"], ["bad", "bad-soft"], ["good", "bg"], ["warn", "bg"],
    ["bad", "bg"], ["bg", "good"], ["bg", "warn"], ["bg", "bad"], ["marker-ink", "marker"],
    ["hue-0", "surface"], ["hue-1", "surface"], ["hue-2", "surface"], ["hue-3", "surface"],
    ["hue-0", "bg"], ["hue-1", "bg"], ["hue-2", "bg"], ["hue-3", "bg"],
  ])("--%s on --%s is at least 4.5:1", (fg, bg) => {
    expect(contrast(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("the edge of a form field can be seen (3:1) and the divider is distinguishable", () => {
    expect(contrast(c["field-edge"], c.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(c["field-edge"], c.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(c.line, c.bg)).toBeGreaterThanOrEqual(1.2);
  });
});
