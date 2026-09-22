import type { Texture } from "three";
import type { TAppearance } from "../types/appearance";

import { Mesh, MeshStandardMaterial, SphereGeometry } from "three";

import { KM_PER_AU } from "../constants/astronomy";
import { RADIUS_SCALE, SEGMENTS_HEIGHT, SEGMENTS_WIDTH } from "../constants/scale";
import { UNTINTED } from "../constants/textures";

export function createPlanet({ color, radiusKm }: TAppearance, map: Texture | null): Mesh {
  const radius = (radiusKm / KM_PER_AU) * RADIUS_SCALE;
  return new Mesh(
    new SphereGeometry(radius, SEGMENTS_WIDTH, SEGMENTS_HEIGHT),
    new MeshStandardMaterial({
      color: map ? UNTINTED : color,
      map,
      roughness: 1,
      metalness: 0,
    }),
  );
}
