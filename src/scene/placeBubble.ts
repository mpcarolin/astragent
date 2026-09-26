import type { PerspectiveCamera } from "three";
import type { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import type { TLocated } from "../types/located";
import type { TState } from "../types/state";

import { BUBBLE_GAP } from "../constants/bubble";
import { descriptions } from "../data/descriptions";
import { isFocusComplete } from "../utils/isFocusComplete";
import { anchor } from "./anchor";
import { appearance } from "./appearance";
import { extent } from "./extent";
import { toScene } from "./toScene";

type TPlaceBubbleParams = {
  readonly bubble: CSS2DObject;
  readonly state: TState;
  readonly located: readonly TLocated[];
  readonly camera: PerspectiveCamera;
  readonly now: number;
};

export function placeBubble(params: TPlaceBubbleParams): void {
  const { bubble, state, located, camera, now } = params;
  const { focus } = state;
  const { targetId } = focus;
  bubble.visible = targetId !== null && isFocusComplete(focus, now);
  if (targetId === null || !bubble.visible) {
    return;
  }

  const target = located.find(({ body }) => body.id === targetId);
  const look = appearance[targetId];
  if (!target || !look) {
    bubble.visible = false;
    return;
  }

  const element = bubble.element;
  if (element.dataset.bodyId !== targetId) {
    const heading = element.querySelector("h2");
    const text = element.querySelector("p");
    if (heading) {
      heading.textContent = target.body.name;
    }
    if (text) {
      text.textContent = descriptions[target.body.id] ?? "";
    }
    element.dataset.bodyId = targetId;
  }

  bubble.position.copy(
    anchor(toScene(target.position), camera.quaternion, extent(target.body, look) * BUBBLE_GAP),
  );
}
