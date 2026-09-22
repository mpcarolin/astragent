import type { TVec3 } from "../types/vec3";

import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineLoop } from "three";

import { ORBIT_COLOR, ORBIT_OPACITY } from "../constants/annotations";
import { toScene } from "./toScene";

const COMPONENTS = 3;

export function createOrbitLines(points: readonly TVec3[]): LineLoop {
  const vertices = new Float32Array(points.length * COMPONENTS);

  points.forEach((point, k) => {
    const { x, y, z } = toScene(point);
    const offset = k * COMPONENTS;
    vertices[offset] = x;
    vertices[offset + 1] = y;
    vertices[offset + 2] = z;
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(vertices, COMPONENTS));

  const material = new LineBasicMaterial({
    color: ORBIT_COLOR,
    transparent: true,
    opacity: ORBIT_OPACITY,
    depthWrite: false,
    toneMapped: false,
  });

  return new LineLoop(geometry, material);
}
