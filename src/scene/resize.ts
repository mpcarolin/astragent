import type { PerspectiveCamera, WebGLRenderer } from "three";
import type { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

export function resize(
  renderer: WebGLRenderer,
  labels: CSS2DRenderer,
  camera: PerspectiveCamera,
): void {
  renderer.setSize(window.innerWidth, window.innerHeight);
  labels.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
