import type { TVec3 } from "./vec3";

export type TFocus = {
  readonly targetId: string | null;
  readonly startedAt: number;
  readonly from: TVec3;
  readonly fromTarget: TVec3;
};
