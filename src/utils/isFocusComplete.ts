import type { TFocus } from "../types/focus";

import { DURATION_MS } from "../constants/focus";

export function isFocusComplete(focus: TFocus, now: number): boolean {
  return (now - focus.startedAt) >= DURATION_MS;
}
