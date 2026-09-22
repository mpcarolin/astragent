import { describe, expect, it } from "vitest";

import type { TKeplerianElements } from "../types/elements";

import { position } from "./position";

const elements = (over: Partial<TKeplerianElements> = {}): TKeplerianElements => ({
  semiMajorAxis: 1,
  eccentricity: 0,
  inclination: 0,
  ascendingNode: 0,
  argumentOfPerihelion: 0,
  meanAnomaly: 0,
  ...over,
});

describe("position", () => {
  it("keeps a circular orbit at radius a all the way round", () => {
    for (let m = -Math.PI; m <= Math.PI; m += Math.PI / 8) {
      const p = position(elements({ semiMajorAxis: 2.5, meanAnomaly: m }));
      expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(2.5, 10);
    }
  });

  it("puts a circular orbit at perihelion on the positive x axis", () => {
    const p = position(elements({ semiMajorAxis: 3 }));
    expect(p.x).toBeCloseTo(3, 10);
    expect(p.y).toBeCloseTo(0, 10);
    expect(p.z).toBeCloseTo(0, 10);
  });

  it("keeps a zero-inclination orbit entirely in the ecliptic plane", () => {
    for (let m = -Math.PI; m <= Math.PI; m += Math.PI / 8) {
      expect(position(elements({ meanAnomaly: m, eccentricity: 0.4 })).z).toBeCloseTo(0, 12);
    }
  });

  it("places perihelion of an eccentric orbit at a(1 - e)", () => {
    const p = position(elements({ semiMajorAxis: 2, eccentricity: 0.5 }));
    expect(p.x).toBeCloseTo(1, 10);
    expect(p.y).toBeCloseTo(0, 10);
  });

  it("places aphelion of an eccentric orbit at -a(1 + e)", () => {
    const p = position(elements({ semiMajorAxis: 2, eccentricity: 0.5, meanAnomaly: Math.PI }));
    expect(p.x).toBeCloseTo(-3, 10);
    expect(p.y).toBeCloseTo(0, 10);
  });

  it("lifts a quarter orbit entirely into z at ninety degrees inclination", () => {
    const p = position(elements({ inclination: Math.PI / 2, meanAnomaly: Math.PI / 2 }));
    expect(p.x).toBeCloseTo(0, 10);
    expect(p.y).toBeCloseTo(0, 10);
    expect(p.z).toBeCloseTo(1, 10);
  });

  it("rotates perihelion onto the y axis for an ascending node of ninety degrees", () => {
    const p = position(elements({ ascendingNode: Math.PI / 2 }));
    expect(p.x).toBeCloseTo(0, 10);
    expect(p.y).toBeCloseTo(1, 10);
    expect(p.z).toBeCloseTo(0, 10);
  });

  it("rotates perihelion onto the y axis for an argument of perihelion of ninety degrees", () => {
    const p = position(elements({ argumentOfPerihelion: Math.PI / 2 }));
    expect(p.x).toBeCloseTo(0, 10);
    expect(p.y).toBeCloseTo(1, 10);
    expect(p.z).toBeCloseTo(0, 10);
  });

  it("composes node and argument of perihelion into a half turn", () => {
    const p = position(elements({ ascendingNode: Math.PI / 2, argumentOfPerihelion: Math.PI / 2 }));
    expect(p.x).toBeCloseTo(-1, 10);
    expect(p.y).toBeCloseTo(0, 10);
    expect(p.z).toBeCloseTo(0, 10);
  });

  it("tilts a quarter orbit out of plane by the inclination", () => {
    const p = position(elements({ inclination: Math.PI / 6, meanAnomaly: Math.PI / 2 }));
    expect(p.z).toBeCloseTo(Math.sin(Math.PI / 6), 10);
    expect(p.y).toBeCloseTo(Math.cos(Math.PI / 6), 10);
    expect(p.x).toBeCloseTo(0, 10);
  });

  it("puts an eccentric orbit at the semi-minor axis distance when E is a quarter turn", () => {
    const e = 0.6;
    const a = 2;
    const anomaly = Math.PI / 2;
    const p = position(elements({ semiMajorAxis: a, eccentricity: e, meanAnomaly: anomaly - e * Math.sin(anomaly) }));
    expect(p.x).toBeCloseTo(-a * e, 10);
    expect(p.y).toBeCloseTo(a * Math.sqrt(1 - e * e), 10);
  });

  it("keeps an eccentric orbit on its ellipse throughout", () => {
    const a = 3;
    const e = 0.5;
    for (let m = -Math.PI; m <= Math.PI; m += Math.PI / 7) {
      const p = position(elements({ semiMajorAxis: a, eccentricity: e, meanAnomaly: m }));
      const b = a * Math.sqrt(1 - e * e);
      expect(((p.x + a * e) / a) ** 2 + (p.y / b) ** 2).toBeCloseTo(1, 10);
    }
  });
});
