import type { TAction } from "../types/action";
import type { TState } from "../types/state";

import { EActionKind } from "../types/action";

import { MS_PER_SECOND } from "../constants/time";
import { dragged } from "../utils/dragged";

export function reducer(state: TState, action: TAction): TState {
  switch (action.kind) {
    case EActionKind.Tick:
      return {
        ...state,
        date: state.date + (action.elapsedMs / MS_PER_SECOND) * state.rate,
      };

    case EActionKind.Focus: {
      const { kind, ...focus } = action;
      return { ...state, focus };
    }

    case EActionKind.Release:
      return { ...state, focus: null };

    case EActionKind.PointerDown:
      return { ...state, pointer: { x: action.x, y: action.y } };

    case EActionKind.PointerMove:
      if (!state.pointer) return state;
      if (!dragged(state.pointer, action)) return state;
      return { ...state, pointer: null, focus: null };

    case EActionKind.PointerUp: {
      const clicked =
        state.pointer !== null && !dragged(state.pointer, action) && action.focus !== null;
      return { ...state, pointer: null, focus: clicked ? action.focus : state.focus };
    }
  }
}
