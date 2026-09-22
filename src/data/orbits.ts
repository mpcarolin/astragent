import type { TBody } from "../types/body";
import type { TVec3 } from "../types/vec3";

import { EBodyKind } from "../types/body";
import { ORBIT_SEGMENTS } from "../constants/annotations";
import { ellipse } from "../simulator/ellipse";

export function orbits(bodies: readonly TBody[], jd: number): ReadonlyMap<string, readonly TVec3[]> {
  return new Map(
    bodies
      .filter((body) => body.kind !== EBodyKind.Star)
      .map((body) => [body.id, ellipse(body.orbit.elementsAt(jd), ORBIT_SEGMENTS)]),
  );
}
