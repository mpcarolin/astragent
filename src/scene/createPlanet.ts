import type { Texture } from "three";
import type { TAppearance } from "../types/appearance";

import { Mesh, MeshStandardMaterial, SphereGeometry } from "three";

import { SEGMENTS_HEIGHT, SEGMENTS_WIDTH } from "../constants/scale";
import { UNTINTED } from "../constants/textures";
import { radius } from "./radius";

export function createPlanet(look: TAppearance, map: Texture | null): Mesh {
  const { color } = look;
  return new Mesh(
    new SphereGeometry(radius(look), SEGMENTS_WIDTH, SEGMENTS_HEIGHT),
    new MeshStandardMaterial({
      color: map ? UNTINTED : color,
      map,
      roughness: 1,
      metalness: 0,
    }),
  );
}
