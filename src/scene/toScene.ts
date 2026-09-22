import type { TVec3 } from "../types/vec3";

import { Vector3 } from "three";
import { DISTANCE_SCALE } from "../constants/scale";

export function toScene(v: TVec3): Vector3 {
  return new Vector3(v.x, v.z, -v.y).multiplyScalar(DISTANCE_SCALE);
}
