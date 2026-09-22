import type { TBody } from "../types/body";
import type { TLocated } from "../types/located";
import type { TVec3 } from "../types/vec3";

import { EBodyKind } from "../types/body";

import { add } from "../utils/add";
import { propagate } from "./propagate";

export function simulate(bodies: readonly TBody[], jd: number): readonly TLocated[] {
  const byId = new Map(bodies.map((body) => [body.id, body]));

  const absolute = (body: TBody, seen: readonly string[]): TVec3 => {
    if (body.kind === EBodyKind.Star) return propagate(body, jd);
    if (seen.includes(body.id)) throw new Error(`orbit cycle through "${body.id}"`);

    const parent = byId.get(body.orbit.parent);
    if (!parent) throw new Error(`no body with id "${body.orbit.parent}"`);

    return add(absolute(parent, [...seen, body.id]), propagate(body, jd));
  };

  return bodies.map((body) => ({ body, position: absolute(body, []) }));
}
