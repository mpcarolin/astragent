import type { PerspectiveCamera } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { TLocated } from "../types/located";
import type { TState } from "../types/state";

import { EActionKind } from "../types/action";
import { EBodyKind } from "../types/body";

import { Vector3 } from "three";
import { DURATION_MS } from "../constants/focus";
import { DISTANCE_SCALE } from "../constants/scale";
import { push } from "../state/queue";
import { ease } from "../utils/ease";
import { vantage } from "../utils/vantage";
import { appearance } from "./appearance";
import { radius } from "./radius";
import { toScene } from "./toScene";

const origin = new Vector3();
const originTarget = new Vector3();

export function focus(
  state: TState,
  located: readonly TLocated[],
  camera: PerspectiveCamera,
  controls: OrbitControls,
  now: number,
): void {
  const flight = state.focus;
  if (!flight) return;

  const target = located.find(({ body }) => body.id === flight.targetId);
  const star = located.find(({ body }) => body.kind === EBodyKind.Star);
  const look = appearance[flight.targetId];
  if (!target || !star || !look) return;

  const standoff = radius(look) / DISTANCE_SCALE;
  const k = ease(Math.min(1, (now - flight.startedAt) / DURATION_MS));

  camera.position.lerpVectors(
    origin.set(flight.from.x, flight.from.y, flight.from.z),
    toScene(vantage(target.position, star.position, standoff)),
    k,
  );
  controls.target.lerpVectors(
    originTarget.set(flight.fromTarget.x, flight.fromTarget.y, flight.fromTarget.z),
    toScene(target.position),
    k,
  );
  camera.lookAt(controls.target);

  if (k >= 1) push({ kind: EActionKind.Release });
}
