import { describe, expect, it } from "vitest";

import { DISTANCE_SCALE } from "../constants/scale";
import { toScene } from "./toScene";

describe("toScene", () => {
  it("leaves the origin at the origin", () => {
    expect(toScene({ x: 0, y: 0, z: 0 }).toArray()).toEqual([0, 0, 0]);
  });

  it("sends ecliptic north to scene up", () => {
    expect(toScene({ x: 0, y: 0, z: 1 }).toArray()).toEqual([0, DISTANCE_SCALE, 0]);
  });

  it("keeps the ecliptic x axis as scene x", () => {
    expect(toScene({ x: 1, y: 0, z: 0 }).toArray()).toEqual([DISTANCE_SCALE, 0, 0]);
  });

  it("sends the ecliptic y axis to negative scene z", () => {
    expect(toScene({ x: 0, y: 1, z: 0 }).toArray()).toEqual([0, 0, -DISTANCE_SCALE]);
  });

  it("scales every component by the distance scale", () => {
    expect(toScene({ x: 2, y: 3, z: 4 }).toArray()).toEqual([
      2 * DISTANCE_SCALE,
      4 * DISTANCE_SCALE,
      -3 * DISTANCE_SCALE,
    ]);
  });

  it("preserves length up to the distance scale", () => {
    const v = { x: 1, y: 2, z: 3 };
    expect(toScene(v).length()).toBeCloseTo(Math.hypot(1, 2, 3) * DISTANCE_SCALE, 10);
  });
});
