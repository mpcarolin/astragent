import { describe, expect, it } from "vitest";
import { kepler } from "./kepler";

describe("kepler", () => {
  it("solves Kepler's equation to within 1e-12 across a grid of M and e", () => {
    for (let m = -Math.PI; m <= Math.PI; m += Math.PI / 20) {
      for (let e = 0; e <= 0.99; e += 0.11) {
        const E = kepler(m, e);
        const residual = m - (E - e * Math.sin(E));
        expect(Math.abs(residual)).toBeLessThan(1e-12);
      }
    }
  });

  it("returns E = M when eccentricity is zero", () => {
    expect(kepler(1.2345, 0)).toBeCloseTo(1.2345, 12);
  });

  it("returns E = 0 when mean anomaly is zero", () => {
    expect(kepler(0, 0.7)).toBeCloseTo(0, 12);
  });

  it("wraps mean anomaly outside [-pi, pi] before solving", () => {
    const wrapped = Math.PI / 3;
    const e = 0.6;
    const E = kepler(wrapped, e);

    for (const equivalent of [wrapped + 2 * Math.PI, wrapped - 2 * Math.PI, wrapped + 4 * Math.PI]) {
      expect(kepler(equivalent, e)).toBeCloseTo(E, 12);
    }
  });

  it("solves Kepler's equation to within 1e-12 for large multiples of 2*pi", () => {
    for (const m of [100 * Math.PI + 0.3, -50 * Math.PI - 1.2, 1000]) {
      for (const e of [0, 0.5, 0.99]) {
        const wrappedM = Math.atan2(Math.sin(m), Math.cos(m));
        const E = kepler(m, e);
        const residual = wrappedM - (E - e * Math.sin(E));
        expect(Math.abs(residual)).toBeLessThan(1e-12);
      }
    }
  });
});
