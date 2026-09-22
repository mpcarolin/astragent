import { describe, expect, it } from "vitest";

import type { TVec3 } from "../types/vec3";

import { Line, LineBasicMaterial, LineLoop } from "three";

import { ORBIT_COLOR, ORBIT_OPACITY } from "../constants/annotations";
import { createOrbitLines } from "./createOrbitLines";
import { toScene } from "./toScene";

const points: readonly TVec3[] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0.25 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: -1, z: -0.25 },
];

describe("createOrbitLines", () => {
  it("returns a closed line loop", () => {
    expect(createOrbitLines(points)).toBeInstanceOf(LineLoop);
  });

  it("carries one three-component vertex per point", () => {
    const attribute = createOrbitLines(points).geometry.getAttribute("position");
    expect(attribute.count).toBe(points.length);
    expect(attribute.itemSize).toBe(3);
  });

  it("places each vertex at the scene position of its point", () => {
    const attribute = createOrbitLines(points).geometry.getAttribute("position");

    points.forEach((point, k) => {
      const want = toScene(point);
      expect(attribute.getX(k)).toBeCloseTo(want.x, 6);
      expect(attribute.getY(k)).toBeCloseTo(want.y, 6);
      expect(attribute.getZ(k)).toBeCloseTo(want.z, 6);
    });
  });

  it("uses a faint material that never occludes a planet", () => {
    const { material } = createOrbitLines(points);
    expect(material).toBeInstanceOf(LineBasicMaterial);

    const line = material as LineBasicMaterial;
    expect(line.color.getHex()).toBe(ORBIT_COLOR);
    expect(line.opacity).toBe(ORBIT_OPACITY);
    expect(line.transparent).toBe(true);
    expect(line.depthWrite).toBe(false);
  });

  it("handles an empty point list", () => {
    const attribute = createOrbitLines([]).geometry.getAttribute("position");
    expect(attribute.count).toBe(0);
  });

  it("is a loop rather than an open line", () => {
    const loop = createOrbitLines(points);
    expect(loop).toBeInstanceOf(Line);
    expect(Object.getPrototypeOf(loop)).toBe(LineLoop.prototype);
  });
});
