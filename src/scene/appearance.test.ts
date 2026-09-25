import { describe, expect, it } from "vitest";

import type { TPlanet } from "../types/body";

import { Vector3 } from "three";
import { EBodyKind } from "../types/body";

import { J2000 } from "../constants/astronomy";
import { solar } from "../data/solar";
import { propagate } from "../simulator/propagate";
import { julian } from "../utils/date/julian";
import { radians } from "../utils/radians";
import { appearance } from "./appearance";

type TSeason = {
  readonly id: string;
  readonly event: string;
  readonly date: string;
  readonly elevation: number;
};

const planets = solar.filter((body): body is TPlanet => body.kind === EBodyKind.Planet);

const EARTH_OBLIQUITY = radians(23.44);
const OBLIQUITY: Record<string, number> = {
  mercury: radians(0.034),
  venus: radians(180 - 177.36),
  earth: EARTH_OBLIQUITY,
  mars: radians(25.19),
  jupiter: radians(3.13),
  saturn: radians(26.73),
  uranus: radians(180 - 97.77),
  neptune: radians(28.32),
};
const OBLIQUITY_TOLERANCE = radians(0.05);

const SEASONS: readonly TSeason[] = [
  { id: "earth", event: "March equinox", date: "2026-03-20T14:46Z", elevation: 0 },
  { id: "earth", event: "June solstice", date: "2026-06-21T08:24Z", elevation: EARTH_OBLIQUITY },
  { id: "saturn", event: "equinox", date: "2025-05-06", elevation: 0 },
  { id: "uranus", event: "equinox", date: "2007-12-07", elevation: 0 },
  { id: "mars", event: "northern spring of year 38", date: "2024-11-12", elevation: 0 },
];
const SEASON_TOLERANCE = radians(0.25);

function pole(id: string): Vector3 {
  const vector = appearance[id]?.pole;
  if (!vector) {
    throw new Error(`${id} has no pole`);
  }
  return new Vector3().copy(vector);
}

function orbitNormal(body: TPlanet): Vector3 {
  const { inclination, ascendingNode } = body.orbit.elementsAt(J2000);
  return new Vector3(
    Math.sin(inclination) * Math.sin(ascendingNode),
    -Math.sin(inclination) * Math.cos(ascendingNode),
    Math.cos(inclination),
  );
}

function planetById(id: string): TPlanet {
  const found = planets.find((planet) => planet.id === id);
  if (!found) {
    throw new Error(`${id} is not a planet`);
  }
  return found;
}

describe("appearance", () => {
  it("has an entry for every body in the solar system", () => {
    solar.forEach((body) => {
      expect(appearance[body.id]).toBeDefined();
    });
  });

  it("names a texture file for every body in the solar system", () => {
    solar.forEach((body) => {
      expect(appearance[body.id]?.texture).toMatch(/\.jpg$/);
    });
  });

  it("names a texture file in every entry it holds", () => {
    Object.values(appearance).forEach((look) => {
      expect(look.texture).toMatch(/\.jpg$/);
    });
  });

  it("gives each body its own texture file", () => {
    const files = Object.values(appearance).map((look) => look.texture);
    expect(new Set(files).size).toBe(files.length);
  });

  it.each(planets.map((planet) => planet.id))("stores %s's pole as a unit vector", (id) => {
    expect(pole(id).length()).toBeCloseTo(1, 5);
  });

  it.each(Object.entries(OBLIQUITY))("tilts %s's pole from its orbit normal by its obliquity", (id, obliquity) => {
    const angle = pole(id).angleTo(orbitNormal(planetById(id)));
    expect(Math.abs(angle - obliquity)).toBeLessThan(OBLIQUITY_TOLERANCE);
  });

  SEASONS.forEach((season) => {
    it(`leans ${season.id}'s pole so the sun sits where it should at its ${season.event}`, () => {
      const toSun = new Vector3().copy(propagate(planetById(season.id), julian(season.date))).negate();
      const elevation = Math.PI / 2 - pole(season.id).angleTo(toSun);
      expect(Math.abs(elevation - season.elevation)).toBeLessThan(SEASON_TOLERANCE);
    });
  });
});
