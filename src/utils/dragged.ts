import type { TVec2 } from "../types/vec2";

import { DRAG_SLOP } from "../constants/controls";

export function dragged(from: TVec2, to: TVec2): boolean {
  return Math.hypot(to.x - from.x, to.y - from.y) > DRAG_SLOP;
}
