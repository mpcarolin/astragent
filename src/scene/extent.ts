import type { TAppearance } from "../types/appearance";
import type { TBody } from "../types/body";

import { EBodyKind } from "../types/body";

import { STAR_RADIUS } from "../constants/scale";
import { radius } from "./radius";
import { ringRadius } from "./ringRadius";

export function extent(body: TBody, look: TAppearance): number {
  if (body.kind === EBodyKind.Star) {
    return STAR_RADIUS;
  }
  if (look.ring) {
    return ringRadius(look.ring).outer;
  }
  return radius(look.radiusKm);
}
