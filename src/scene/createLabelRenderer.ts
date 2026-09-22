import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

export function createLabelRenderer(): CSS2DRenderer {
  const renderer = new CSS2DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.id = "labels";
  document.body.appendChild(renderer.domElement);
  return renderer;
}
