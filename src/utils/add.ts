import type { TVec3 } from "../types/vec3";

export function add(a: TVec3, b: TVec3): TVec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
