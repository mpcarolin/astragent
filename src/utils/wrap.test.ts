import { describe, expect, it } from "vitest";

import { wrap } from "./wrap";

describe("wrap", () => {
  it("leaves an angle already inside the range alone", () => {
    expect(wrap(1)).toBeCloseTo(1, 12);
  });

  it("brings an angle above pi down by a full turn", () => {
    expect(wrap(Math.PI + 0.5)).toBeCloseTo(-Math.PI + 0.5, 12);
  });

  it("brings an angle below -pi up by a full turn", () => {
    expect(wrap(-Math.PI - 0.5)).toBeCloseTo(Math.PI - 0.5, 12);
  });

  it("removes many full turns", () => {
    expect(wrap(0.25 + 100 * Math.PI)).toBeCloseTo(0.25, 10);
  });

  it("returns an angle in [-pi, pi] for a spread of inputs", () => {
    for (let a = -50; a <= 50; a += 0.37) {
      const wrapped = wrap(a);
      expect(wrapped).toBeGreaterThanOrEqual(-Math.PI - 1e-12);
      expect(wrapped).toBeLessThanOrEqual(Math.PI + 1e-12);
      expect(Math.sin(wrapped)).toBeCloseTo(Math.sin(a), 10);
      expect(Math.cos(wrapped)).toBeCloseTo(Math.cos(a), 10);
    }
  });
});
