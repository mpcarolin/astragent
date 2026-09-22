import type { PerspectiveCamera } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { TFocusAction } from "../types/action";

import { EActionKind } from "../types/action";

export function focusAction(
  targetId: string,
  camera: PerspectiveCamera,
  controls: OrbitControls,
): TFocusAction {
  return {
    kind: EActionKind.Focus,
    targetId,
    startedAt: performance.now(),
    from: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    fromTarget: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
  };
}
