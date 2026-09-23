import type { TListeners } from "../types/listeners";

import { EActionKind } from "../types/action";
import { PLANET_NAMES } from "../constants/input";

import { resize } from "../scene/resize";
import { dispatch } from "../state/queue";
import { pointerUp } from "../scene/pointerUp";
import { focusAction } from "../scene/focusAction";

export function registerListeners(handles: TListeners): void {
  const { canvas, camera, controls, bodies, renderer, labelRenderer } = handles;

  window.addEventListener("keyup", (event) => {
    if (/[0-9]/.test(event.key)) {
      const index = parseInt(event.key);

      const name = PLANET_NAMES[index];
      if (!name) return;

      const body = bodies.get(name);
      if (!body) return;

      dispatch(focusAction(name, camera, controls));
    }
  });

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
