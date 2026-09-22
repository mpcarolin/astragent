import type { TListeners } from "../types/listeners";

import { EActionKind } from "../types/action";

import { pointerUp } from "../scene/pointerUp";
import { resize } from "../scene/resize";
import { push } from "../state/queue";

export function registerListeners(handles: TListeners): void {
  const { canvas, camera, controls, bodies, renderer, labelRenderer } = handles;

  window.addEventListener("resize", () => resize(renderer, labelRenderer, camera));
  resize(renderer, labelRenderer, camera);

  canvas.addEventListener("pointerdown", (event) => {
    push({ kind: EActionKind.PointerDown, x: event.clientX, y: event.clientY });
  });

  canvas.addEventListener("pointermove", (event) => {
    push({ kind: EActionKind.PointerMove, x: event.clientX, y: event.clientY });
  });

  canvas.addEventListener("pointerup", (event) => {
    push(pointerUp(event, camera, controls, bodies));
  });

  canvas.addEventListener("wheel", () => push({ kind: EActionKind.Release }));
}
