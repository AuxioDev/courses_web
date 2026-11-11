// The website's own colours: the four course pens and the yellow marker, in both modes.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/role-theme.css", import.meta.url), "utf8");
const dark = css.indexOf("prefers-color-scheme: dark");
const vars = (s: string) => Object.fromEntries([...s.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
const modes = { light: vars(css.slice(0, dark)), dark: vars(css.slice(dark, css.indexOf("}", css.indexOf("}", dark) + 1))) };

const channel = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe.each(["light", "dark"] as const)("website colours (%s)", (mode) => {
  const c = modes[mode];

  it.each(["hue-0", "hue-1", "hue-2", "hue-3"])("course pen --%s reads as text on a card (4.5:1)", (hue) => {
    expect(contrast(c[hue], c.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("text on the yellow marker is readable (4.5:1)", () => {
    expect(contrast(c["marker-ink"], c.marker)).toBeGreaterThanOrEqual(4.5);
  });

  it("the hour rules can be told from the sheet without competing with the lessons", () => {
    const ratio = contrast(c.rule, c.surface);
    expect(ratio).toBeGreaterThan(1.1);
    expect(ratio).toBeLessThan(2);
  });
});
