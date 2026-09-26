import type { TLocated } from "../types/located";

import { describe, expect, it } from "vitest";

import { ZOOM_FACTOR } from "../constants/focus";
import { DISTANCE_SCALE, STAR_RADIUS } from "../constants/scale";
import { solar } from "../data/solar";
import { vantage } from "../utils/vantage";
import { appearance } from "./appearance";
import { destination } from "./destination";
import { radius } from "./radius";
import { toScene } from "./toScene";

const bodyOf = (id: string) => {
  const body = solar.find((candidate) => candidate.id === id);
  if (!body) {
    throw new Error(`no body for ${id}`);
  }
  return body;
};

const lookOf = (id: string) => {
  const look = appearance[id];
  if (!look) {
    throw new Error(`no appearance for ${id}`);
  }
  return look;
};

describe("destination", () => {
  it("sends the sun to its own vantage at the drawn star radius", () => {
    const star: TLocated = { body: bodyOf("sun"), position: { x: 12, y: -4, z: 7 } };
    const expected = toScene(
      vantage({ planet: star.position, sun: star.position, radius: STAR_RADIUS / DISTANCE_SCALE }),
    );
    expect(destination(star, star, lookOf("sun")).equals(expected)).toBe(true);
  });

  it("lands the sun STAR_RADIUS times ZOOM_FACTOR scene units away", () => {
    const star: TLocated = { body: bodyOf("sun"), position: { x: 12, y: -4, z: 7 } };
    const distance = destination(star, star, lookOf("sun")).distanceTo(toScene(star.position));
    expect(distance).toBeCloseTo(STAR_RADIUS * ZOOM_FACTOR, 9);
  });

  it("sends earth to the same vantage the 1A formula used", () => {
    const star: TLocated = { body: bodyOf("sun"), position: { x: 0, y: 0, z: 0 } };
    const target: TLocated = { body: bodyOf("earth"), position: { x: 1, y: 0, z: 0 } };
    const look = lookOf("earth");
    const expected = toScene(
      vantage({
        planet: target.position,
        sun: star.position,
        radius: radius(look.radiusKm) / DISTANCE_SCALE,
      }),
    );
    expect(destination(target, star, look).equals(expected)).toBe(true);
  });

  it("does not mutate its inputs", () => {
    const star: TLocated = { body: bodyOf("sun"), position: { x: 0, y: 0, z: 0 } };
    const target: TLocated = { body: bodyOf("earth"), position: { x: 1, y: 0, z: 0 } };

    destination(target, star, lookOf("earth"));
    destination(star, star, lookOf("sun"));

    expect(star.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(target.position).toEqual({ x: 1, y: 0, z: 0 });
  });
});
