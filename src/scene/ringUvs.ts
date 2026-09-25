import type { BufferAttribute, InterleavedBufferAttribute } from "three";
import type { TRingRadius } from "../types/appearance";

import { Float32BufferAttribute } from "three";
import { RING_STRIP_V } from "../constants/textures";

export function ringUvs(
  position: BufferAttribute | InterleavedBufferAttribute,
  edges: TRingRadius,
): BufferAttribute {
  const uvs = Array.from({ length: position.count }, (_, i) => {
    const distance = Math.hypot(position.getX(i), position.getY(i));
    return [(distance - edges.inner) / (edges.outer - edges.inner), RING_STRIP_V];
  }).flat();
  return new Float32BufferAttribute(uvs, 2);
}
