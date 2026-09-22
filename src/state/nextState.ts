import type { TState } from "../types/state";

import { MS_PER_SECOND } from "../constants/time";

export function nextState(state: TState, elapsedMs: number): TState {
  return {
    ...state,
    date: state.date + (elapsedMs / MS_PER_SECOND) * state.rate
  };
}
