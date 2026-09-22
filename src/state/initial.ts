import type { TState } from "../types/state";

import { DAYS_PER_SECOND, MS_PER_DAY, UNIX_EPOCH_JD } from "../constants/time";

export function initial(now: Date): TState {
  return {
    date: now.getTime() / MS_PER_DAY + UNIX_EPOCH_JD,
    rate: DAYS_PER_SECOND,
    focus: null,
    pointer: null,
  };
}
