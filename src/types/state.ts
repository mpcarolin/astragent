import type { TFocus } from "./focus";
import type { TVec2 } from "./vec2";

export type TState = {
  /** current julian date in scene */
  readonly date: number;

  /** days per second. */
  readonly rate: number;

  /** the camera flight in progress, or null when the user has control. */
  readonly focus: TFocus | null;

  /** where the pointer went down, or null when it is up or has been dragged. */
  readonly pointer: TVec2 | null;
};
