import type { TBody } from "../types/body";
import type { TVec3 } from "../types/vec3";

import { EBodyKind } from "../types/body";

import { position } from "./position";

export function propagate(body: TBody, jd: number): TVec3 {
  if (body.kind === EBodyKind.Star) return { x: 0, y: 0, z: 0 };
  return position(body.orbit.elementsAt(jd));
}
