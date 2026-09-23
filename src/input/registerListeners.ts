import type { TListeners } from "../types/listeners";

import { EActionKind } from "../types/action";

import { pointerUp } from "../scene/pointerUp";
import { resize } from "../scene/resize";
import { dispatch } from "../state/queue";

export function registerListeners(handles: TListeners): void {
  const { canvas, camera, controls, bodies, renderer, labelRenderer } = handles;

  window.addEventListener("resize", () => resize(renderer, labelRenderer, camera));
  resize(renderer, labelRenderer, camera);

  canvas.addEventListener("pointerdown", (event) => {
    dispatch({ kind: EActionKind.PointerDown, x: event.clientX, y: event.clientY });
  });

  canvas.addEventListener("pointermove", (event) => {
    dispatch({ kind: EActionKind.PointerMove, x: event.clientX, y: event.clientY });
  });

  canvas.addEventListener("pointerup", (event) => {
    dispatch(pointerUp(event, camera, controls, bodies));
  });

  canvas.addEventListener("wheel", () => dispatch({ kind: EActionKind.FocusRelease }));
}
