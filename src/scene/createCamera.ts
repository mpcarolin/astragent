import { PerspectiveCamera } from "three";

import { FAR, FOV, NEAR, START_POSITION } from "../constants/camera";

export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    FOV,
    window.innerWidth / window.innerHeight,
    NEAR,
    FAR,
  );
  camera.position.set(START_POSITION.x, START_POSITION.y, START_POSITION.z);
  camera.lookAt(0, 0, 0);
  return camera;
}
