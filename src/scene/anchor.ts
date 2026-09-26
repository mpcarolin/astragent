import type { Quaternion } from "three";

import { Vector3 } from "three";

export function anchor(center: Vector3, orientation: Quaternion, distance: number): Vector3 {
  return center
    .clone()
    .add(new Vector3(1, 0, 0).applyQuaternion(orientation).multiplyScalar(distance));
}
