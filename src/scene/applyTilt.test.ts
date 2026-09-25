import { describe, expect, it } from "vitest";

import type { TVec3 } from "../types/vec3";

import { Object3D, Vector3 } from "three";

import { applyTilt } from "./applyTilt";

const earthPole: TVec3 = { x: 0, y: 0.397777, z: 0.917482 };
const earthPoleInScene: TVec3 = { x: 0, y: 0.917482, z: -0.397777 };
const offAxisPole: TVec3 = { x: 0.446155, y: -0.055516, z: 0.893232 };
const offAxisInScene: TVec3 = { x: 0.446155, y: 0.893232, z: 0.055516 };

function tilted(pole: TVec3): Object3D {
  const planet = new Object3D();
  applyTilt(planet, pole);
  return planet;
}

function expectAlong(actual: Vector3, expected: TVec3): void {
  expect(actual.x).toBeCloseTo(expected.x, 6);
  expect(actual.y).toBeCloseTo(expected.y, 6);
  expect(actual.z).toBeCloseTo(expected.z, 6);
}

describe("applyTilt", () => {
  it("points local +Y along the pole in scene axes", () => {
    expectAlong(new Vector3(0, 1, 0).applyQuaternion(tilted(earthPole).quaternion), earthPoleInScene);
  });

  it("points local +Y along a pole off every axis", () => {
    expectAlong(new Vector3(0, 1, 0).applyQuaternion(tilted(offAxisPole).quaternion), offAxisInScene);
  });
});
