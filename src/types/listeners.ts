import type { Mesh, PerspectiveCamera, WebGLRenderer } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

export type TListeners = {
  readonly canvas: HTMLCanvasElement;
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly bodies: ReadonlyMap<string, Mesh>;
  readonly renderer: WebGLRenderer;
  readonly labelRenderer: CSS2DRenderer;
};
