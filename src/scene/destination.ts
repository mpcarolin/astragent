import type { Vector3 } from "three";
import type { TAppearance } from "../types/appearance";
import type { TLocated } from "../types/located";

import { EBodyKind } from "../types/body";

import { DISTANCE_SCALE, STAR_RADIUS } from "../constants/scale";
import { vantage } from "../utils/vantage";
import { radius } from "./radius";
import { toScene } from "./toScene";

export function destination(target: TLocated, star: TLocated, look: TAppearance): Vector3 {
  const size = target.body.kind === EBodyKind.Star ? STAR_RADIUS : radius(look.radiusKm);
  return toScene(
    vantage({ planet: target.position, sun: star.position, radius: size / DISTANCE_SCALE }),
  );
}
