import type { TListeners } from "../types/listeners";

import { EActionKind } from "../types/action";
import { PLANET_NAMES } from "../constants/input";

import { resize } from "../scene/resize";
import { dispatch } from "../state/queue";
import { pointerUp } from "../scene/pointerUp";
import { createFocusAction } from "../scene/createFocusAction";

export function registerListeners(handles: TListeners): void {
  const { canvas, camera, controls, bodies, renderer, labelRenderer } = handles;

  window.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }

    // planet focus shortcuts
    if (/[0-9]/.test(event.key)) {
      const index = parseInt(event.key);

      const name = PLANET_NAMES[index];
      if (!name) return;

      const body = bodies.get(name);
      if (!body) return;

      return dispatch(createFocusAction(name, camera, controls));
    }

    // play/pause with space
    if (event.key === " " || event.code === "Space") {
      dispatch({ kind: EActionKind.ToggleRate });
    }

    // release focus with escape
    if (event.key === "Escape") {
      dispatch(createFocusAction(null, camera, controls));
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
    dispatch(pointerUp({ event, camera, controls, meshes: bodies }));
  });
}
