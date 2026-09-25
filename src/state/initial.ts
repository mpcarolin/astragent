import type { TState } from "../types/state";

import { INITIAL_RATE, MS_PER_DAY, UNIX_EPOCH_JD } from "../constants/time";

export function initial(now: Date): TState {
  return {
    date: now.getTime() / MS_PER_DAY + UNIX_EPOCH_JD,
    rate: INITIAL_RATE,
    focus: null,
    pointer: null,
  };
}
