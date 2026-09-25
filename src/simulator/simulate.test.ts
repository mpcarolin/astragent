import { describe, expect, it } from "vitest";

import type { TBody } from "../types/body";
import type { TKeplerianElements } from "../types/elements";
import type { TState } from "../types/state";

import { EBodyKind } from "../types/body";

import { J2000 } from "../constants/astronomy";
import { solar } from "../data/solar";
import { propagate } from "./propagate";
import { simulate } from "./simulate";

const fixed = (elements: Partial<TKeplerianElements>): TKeplerianElements => ({
  semiMajorAxis: 1,
  eccentricity: 0,
  inclination: 0,
  ascendingNode: 0,
  argumentOfPerihelion: 0,
  meanAnomaly: 0,
  ...elements,
});

const at = (date: number): TState => ({ date, rate: 0, focus: null, pointer: null });

const sun: TBody = { kind: EBodyKind.Star, id: "sun", name: "Sun" };

const orbiter = (id: string, parent: string, semiMajorAxis: number): TBody => ({
  kind: EBodyKind.Planet,
  id,
  name: id,
  orbit: { parent, elementsAt: () => fixed({ semiMajorAxis }) },
});

describe("simulate", () => {
  it("puts the star at the origin", () => {
    const located = simulate([sun], at(J2000));
    expect(located[0]!.position).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("returns one entry per body in input order", () => {
    const located = simulate(solar, at(J2000));
    expect(located.map((l) => l.body.id)).toEqual(solar.map((b) => b.id));
  });

  it("carries each body through alongside its position", () => {
    const located = simulate([sun], at(J2000));
    expect(located[0]!.body).toBe(sun);
  });

  it("puts a planet around a star at its propagated offset", () => {
    const planet = orbiter("planet", "sun", 3);
    const located = simulate([sun, planet], at(J2000));
    expect(located[1]!.position).toEqual(propagate(planet, J2000));
  });

  it("puts a moon at its planet's position plus its own offset", () => {
    const planet = orbiter("planet", "sun", 3);
    const moon = orbiter("moon", "planet", 0.5);
    const located = simulate([sun, planet, moon], at(J2000));
    expect(located[2]!.position.x).toBeCloseTo(3.5, 10);
    expect(located[2]!.position.y).toBeCloseTo(0, 10);
    expect(located[2]!.position.z).toBeCloseTo(0, 10);
  });

  it("resolves a parent that appears after the child in the list", () => {
    const planet = orbiter("planet", "sun", 3);
    const moon = orbiter("moon", "planet", 0.5);
    const located = simulate([moon, planet, sun], at(J2000));
    expect(located[0]!.position.x).toBeCloseTo(3.5, 10);
  });

  it("throws when a parent id is not in the list", () => {
    const orphan = orbiter("orphan", "nowhere", 1);
    expect(() => simulate([sun, orphan], at(J2000))).toThrow();
  });

  it("names the missing parent in the error", () => {
    const orphan = orbiter("orphan", "nowhere", 1);
    expect(() => simulate([sun, orphan], at(J2000))).toThrow(/nowhere/);
  });

  it("advances the planets between two dates", () => {
    const before = simulate(solar, at(J2000));
    const after = simulate(solar, at(J2000 + 100));
    expect(after[3]!.position.x).not.toBeCloseTo(before[3]!.position.x, 6);
  });
});
