import { describe, expect, it } from "vitest";

import { radians } from "./radians";

describe("radians", () => {
  it("maps 180 degrees to pi", () => {
    expect(radians(180)).toBeCloseTo(Math.PI, 15);
  });

  it("maps 90 degrees to a quarter turn", () => {
    expect(radians(90)).toBeCloseTo(Math.PI / 2, 15);
  });

  it("maps zero to zero", () => {
    expect(radians(0)).toBe(0);
  });

  it("carries the sign", () => {
    expect(radians(-270)).toBeCloseTo((-3 * Math.PI) / 2, 15);
  });
});
