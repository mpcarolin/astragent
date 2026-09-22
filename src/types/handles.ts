import type { Mesh, Scene } from "three";

export type THandles = {
  readonly scene: Scene;
  readonly bodies: ReadonlyMap<string, Mesh>;
};
