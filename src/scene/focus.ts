import type { PerspectiveCamera } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { TLocated } from "../types/located";
import type { TState } from "../types/state";

import { EBodyKind } from "../types/body";

import { Vector3 } from "three";
import { MIN_DISTANCE, ZOOM_FLOOR } from "../constants/controls";
import { DURATION_MS } from "../constants/focus";
import { ease } from "../utils/ease";
import { isFocusComplete } from "../utils/isFocusComplete";
import { appearance } from "./appearance";
import { destination } from "./destination";
import { extent } from "./extent";
import { overview } from "./overview";
import { toScene } from "./toScene";

type TFocusParams = {
  readonly state: TState;
  readonly located: readonly TLocated[];
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly now: number;
  readonly previous: number;
};

const origin = new Vector3();
const originTarget = new Vector3();
const delta = new Vector3();

export function focus(params: TFocusParams): void {
  const { state, located, camera, controls, now, previous } = params;
  const flight = state.focus;

  const star = located.find(({ body }) => body.kind === EBodyKind.Star);
  const target =
    flight.targetId === null ? star : located.find(({ body }) => body.id === flight.targetId);
  const look = target && appearance[target.body.id];
  if (!target || !star || !look) {
    return;
  }

  controls.minDistance = Math.max(MIN_DISTANCE, extent(target.body, look) * ZOOM_FLOOR);

  if (isFocusComplete(flight, previous) && isFocusComplete(flight, now)) {
    delta.copy(toScene(target.position)).sub(controls.target);
    camera.position.add(delta);
    controls.target.add(delta);
    return;
  }

  const k = ease(Math.min(1, (now - flight.startedAt) / DURATION_MS));
  camera.position.lerpVectors(
    origin.set(flight.from.x, flight.from.y, flight.from.z),
    flight.targetId === null ? overview(star) : destination(target, star, look),
    k,
  );
  controls.target.lerpVectors(
    originTarget.set(flight.fromTarget.x, flight.fromTarget.y, flight.fromTarget.z),
    toScene(target.position),
    k,
  );
  camera.lookAt(controls.target);
}
