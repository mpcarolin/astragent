import { KM_PER_AU } from "../constants/astronomy";
import { RADIUS_SCALE } from "../constants/scale";

export function radius(radiusKm: number): number {
  return (radiusKm / KM_PER_AU) * RADIUS_SCALE;
}
