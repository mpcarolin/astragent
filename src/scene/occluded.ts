import type { TVec3 } from "../types/vec3";

import { LABEL_MIN_DISTANCE, OCCLUSION_MARGIN } from "../constants/labels";

export function occluded(
  body: TVec3,
  sun: TVec3,
  camera: TVec3,
  sunRadius: number,
): boolean {
  const toSun = { x: sun.x - camera.x, y: sun.y - camera.y, z: sun.z - camera.z };
  const toBody = { x: body.x - camera.x, y: body.y - camera.y, z: body.z - camera.z };
  const fromSun = { x: body.x - sun.x, y: body.y - sun.y, z: body.z - sun.z };

  const sunDistance = Math.hypot(toSun.x, toSun.y, toSun.z);
  const bodyDistance = Math.hypot(toBody.x, toBody.y, toBody.z);
  const fromSunDistance = Math.hypot(fromSun.x, fromSun.y, fromSun.z);
  if (sunDistance < LABEL_MIN_DISTANCE || bodyDistance < LABEL_MIN_DISTANCE) return false;

  const behind =
    (fromSun.x * toSun.x + fromSun.y * toSun.y + fromSun.z * toSun.z) / sunDistance;
  if (behind <= 0) return false;

  const offset = Math.sqrt(Math.max(0, fromSunDistance ** 2 - behind ** 2));
  return offset <= sunRadius * OCCLUSION_MARGIN * (1 + behind / sunDistance);
}
