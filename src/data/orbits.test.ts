import { describe, expect, it } from "vitest";

import { ORBIT_SEGMENTS } from "../constants/annotations";
import { EBodyKind } from "../types/body";
import { ellipse } from "../simulator/ellipse";
import { orbits } from "./orbits";
import { solar } from "./solar";

const J2000 = 2451545;
const LATER = J2000 + 36525;

const planets = solar.filter((body) => body.kind !== EBodyKind.Star);

describe("orbits", () => {
  it("draws no orbit for the star", () => {
    expect(orbits(solar, J2000).has("sun")).toBe(false);
  });

  it("draws exactly one orbit per planet", () => {
    const ids = [...orbits(solar, J2000).keys()].sort();
    expect(ids).toEqual(planets.map((body) => body.id).sort());
  });

  it("samples every orbit at ORBIT_SEGMENTS points", () => {
    orbits(solar, J2000).forEach((points) => {
      expect(points).toHaveLength(ORBIT_SEGMENTS);
    });
  });

  it("traces each planet's ellipse from its elements at the given date", () => {
    const drawn = orbits(solar, LATER);
    planets.forEach((body) => {
      expect(drawn.get(body.id)).toEqual(ellipse(body.orbit.elementsAt(LATER), ORBIT_SEGMENTS));
    });
  });
});
