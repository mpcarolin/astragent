import type { TAppearance } from "../types/appearance";

import { Mesh, MeshBasicMaterial, PointLight, SphereGeometry } from "three";

import { COLOR, DECAY, INTENSITY } from "../constants/light";
import { SEGMENTS_HEIGHT, SEGMENTS_WIDTH, STAR_RADIUS } from "../constants/scale";

export function createStar({ color }: TAppearance): Mesh {
  const star = new Mesh(
    new SphereGeometry(STAR_RADIUS, SEGMENTS_WIDTH, SEGMENTS_HEIGHT),
    new MeshBasicMaterial({ color }),
  );

  const light = new PointLight(COLOR, INTENSITY, 0, DECAY);
  star.add(light);

  return star;
}
