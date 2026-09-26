import type { PerspectiveCamera, Scene } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { BUBBLE_CLASS } from "../constants/bubble";
import { dispatch } from "../state/queue";
import { focusAction } from "./focusAction";

export function createBubble(
  scene: Scene,
  camera: PerspectiveCamera,
  controls: OrbitControls,
): CSS2DObject {
  const element = document.createElement("aside");
  element.className = BUBBLE_CLASS;

  const heading = document.createElement("h2");
  const text = document.createElement("p");
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Back to overview");
  button.textContent = "×";
  button.addEventListener("click", () => dispatch(focusAction(null, camera, controls)));

  element.append(heading, text, button);

  const bubble = new CSS2DObject(element);
  bubble.center.set(0, 0.5);
  bubble.visible = false;
  scene.add(bubble);

  return bubble;
}
