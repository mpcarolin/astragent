import { describe, expect, it } from "vitest";

import type { TBody } from "../types/body";
import type { TKeplerianElements } from "../types/elements";

import { EBodyKind } from "../types/body";

import horizons from "../../test/fixtures/horizons.json" with { type: "json" };
import { J2000, KM_PER_AU } from "../constants/astronomy";
import { solar } from "../data/solar";
import { position } from "./position";
import { propagate } from "./propagate";

type THorizonsSample = {
  readonly jd: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

type THorizonsEntry = {
  readonly horizons: string;
  readonly toleranceKm: number;
  readonly samples: readonly THorizonsSample[];
};

type THorizonsFixture = Record<string, THorizonsEntry>;

const fixture: THorizonsFixture = horizons;

const circular = (over: Partial<TKeplerianElements> = {}): TKeplerianElements => ({
  semiMajorAxis: 1,
  eccentricity: 0,
  inclination: 0,
  ascendingNode: 0,
  argumentOfPerihelion: 0,
  meanAnomaly: 0,
  ...over,
});

describe("propagate", () => {
  it("puts a star at the origin", () => {
    const star: TBody = { kind: EBodyKind.Star, id: "sun", name: "Sun" };
    expect(propagate(star, J2000)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("puts a star at the origin at any date", () => {
    const star: TBody = { kind: EBodyKind.Star, id: "sun", name: "Sun" };
    expect(propagate(star, J2000 + 12345)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("returns the position of an orbiter's elements at the given date", () => {
    const body: TBody = {
      kind: EBodyKind.Planet,
      id: "test",
      name: "Test",
      orbit: { parent: "sun", elementsAt: () => circular({ semiMajorAxis: 4 }) },
    };
    expect(propagate(body, J2000)).toEqual(position(circular({ semiMajorAxis: 4 })));
  });

  it("passes the date through to the orbit's elements", () => {
    const seen: number[] = [];
    const body: TBody = {
      kind: EBodyKind.Planet,
      id: "test",
      name: "Test",
      orbit: {
        parent: "sun",
        elementsAt: (jd) => {
          seen.push(jd);
          return circular();
        },
      },
    };
    propagate(body, 2461301.5);
    expect(seen).toEqual([2461301.5]);
  });

  it("puts earth about one au from the sun at J2000", () => {
    const earth = solar.find((body) => body.id === "earth");
    if (!earth) throw new Error("no earth");
    const p = propagate(earth, J2000);
    expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1, 1);
  });

  it("puts each planet within a few percent of its known semi-major axis at J2000", () => {
    const expected: Record<string, number> = {
      mercury: 0.387,
      venus: 0.723,
      earth: 1.0,
      mars: 1.524,
      jupiter: 5.203,
      saturn: 9.537,
      uranus: 19.191,
      neptune: 30.069,
    };
    for (const [id, axis] of Object.entries(expected)) {
      const body = solar.find((b) => b.id === id);
      if (!body) throw new Error(`no ${id}`);
      const p = propagate(body, J2000);
      const r = Math.hypot(p.x, p.y, p.z);
      expect(r).toBeGreaterThan(axis * (1 - 0.3));
      expect(r).toBeLessThan(axis * (1 + 0.3));
    }
  });

  for (const [id, entry] of Object.entries(fixture)) {
    it(`matches the Horizons vectors for ${id}`, () => {
      const body = solar.find((candidate) => candidate.id === id);
      if (!body) throw new Error(`no ${id}`);
      for (const sample of entry.samples) {
        const p = propagate(body, sample.jd);
        const errorKm =
          Math.hypot(p.x - sample.x, p.y - sample.y, p.z - sample.z) * KM_PER_AU;
        console.log(`${id} jd ${sample.jd} error ${errorKm.toFixed(0)} km`);
        expect(errorKm).toBeLessThan(entry.toleranceKm);
      }
    });
  }

  it("keeps every planet close to the ecliptic plane", () => {
    for (const body of solar) {
      if (body.kind === EBodyKind.Star) continue;
      const p = propagate(body, J2000);
      const r = Math.hypot(p.x, p.y, p.z);
      expect(Math.abs(p.z) / r).toBeLessThan(0.13);
    }
  });
});
