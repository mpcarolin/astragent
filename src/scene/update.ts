import type { Mesh } from "three";
import type { TLocated } from "../types/located";

import { toScene } from "./toScene";

export function update(meshes: ReadonlyMap<string, Mesh>, located: readonly TLocated[]): void {
  located.forEach(({ body, position }) => {
    const mesh = meshes.get(body.id);
    if (!mesh) return;
    mesh.position.copy(toScene(position));
  });
}
