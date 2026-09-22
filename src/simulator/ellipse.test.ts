import { describe, expect, it } from "vitest";

import type { TKeplerianElements } from "../types/elements";

import { ellipse } from "./ellipse";

const elements = (over: Partial<TKeplerianElements> = {}): TKeplerianElements => ({
  semiMajorAxis: 1,
  eccentricity: 0,
  inclination: 0,
  ascendingNode: 0,
  argumentOfPerihelion: 0,
  meanAnomaly: 0,
  ...over,
});

describe("ellipse", () => {
  it("returns exactly the requested number of points", () => {
    expect(ellipse(elements(), 4)).toHaveLength(4);
    expect(ellipse(elements(), 128)).toHaveLength(128);
  });

  it("keeps a circular zero-inclination orbit at radius a", () => {
    ellipse(elements({ semiMajorAxis: 2.5 }), 32).forEach((p) => {
      expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(2.5, 10);
    });
  });

  it("keeps every point of an eccentric orbit on its ellipse", () => {
    const a = 3;
    const e = 0.5;
    const b = a * Math.sqrt(1 - e * e);
    ellipse(elements({ semiMajorAxis: a, eccentricity: e }), 64).forEach((p) => {
      expect(((p.x + a * e) / a) ** 2 + (p.y / b) ** 2).toBeCloseTo(1, 10);
    });
  });

  it("starts at perihelion on the positive x axis", () => {
    const points = ellipse(elements({ semiMajorAxis: 2, eccentricity: 0.5 }), 16);
    const first = points[0];
    expect(first?.x).toBeCloseTo(1, 10);
    expect(first?.y).toBeCloseTo(0, 10);
  });

  it("reaches aphelion at the halfway point", () => {
    const segments = 16;
    const points = ellipse(elements({ semiMajorAxis: 2, eccentricity: 0.5 }), segments);
    const half = points[segments / 2];
    expect(half?.x).toBeCloseTo(-3, 10);
    expect(half?.y).toBeCloseTo(0, 10);
  });

  it("sweeps eccentric anomaly, not mean anomaly", () => {
    const points = ellipse(elements({ semiMajorAxis: 1, eccentricity: 0.6 }), 4);
    const expected = [
      { x: 0.4, y: 0 },
      { x: -0.6, y: 0.8 },
      { x: -1.6, y: 0 },
      { x: -0.6, y: -0.8 },
    ];

    expected.forEach((want, k) => {
      expect(points[k]?.x).toBeCloseTo(want.x, 6);
      expect(points[k]?.y).toBeCloseTo(want.y, 6);
    });
  });

  it("keeps a zero-inclination orbit in the ecliptic plane", () => {
    ellipse(elements({ eccentricity: 0.4 }), 32).forEach((p) => {
      expect(p.z).toBeCloseTo(0, 12);
    });
  });

  it("tilts an inclined orbit out of the ecliptic by the inclination", () => {
    const inclination = Math.PI / 6;
    const points = ellipse(elements({ inclination }), 32);

    expect(points.some((p) => Math.abs(p.z) > 1e-6)).toBe(true);

    const peak = Math.max(...points.map((p) => Math.abs(p.z)));
    expect(peak).toBeCloseTo(Math.sin(inclination), 6);
  });

  it("leaves the caller's elements untouched", () => {
    const input = elements({ semiMajorAxis: 2, eccentricity: 0.3 });
    ellipse(input, 8);
    expect(input.meanAnomaly).toBe(0);
  });
});
