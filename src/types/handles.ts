import type { Mesh, Scene } from "three";
import type { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

export type THandles = {
  readonly scene: Scene;
  readonly bodies: ReadonlyMap<string, Mesh>;
};

export type TLabels = {
  readonly names: ReadonlyMap<string, CSS2DObject>;
  readonly bubble: CSS2DObject;
};
