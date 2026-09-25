import type { TAppearance } from "../types/appearance";

import { Mesh, MeshBasicMaterial, PointLight, SphereGeometry } from "three";

import { COLOR, DECAY, INTENSITY } from "../constants/light";
import { SEGMENTS_HEIGHT, SEGMENTS_WIDTH, STAR_RADIUS } from "../constants/scale";
import { UNTINTED } from "../constants/textures";
import { loadTexture } from "./loadTexture";

export async function createStar(look: TAppearance): Promise<Mesh> {
  const map = await loadTexture(look.texture);
  const star = new Mesh(
    new SphereGeometry(STAR_RADIUS, SEGMENTS_WIDTH, SEGMENTS_HEIGHT),
    new MeshBasicMaterial({ color: map ? UNTINTED : look.color, map }),
  );

  const light = new PointLight(COLOR, INTENSITY, 0, DECAY);
  star.add(light);

  return star;
}
