import type { Object3D } from "three";
import type { TVec3 } from "../types/vec3";

import { Vector3 } from "three";
import { toScene } from "./toScene";

export function applyTilt(planet: Object3D, pole: TVec3): void {
  const up = new Vector3(0, 1, 0);
  planet.quaternion.setFromUnitVectors(up, toScene(pole).normalize());
}
