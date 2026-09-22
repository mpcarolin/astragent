import { AmbientLight } from "three";

import { AMBIENT_COLOR, AMBIENT_INTENSITY } from "../constants/light";

export function createAmbient(): AmbientLight {
  return new AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY);
}
