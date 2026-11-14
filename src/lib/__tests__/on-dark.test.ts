// The regions that stay dark in both colour modes (the header, the dark bands, the footer) keep their own palette in
// site-theme.css. This reads that file and keeps their text readable.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/site-theme.css", import.meta.url), "utf8");
const block = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`${selector} not found`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2].toLowerCase()]));
};

const channel = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Each region overrides some of the .on-dark tokens.
const regions = {
  ".on-dark": block(".on-dark"),
  ".site-header": { ...block(".on-dark"), ...block(".site-header") },
  ".site-footer": { ...block(".on-dark"), ...block(".site-footer") },
};

describe.each(Object.entries(regions))("dark region %s", (_name, c) => {
  it.each([
    ["ink", "bg"], ["ink", "surface"], ["ink", "surface-2"],
    ["muted", "bg"], ["muted", "surface"], ["muted", "surface-2"],
    ["accent", "bg"], ["accent", "surface"], ["accent", "surface-2"],
    ["accent-ink", "accent"],
  ])("text --%s on --%s is at least 4.5:1", (fg, bg) => {
    expect(contrast(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("fixed colours on the dark regions", () => {
  it("white on the indigo button and on the current-page pill is readable", () => {
    expect(css).toContain("background: #4850ec");
    expect(contrast("#ffffff", "#4850ec")).toBeGreaterThanOrEqual(4.5);
  });

  it("the amber placeholder note is readable on the footer", () => {
    expect(contrast("#f0b65a", regions[".site-footer"].bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("the current-page pill in the header does not rely on the header's own colour", () => {
    // White text on indigo, on a #1d1d1f bar: the pill itself is also distinguishable from the bar.
    expect(contrast("#4850ec", regions[".site-header"].bg)).toBeGreaterThanOrEqual(2.4);
  });
});
