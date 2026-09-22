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

  const sunDistance = Math.hypot(toSun.x, toSun.y, toSun.z);
  const bodyDistance = Math.hypot(toBody.x, toBody.y, toBody.z);
  if (sunDistance < LABEL_MIN_DISTANCE || bodyDistance < LABEL_MIN_DISTANCE) return false;

  const along =
    (toBody.x * toSun.x + toBody.y * toSun.y + toBody.z * toSun.z) / sunDistance;
  if (along <= sunDistance) return false;

  const offset = Math.sqrt(Math.max(0, bodyDistance ** 2 - along ** 2));
  return offset <= sunRadius * OCCLUSION_MARGIN * (along / sunDistance);
}
