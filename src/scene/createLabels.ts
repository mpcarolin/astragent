import type { Mesh, PerspectiveCamera, Scene } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { TBody } from "../types/body";
import type { TLabels } from "../types/handles";

import { createBubble } from "./createBubble";
import { createNames } from "./createNames";

type TCreateLabelsParams = {
  readonly scene: Scene;
  readonly bodies: readonly TBody[];
  readonly meshes: ReadonlyMap<string, Mesh>;
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;
};

export function createLabels(params: TCreateLabelsParams): TLabels {
  const { scene, bodies, meshes, camera, controls } = params;

  return {
    names: createNames({ bodies, meshes, camera, controls }),
    bubble: createBubble(scene, camera, controls),
  };
}
