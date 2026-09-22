import type { Texture } from "three";
import type { TAppearance } from "../types/appearance";

import { Mesh, MeshBasicMaterial, PointLight, SphereGeometry } from "three";

import { COLOR, DECAY, INTENSITY } from "../constants/light";
import { SEGMENTS_HEIGHT, SEGMENTS_WIDTH, STAR_RADIUS } from "../constants/scale";
import { UNTINTED } from "../constants/textures";

export function createStar({ color }: TAppearance, map: Texture | null): Mesh {
  const star = new Mesh(
    new SphereGeometry(STAR_RADIUS, SEGMENTS_WIDTH, SEGMENTS_HEIGHT),
    new MeshBasicMaterial({ color: map ? UNTINTED : color, map }),
  );

  const light = new PointLight(COLOR, INTENSITY, 0, DECAY);
  star.add(light);

  return star;
}
