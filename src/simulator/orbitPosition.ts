import { ECCENTRICITY, ORBIT_MS_PER_RADIAN } from "../constants/orbit";
import type { Vec3 } from "../types/vec3";

export function orbitPosition(
  time: DOMHighResTimeStamp,
  { radius, incline, speed }: { radius: number; incline: number; speed: number },
): Vec3 {
  const theta = (time * speed) / ORBIT_MS_PER_RADIAN;
  return {
    x: radius * Math.cos(theta),
    y: incline * Math.cos(theta),
    z: radius * ECCENTRICITY * Math.sin(theta),
  };
}
