import type { Mesh, PerspectiveCamera } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { TPointerUpAction } from "../types/action";

import { EActionKind } from "../types/action";

import { focusAction } from "./focusAction";
import { pick } from "./pick";

type TPointerUpParams = {
  readonly event: PointerEvent;
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly meshes: ReadonlyMap<string, Mesh>;
};

export function pointerUp(params: TPointerUpParams): TPointerUpAction {
  const { event, camera, controls, meshes } = params;
  const hit = pick(event, camera, meshes);

  if (!hit) {
    return { kind: EActionKind.PointerUp, x: event.clientX, y: event.clientY, focus: null };
  }

  const { kind, ...focus } = focusAction(hit, camera, controls);

  return { kind: EActionKind.PointerUp, x: event.clientX, y: event.clientY, focus };
}
