import type { Vector3 } from "three";
import type { TLocated } from "../types/located";

import { START_POSITION } from "../constants/camera";
import { toScene } from "./toScene";

export function overview(star: TLocated): Vector3 {
  return toScene(star.position).add(START_POSITION);
}
