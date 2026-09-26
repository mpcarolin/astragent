import type { Mesh, Object3D, PerspectiveCamera } from "three";
import type { TLocated } from "../types/located";

import { EBodyKind } from "../types/body";

import { STAR_RADIUS } from "../constants/scale";
import { occluded } from "./occluded";

type THideOccludedParams = {
  readonly names: ReadonlyMap<string, Object3D>;
  readonly meshes: ReadonlyMap<string, Mesh>;
  readonly located: readonly TLocated[];
  readonly camera: PerspectiveCamera;
};

export function hideOccluded(params: THideOccludedParams): void {
  const { names, meshes, located, camera } = params;

  const star = located.find(({ body }) => body.kind === EBodyKind.Star);
  const starMesh = star && meshes.get(star.body.id);
  if (!starMesh) {
    return;
  }

  names.forEach((name, id) => {
    const mesh = meshes.get(id);
    if (!mesh) {
      return;
    }
    name.visible = !occluded({
      body: mesh.position,
      sun: starMesh.position,
      camera: camera.position,
      sunRadius: STAR_RADIUS,
    });
  });
}
