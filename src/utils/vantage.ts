import type { TVec3 } from "../types/vec3";

import { ELEVATION, MIN_APPROACH, PHASE_ANGLE, ZOOM_FACTOR } from "../constants/focus";

const SUNWARD_FALLBACK: TVec3 = { x: -1, y: 0, z: 0 };

export function vantage(
  planet: TVec3,
  sun: TVec3,
  radius: number,
  phase: number = PHASE_ANGLE,
  elevation: number = ELEVATION,
): TVec3 {
  const toSun = {
    x: sun.x - planet.x,
    y: sun.y - planet.y,
    z: sun.z - planet.z,
  };
  const length = Math.hypot(toSun.x, toSun.y, toSun.z);

  const unit =
    length === 0
      ? SUNWARD_FALLBACK
      : { x: toSun.x / length, y: toSun.y / length, z: toSun.z / length };

  const cosine = Math.cos(phase);
  const sine = Math.sin(phase);
  const turned = {
    x: unit.x * cosine - unit.y * sine,
    y: unit.x * sine + unit.y * cosine,
    z: unit.z,
  };

  const lifted = {
    x: turned.x * (1 - elevation),
    y: turned.y * (1 - elevation),
    z: turned.z * (1 - elevation) + elevation,
  };
  const scale = Math.hypot(lifted.x, lifted.y, lifted.z);
  const distance = Math.max(radius * ZOOM_FACTOR, MIN_APPROACH) / scale;

  return {
    x: planet.x + lifted.x * distance,
    y: planet.y + lifted.y * distance,
    z: planet.z + lifted.z * distance,
  };
}
