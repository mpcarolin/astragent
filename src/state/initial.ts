import type { TState } from "../types/state";

import { START_POSITION } from "../constants/camera";
import { DURATION_MS } from "../constants/focus";
import { INITIAL_RATE, MS_PER_DAY, UNIX_EPOCH_JD } from "../constants/time";

export function initial(now: Date): TState {
  return {
    date: now.getTime() / MS_PER_DAY + UNIX_EPOCH_JD,
    rate: INITIAL_RATE,
    focus: {
      targetId: null,
      startedAt: -DURATION_MS,
      from: START_POSITION,
      fromTarget: { x: 0, y: 0, z: 0 },
    },
    pointer: null,
  };
}
