import { describe, expect, it } from "vitest";

import { KM_PER_AU } from "../constants/astronomy";
import { RADIUS_SCALE, STAR_RADIUS } from "../constants/scale";
import { solar } from "../data/solar";
import { appearance } from "./appearance";
import { extent } from "./extent";

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

describe("extent", () => {
  it("gives the star its fixed scene radius", () => {
    expect(extent(bodyOf("sun"), lookOf("sun"))).toBe(STAR_RADIUS);
  });

  it("gives a ringed body the outer ring radius", () => {
    const saturn = lookOf("saturn");
    const outerRadiusKm = saturn.ring?.outerRadiusKm;
    if (outerRadiusKm === undefined) {
      throw new Error("no saturn ring");
    }
    const expected = (outerRadiusKm / KM_PER_AU) * RADIUS_SCALE;
    expect(extent(bodyOf("saturn"), saturn)).toBeCloseTo(expected, 10);
  });

  it("gives an unringed body its own radius", () => {
    const mars = lookOf("mars");
    const expected = (mars.radiusKm / KM_PER_AU) * RADIUS_SCALE;
    expect(extent(bodyOf("mars"), mars)).toBeCloseTo(expected, 10);
  });
});
