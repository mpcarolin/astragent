import type { TRingAppearance, TRingRadius } from "../types/appearance";

import { radius } from "./radius";

export function ringRadius({ innerRadiusKm, outerRadiusKm }: TRingAppearance): TRingRadius {
  return {
    inner: radius(innerRadiusKm),
    outer: radius(outerRadiusKm),
  };
}
