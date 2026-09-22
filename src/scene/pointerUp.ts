import type { Mesh, PerspectiveCamera } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { TPointerUpAction } from "../types/action";

import { EActionKind } from "../types/action";

import { focusAction } from "./focusAction";
import { pick } from "./pick";

export function pointerUp(
  event: PointerEvent,
  camera: PerspectiveCamera,
  controls: OrbitControls,
  meshes: ReadonlyMap<string, Mesh>,
): TPointerUpAction {
  const hit = pick(event, camera, meshes);

  if (!hit) {
    return { kind: EActionKind.PointerUp, x: event.clientX, y: event.clientY, focus: null };
  }

  const { kind, ...focus } = focusAction(hit, camera, controls);

  return { kind: EActionKind.PointerUp, x: event.clientX, y: event.clientY, focus };
}
