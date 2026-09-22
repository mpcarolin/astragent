import { describe, expect, it } from "vitest";

import type { TJplPlanet } from "./types";

import { J2000, DAYS_PER_CENTURY } from "../../constants/astronomy";
import { radians } from "../../utils/radians";
import { elementsAt } from "./elementsAt";
import { planets } from "./planets";

const row = (over: Partial<TJplPlanet> = {}): TJplPlanet => ({
  id: "test",
  name: "Test",
  elements: { a: 2, e: 0.1, i: 10, L: 100, longPeri: 40, node: 30 },
  rates: { a: 0.5, e: 0.02, i: 3, L: 60, longPeri: 4, node: 5 },
  ...over,
});

describe("elementsAt", () => {
  it("returns the J2000 values at J2000", () => {
    const at = elementsAt(row(), J2000);
    expect(at.semiMajorAxis).toBeCloseTo(2, 12);
    expect(at.eccentricity).toBeCloseTo(0.1, 12);
    expect(at.inclination).toBeCloseTo(radians(10), 12);
    expect(at.ascendingNode).toBeCloseTo(radians(30), 12);
  });

  it("adds one full rate to each element one century after J2000", () => {
    const at = elementsAt(row(), J2000 + DAYS_PER_CENTURY);
    expect(at.semiMajorAxis).toBeCloseTo(2.5, 12);
    expect(at.eccentricity).toBeCloseTo(0.12, 12);
    expect(at.inclination).toBeCloseTo(radians(13), 12);
    expect(at.ascendingNode).toBeCloseTo(radians(35), 12);
  });

  it("derives the argument of perihelion as longitude of perihelion minus ascending node", () => {
    const at = elementsAt(row(), J2000);
    expect(at.argumentOfPerihelion).toBeCloseTo(radians(40 - 30), 12);
  });

  it("derives the mean anomaly as mean longitude minus longitude of perihelion", () => {
    const at = elementsAt(row(), J2000);
    expect(Math.sin(at.meanAnomaly)).toBeCloseTo(Math.sin(radians(100 - 40)), 12);
    expect(Math.cos(at.meanAnomaly)).toBeCloseTo(Math.cos(radians(100 - 40)), 12);
  });

  it("applies the b, c, s and f corrections to the mean anomaly", () => {
    const corrections = { b: 0.5, c: 2, s: 3, f: 10 };
    const at = elementsAt(row({ corrections }), J2000 + DAYS_PER_CENTURY);
    const expected = radians(
      100 + 60 - (40 + 4) + 0.5 + 2 * Math.cos(radians(10)) + 3 * Math.sin(radians(10)),
    );
    expect(Math.sin(at.meanAnomaly)).toBeCloseTo(Math.sin(expected), 12);
    expect(Math.cos(at.meanAnomaly)).toBeCloseTo(Math.cos(expected), 12);
  });

  it("leaves the mean anomaly uncorrected when the row carries no corrections", () => {
    const at = elementsAt(row(), J2000 + DAYS_PER_CENTURY);
    const expected = radians(100 + 60 - (40 + 4));
    expect(Math.sin(at.meanAnomaly)).toBeCloseTo(Math.sin(expected), 12);
    expect(Math.cos(at.meanAnomaly)).toBeCloseTo(Math.cos(expected), 12);
  });

  it("wraps the mean anomaly into [-pi, pi]", () => {
    const at = elementsAt(row({ elements: { a: 2, e: 0.1, i: 10, L: 3000, longPeri: 40, node: 30 } }), J2000);
    expect(at.meanAnomaly).toBeGreaterThanOrEqual(-Math.PI);
    expect(at.meanAnomaly).toBeLessThanOrEqual(Math.PI);
  });

  it("gives earth a semi-major axis of about one au at J2000", () => {
    const earth = planets.find((p) => p.id === "earth");
    if (!earth) throw new Error("no earth row");
    expect(elementsAt(earth, J2000).semiMajorAxis).toBeCloseTo(1, 5);
  });

  it("carries no corrections for the inner planets", () => {
    for (const id of ["mercury", "venus", "earth", "mars"]) {
      expect(planets.find((p) => p.id === id)?.corrections).toBeUndefined();
    }
  });

  it("carries corrections for the outer planets", () => {
    for (const id of ["jupiter", "saturn", "uranus", "neptune"]) {
      expect(planets.find((p) => p.id === id)?.corrections).toBeDefined();
    }
  });
});
