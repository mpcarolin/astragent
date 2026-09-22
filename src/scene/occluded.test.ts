import { describe, expect, it } from "vitest";

import { STAR_RADIUS } from "../constants/scale";
import { occluded } from "./occluded";

const SUN = { x: 0, y: 0, z: 0 };
const CAMERA = { x: 0, y: 0, z: 100 };

describe("occluded", () => {
  it("hides a body directly behind the sun", () => {
    expect(occluded({ x: 0, y: 0, z: -50 }, SUN, CAMERA, STAR_RADIUS)).toBe(true);
  });

  it("shows a body in front of the sun", () => {
    expect(occluded({ x: 0, y: 0, z: 50 }, SUN, CAMERA, STAR_RADIUS)).toBe(false);
  });

  it("shows a body well to the side of the sun", () => {
    expect(occluded({ x: 60, y: 0, z: -50 }, SUN, CAMERA, STAR_RADIUS)).toBe(false);
  });

  it("shows a body on the far side of the camera from the sun", () => {
    expect(occluded({ x: 0, y: 0, z: 140 }, SUN, CAMERA, STAR_RADIUS)).toBe(false);
  });

  it("shows a body nearer the camera than the sun, even dead on the sun line", () => {
    expect(occluded({ x: 0, y: 0, z: 40 }, SUN, CAMERA, STAR_RADIUS)).toBe(false);
  });

  it("shows a distant body just beyond the camera along the anti-sun direction", () => {
    const camera = { x: 297, y: -7, z: -14 };
    expect(occluded({ x: 298.5, y: -6.8, z: -14.7 }, SUN, camera, STAR_RADIUS)).toBe(false);
  });

  it("shows the sun itself", () => {
    expect(occluded(SUN, SUN, CAMERA, STAR_RADIUS)).toBe(false);
  });

  it("hides a body grazing the sun's disc", () => {
    expect(occluded({ x: STAR_RADIUS / 2, y: 0, z: -50 }, SUN, CAMERA, STAR_RADIUS)).toBe(true);
  });

  it("widens the shadow cone with distance beyond the sun", () => {
    const near = { x: STAR_RADIUS * 1.4, y: 0, z: -1 };
    const far = { x: STAR_RADIUS * 1.4, y: 0, z: -400 };
    expect(occluded(near, SUN, CAMERA, STAR_RADIUS)).toBe(false);
    expect(occluded(far, SUN, CAMERA, STAR_RADIUS)).toBe(true);
  });

  it("scales the hidden cone with the sun's radius", () => {
    const body = { x: 4, y: 0, z: -50 };
    expect(occluded(body, SUN, CAMERA, STAR_RADIUS)).toBe(false);
    expect(occluded(body, SUN, CAMERA, STAR_RADIUS * 20)).toBe(true);
  });
});
