import type { TAppearance } from "../types/appearance";

import { radius } from "./radius";
import { loadTexture } from "./loadTexture";
import { UNTINTED } from "../constants/textures";
import { SEGMENTS_HEIGHT, SEGMENTS_WIDTH } from "../constants/scale";
import { Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { applyTilt } from "./applyTilt";
import { createRing } from "./createRing";

export async function createPlanet(appearance: TAppearance): Promise<Mesh> {
  const map = await loadTexture(appearance.texture);
  const { color, ring, pole } = appearance;
  const planet = new Mesh(
    new SphereGeometry(radius(appearance.radiusKm), SEGMENTS_WIDTH, SEGMENTS_HEIGHT),
    new MeshStandardMaterial({
      color: map ? UNTINTED : color,
      map,
      roughness: 1,
      metalness: 0,
    }),
  );

  if (pole) {
    applyTilt(planet, pole);
  }

  if (ring) {
    planet.add(await createRing(ring));
  }

  return planet;
}
