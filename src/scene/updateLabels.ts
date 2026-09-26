import type { Mesh, PerspectiveCamera } from "three";
import type { TLabels } from "../types/handles";
import type { TLocated } from "../types/located";
import type { TState } from "../types/state";

import { hideOccluded } from "./hideOccluded";
import { placeBubble } from "./placeBubble";

type TUpdateLabelsParams = {
  readonly labels: TLabels;
  readonly state: TState;
  readonly located: readonly TLocated[];
  readonly meshes: ReadonlyMap<string, Mesh>;
  readonly camera: PerspectiveCamera;
  readonly now: number;
};

export function updateLabels(params: TUpdateLabelsParams): void {
  const { labels, state, located, meshes, camera, now } = params;

  hideOccluded({ names: labels.names, meshes, located, camera });
  placeBubble({ bubble: labels.bubble, state, located, camera, now });
}
