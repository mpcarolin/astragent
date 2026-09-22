import type { TVec3 } from "./vec3";

export type TFocus = {
  readonly targetId: string;
  readonly startedAt: number;
  readonly from: TVec3;
  readonly fromTarget: TVec3;
};
