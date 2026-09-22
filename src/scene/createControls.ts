import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { PerspectiveCamera } from "three";
import { DAMPING, MAX_DISTANCE, MIN_DISTANCE } from "../constants/controls";

export function createControls(
  camera: PerspectiveCamera,
  canvas: HTMLCanvasElement,
): OrbitControls {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = DAMPING;
  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = MAX_DISTANCE;
  controls.target.set(0, 0, 0);
  controls.update();
  return controls;
}
