import type { Mesh, PerspectiveCamera } from "three";
import type { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

import { STAR_RADIUS } from "../constants/scale";
import { occluded } from "./occluded";

export function reveal(
  labels: ReadonlyMap<string, CSS2DObject>,
  meshes: ReadonlyMap<string, Mesh>,
  starId: string,
  camera: PerspectiveCamera,
): void {
  const star = meshes.get(starId);
  if (!star) return;

  labels.forEach((label, id) => {
    const mesh = meshes.get(id);
    if (!mesh) return;
    label.visible = !occluded(mesh.position, star.position, camera.position, STAR_RADIUS);
  });
}
