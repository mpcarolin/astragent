import type { TBody } from "./body";
import type { TVec3 } from "./vec3";

export type TLocated = {
  readonly body: TBody;
  readonly position: TVec3;
};
