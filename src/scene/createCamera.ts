import { PerspectiveCamera } from "three";

export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.01,
    500,
  );
  camera.position.set(0, 1, 150);
  camera.lookAt(0, 0, 0);
  return camera;
}
