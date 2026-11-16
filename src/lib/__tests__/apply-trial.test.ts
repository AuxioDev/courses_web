import { describe, expect, it } from "vitest";
import { readApplyForm } from "../apply";

describe("trial lesson request", () => {
  it("is read from the checkbox, and is off when the box is not ticked", () => {
    const on = new FormData();
    on.set("trial", "on");
    expect(readApplyForm(on).trial).toBe(true);
    expect(readApplyForm(new FormData()).trial).toBe(false);
  });
});
