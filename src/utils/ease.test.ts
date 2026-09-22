import { describe, expect, it } from "vitest";

import { ease } from "./ease";

describe("ease", () => {
  it("starts at zero", () => {
    expect(ease(0)).toBe(0);
  });

  it("ends at one", () => {
    expect(ease(1)).toBe(1);
  });

  it("passes through the midpoint at half", () => {
    expect(ease(0.5)).toBeCloseTo(0.5, 12);
  });

  it("is symmetric about the midpoint", () => {
    expect(ease(0.25) + ease(0.75)).toBeCloseTo(1, 12);
  });

  it("rises monotonically across the unit interval", () => {
    const steps = Array.from({ length: 51 }, (_, k) => ease(k / 50));
    steps.forEach((value, k) => {
      const previous = steps[k - 1];
      if (previous !== undefined) expect(value).toBeGreaterThan(previous);
    });
  });

  it("starts slower than a straight line", () => {
    expect(ease(0.2)).toBeLessThan(0.2);
  });

  it("clamps below zero", () => {
    expect(ease(-3)).toBe(0);
  });

  it("clamps above one", () => {
    expect(ease(4.5)).toBe(1);
  });
});
