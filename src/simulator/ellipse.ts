import type { TKeplerianElements } from "../types/elements";
import type { TVec3 } from "../types/vec3";

import { position } from "./position";

export function ellipse(elements: TKeplerianElements, segments: number): readonly TVec3[] {
  return Array.from({ length: segments }, (_, k) => {
    const anomaly = (2 * Math.PI * k) / segments;
    return position({
      ...elements,
      meanAnomaly: anomaly - elements.eccentricity * Math.sin(anomaly),
    });
  });
}
