import type { Mesh, PerspectiveCamera } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { TBody } from "../types/body";

import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { LABEL_CLASS } from "../constants/labels";
import { dispatch } from "../state/queue";
import { createFocusAction } from "./createFocusAction";

type TCreateNamesParams = {
  readonly bodies: readonly TBody[];
  readonly meshes: ReadonlyMap<string, Mesh>;
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;
};

export function createNames(params: TCreateNamesParams): ReadonlyMap<string, CSS2DObject> {
  const { bodies, meshes, camera, controls } = params;

  return new Map(
    bodies.flatMap((body) => {
      const mesh = meshes.get(body.id);
      if (!mesh) {
        return [];
      }

      const element = document.createElement("p");
      element.className = LABEL_CLASS;
      element.dataset.bodyId = body.id;
      element.textContent = body.name;
      element.addEventListener("click", () =>
        dispatch(createFocusAction(body.id, camera, controls)),
      );

      const name = new CSS2DObject(element);
      name.center.set(0.5, 1);
      mesh.add(name);

      return [[body.id, name] as const];
    }),
  );
}
