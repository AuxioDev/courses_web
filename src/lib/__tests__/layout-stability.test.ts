// Keeps the home page from jumping while its fonts load (found as a layout shift of 0.14 on a phone).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const layout = read("../../app/[lang]/layout.tsx");
const theme = read("../../app/site-theme.css");

describe("layout stability", () => {
  it("preloads the single-weight heading font, so it is there before the first paint and the headline does not re-wrap", () => {
    const block = layout.slice(layout.indexOf("Source_Serif_4({"));
    const options = block.slice(0, block.indexOf("});"));
    expect(options).toMatch(/preload:\s*true/);
    expect(options).toMatch(/weight:\s*\["600"\]/);
  });

  it("stacks the hero actions on a narrow phone, so a font loading cannot move the second one", () => {
    expect(theme).toMatch(/@media \(max-width: 30rem\)\s*\{\s*\.hero-actions\s*\{\s*flex-direction:\s*column/);
  });

  it("keeps every stand-alone link on a phone a 44 px target", () => {
    expect(theme).toMatch(/\.tap\s*\{[^}]*min-height:\s*2\.75rem/);
  });
});
