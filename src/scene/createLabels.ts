import type { Mesh, PerspectiveCamera } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { TBody } from "../types/body";

import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { LABEL_CLASS } from "../constants/labels";
import { push } from "../state/queue";
import { focusAction } from "./focusAction";

export function createLabels(
  bodies: readonly TBody[],
  meshes: ReadonlyMap<string, Mesh>,
  camera: PerspectiveCamera,
  controls: OrbitControls,
): ReadonlyMap<string, CSS2DObject> {
  return new Map(
    bodies.flatMap((body) => {
      const mesh = meshes.get(body.id);
      if (!mesh) return [];

      const element = document.createElement("div");
      element.className = LABEL_CLASS;
      element.dataset.bodyId = body.id;
      element.textContent = body.name;
      element.addEventListener("click", () =>
        push(focusAction(body.id, camera, controls)),
      );

      const label = new CSS2DObject(element);
      label.center.set(0.5, 1);
      mesh.add(label);

      return [[body.id, label] as const];
    }),
  );
}
