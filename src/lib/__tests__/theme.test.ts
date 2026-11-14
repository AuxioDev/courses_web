// The website's own colours: the paper, the four course pens, the yellow marker and the form-field edge. Light only.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/role-theme.css", import.meta.url), "utf8");
const vars = (s: string) => Object.fromEntries([...s.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2].toLowerCase()]));
const c = vars(css);

const channel = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("website colours", () => {
  it("is light only: no dark palette in this file, and color-scheme stays light", () => {
    expect(css).not.toContain("prefers-color-scheme: dark");
    expect(css).toMatch(/color-scheme:\s*light/);
  });

  it("sets every token the shared dark block would otherwise supply", () => {
    for (const name of ["bg", "surface", "surface-2", "ink", "muted", "line", "accent", "accent-ink", "accent-soft", "good", "good-soft", "warn", "warn-soft", "bad", "bad-soft"]) {
      expect(c[name], `--${name}`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it.each(["hue-0", "hue-1", "hue-2", "hue-3"])("course pen --%s reads as text on paper and on a card (4.5:1)", (hue) => {
    expect(contrast(c[hue], c.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c[hue], c.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("no course pen is a red or a warm brown, so a course never looks like the oxblood action colour", () => {
    // The title is always printed next to the colour, so a pen is never the only signal; this keeps the hues apart.
    for (const hue of ["hue-0", "hue-1", "hue-2", "hue-3"]) {
      const n = parseInt(c[hue].slice(1), 16);
      const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
      expect(r > g * 1.5 && r > b * 1.5, `--${hue} ${c[hue]}`).toBe(false);
    }
  });

  it("text on the yellow marker is readable (4.5:1)", () => {
    expect(contrast(c["marker-ink"], c.marker)).toBeGreaterThanOrEqual(4.5);
  });

  it("the edge of a form field can be seen (3:1) on the page and on a card", () => {
    expect(contrast(c["field-edge"], c.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(c["field-edge"], c.surface)).toBeGreaterThanOrEqual(3);
  });

  it("white text on the oxblood button is readable (4.5:1) and the muted text on the paper too", () => {
    expect(contrast(c["accent-ink"], c.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.muted, c.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.muted, c["surface-2"])).toBeGreaterThanOrEqual(4.5);
  });

  it("the hairlines can be told from the paper without competing with the text", () => {
    const ratio = contrast(c.rule, c.bg);
    expect(ratio).toBeGreaterThan(1.05);
    expect(ratio).toBeLessThan(2);
  });
});
